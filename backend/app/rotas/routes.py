from flask import Blueprint, current_app, send_from_directory, request, jsonify
from datetime import datetime, timedelta
from app.models import Agendamentos, Clientes, Colaboradores, Servicos,  BlacklistedToken, db
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token

from flask_mail import Message
from app import mail
from sqlalchemy import cast, Date
from pytz import timezone
import os

main = Blueprint('main', __name__)

"""
Rotas POST:
1. '/login' - Rota POST para autenticar usuários (colaboradores ou clientes) com base em e-mail e senha, retornando tokens de acesso e informações do usuário.
2. '/logout' - Rota POST protegida que realiza logout adicionando o token à blacklist.
3. '/refresh-token' - Rota POST protegida que gera um novo token de acesso com base em um refresh token válido.
4. '/api/notificar_admin' - Rota POST protegida para notificar administrador, colaborador e cliente sobre o cancelamento de um agendamento, enviando e-mails detalhados.
5. '/api/contato' - Rota POST para receber mensagens de contato e enviar um e-mail ao administrador com os detalhes.
"""



@main.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '')
    senha = data.get('senha', '')

    # Verificar se o email pertence a um colaborador
    colaborador = Colaboradores.query.filter_by(email=email).first()
    if colaborador and colaborador.check_password(senha):
        access_token = create_access_token(identity=email)
        refresh_token = create_access_token(identity=email, fresh=False)  # Criação do refresh_token

        response = {
            "access_token": access_token,
            "refresh_token": refresh_token,  # Inclui o refresh_token
            "userId": colaborador.id_colaborador,
            "name": colaborador.nome,
            "photo": colaborador.photo if colaborador.photo else "",
            "role": "admin" if colaborador.is_admin else "colaborador",
            "admin_nivel": colaborador.admin_nivel if colaborador.is_admin else None,
            "email_confirmado": True  # Colaboradores sempre têm email confirmado
        }
        return jsonify(response), 200

    # Verificar se o email pertence a um cliente
    cliente = Clientes.query.filter_by(email=email).first()
    if cliente:
        # Se o cliente ainda não confirmou o email
        if not cliente.email_confirmado and cliente.check_password(senha):
            access_token = create_access_token(identity=email)
            refresh_token = create_access_token(identity=email, fresh=False)  # Criação do refresh_token

            return jsonify({
                "message": "Seu cadastro foi realizado com sucesso! Verifique seu email para confirmação.",
                "access_token": access_token,
                "refresh_token": refresh_token,  # Inclui o refresh_token
                "userId": cliente.id_cliente,
                "name": cliente.nome,
                "role": "cliente",
                "photo": cliente.photo if cliente.photo else "",
                "email_confirmado": False
            }), 200

        # Se o cliente confirmou o email e a senha está correta
        if cliente.check_password(senha):
            access_token = create_access_token(identity=email)
            refresh_token = create_access_token(identity=email, fresh=False)  # Criação do refresh_token
            return jsonify({
                "access_token": access_token,
                "refresh_token": refresh_token,  # Inclui o refresh_token
                "userId": cliente.id_cliente,
                "name": cliente.nome,
                "role": "cliente",
                "photo": cliente.photo if cliente.photo else "",
                "email_confirmado": True
            }), 200

    # Se o email ou senha estiverem incorretos
    return jsonify(message="Credenciais inválidas"), 401





@main.route('/logout', methods=['POST'])
@jwt_required()  # Garantir que o JWT esteja presente
def logout():
    jti = get_jwt_identity()  # Obtém a identidade do JWT

    # Verifica se o token já está na blacklist e remove o registro
    blacklisted_token = db.session.query(BlacklistedToken).filter_by(jti=jti).first()

    if blacklisted_token:
        # Se o token já está na blacklist, remove-o antes de adicionar novamente
        db.session.delete(blacklisted_token)
        db.session.commit()

    # Adiciona o token à blacklist
    new_blacklisted_token = BlacklistedToken(jti=jti)
    db.session.add(new_blacklisted_token)
    db.session.commit()  # Commit das mudanças no banco

    return jsonify(message="Logout realizado com sucesso"), 200
@main.route('/', methods=['OPTIONS'])
def handle_options():
    return '', 200



@main.route('/refresh-token', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    try:
        current_user = get_jwt_identity()
        print(f"Token válido para o usuário: {current_user}")  # Log para verificar o usuário
        new_access_token = create_access_token(identity=current_user)
        return jsonify(access_token=new_access_token), 200
    except Exception as e:
        print(f"Erro ao renovar o token: {str(e)}")  # Log para verificar o erro
        return jsonify({"error": "Erro ao renovar o token"}), 422



@main.route('/api/notificar_admin', methods=['POST'])
@jwt_required()
def notificar_admin():
    agendamento_id = request.json.get('agendamento_id')

    # Encontrar o agendamento pelo ID
    agendamento = Agendamentos.query.get(agendamento_id)

    if not agendamento:
        return jsonify({'message': 'Agendamento não encontrado'}), 404

    # Obter dados do agendamento
    cliente_nome = agendamento.cliente.nome  # Nome do cliente
    colaborador_nome = agendamento.colaborador.nome  # Nome do colaborador
    servico_nome = agendamento.servico.nome  # Nome do serviço
    data_agendamento = agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')  # Data e hora do agendamento
    cliente_email = agendamento.cliente.email  # E-mail do cliente
    colaborador_email = agendamento.colaborador.email  # E-mail do colaborador
    clinica = agendamento.clinica
    clinica_nome = clinica.nome if clinica else "Não especificada"
    clinica_endereco = (
        f"{clinica.endereco.rua}, {clinica.endereco.numero}, "
        f"{clinica.endereco.bairro}, {clinica.endereco.cidade} - {clinica.endereco.estado}"
        if clinica and clinica.endereco else "Endereço não especificado"
    )
    clinica_telefone = clinica.telefone if clinica else "Não especificado"

    # Criar o e-mail para o administrador
    subject = f'Cancelamento de Agendamento - {cliente_nome}'
    body = f'''
    Olá FisioMais,

    O cliente {cliente_nome} solicitou o cancelamento do agendamento.
    
    Detalhes do agendamento:
    - Cliente: {cliente_nome}
    - Colaborador: {colaborador_nome}
    - Serviço: {servico_nome}
    - Data e Hora: {data_agendamento}
    - Clínica: {clinica_nome}
    - Endereço da Clínica: {clinica_endereco}
    - Telefone da Clínica: {clinica_telefone}

    Por favor, tome as medidas necessárias.

    Atenciosamente,
    Sistema de Agendamentos
    '''

    msg_admin = Message(subject=subject, recipients=['fisiomaispilatesefisioterapia@gmail.com'], body=body)

    # Criar o e-mail para o colaborador
    subject_colaborador = f'Cancelamento de Agendamento - {cliente_nome}'
    body_colaborador = f'''
    Olá {colaborador_nome},

    O cliente {cliente_nome} solicitou o cancelamento do agendamento para o serviço {servico_nome}.
    
    Detalhes do agendamento:
    - Cliente: {cliente_nome}
    - Serviço: {servico_nome}
    - Data e Hora: {data_agendamento}
    - Clínica: {clinica_nome}
    - Endereço da Clínica: {clinica_endereco}
    - Telefone da Clínica: {clinica_telefone}

    Por favor, tome as medidas necessárias.

    Atenciosamente,
    Sistema de Agendamentos
    '''

    msg_colaborador = Message(subject=subject_colaborador, recipients=[colaborador_email], body=body_colaborador)

    # Criar o e-mail para o cliente
    subject_cliente = f'Cancelamento do seu Agendamento - {servico_nome}'
    body_cliente = f'''
    Olá {cliente_nome},

    Informamos que seu pedido de cancelamento do agendamento para o serviço {servico_nome} foi encaminhado com sucesso.

    Detalhes do agendamento:
    - Serviço: {servico_nome}
    - Data e Hora: {data_agendamento}
    - Clínica: {clinica_nome}
    - Endereço da Clínica: {clinica_endereco}
    - Telefone da Clínica: {clinica_telefone}

    Retornaremos por e-mail informando se o cancelamento foi possível ou se haverá algum custo relacionado ao processo.

    Caso tenha mais dúvidas, entre em contato conosco.

    Atenciosamente,
    FisioMais
    '''
    
    msg_cliente = Message(subject=subject_cliente, recipients=[cliente_email], body=body_cliente)

    try:
        # Enviar os e-mails
        mail.send(msg_admin)
        mail.send(msg_colaborador)
        mail.send(msg_cliente)
        return jsonify({'message': 'Administrador, colaborador e cliente notificados com sucesso!'}), 200
    except Exception as e:
        return jsonify({'message': f'Erro ao enviar e-mail: {str(e)}'}), 500

    
@main.route('/api/contato', methods=['POST'])
def contato():
    data = request.get_json()

    nome = data.get('nome')
    email = data.get('email')
    telefone = data.get('telefone')
    mensagem = data.get('mensagem')

    if not all([nome, email, telefone, mensagem]):
        return jsonify({'message': 'Todos os campos são obrigatórios.'}), 400

    try:
        # Criar a mensagem de e-mail
        subject = f'Nova Mensagem de Contato - {nome}'
        body = f'''
        Olá Admin,

        Você recebeu uma nova mensagem de contato:

        - Nome: {nome}
        - E-mail: {email}
        - Telefone: {telefone}

        Mensagem:
        {mensagem}

        Atenciosamente,
        Seu sistema de contatos
        '''
        msg = Message(subject=subject, recipients=['fisiomaispilatesefisioterapia@gmail.com'], body=body)

        # Enviar o e-mail
        mail.send(msg)
        return jsonify({'message': 'Mensagem enviada com sucesso!'}), 200
    except Exception as e:
        return jsonify({'message': f'Erro ao enviar mensagem: {str(e)}'}), 500



BRASILIA = timezone('America/Sao_Paulo')

# Função de notificação agendada
def notificar_atendimentos():
    # Definir o dia de amanhã no fuso horário de Brasília
    amanha = datetime.now(BRASILIA) + timedelta(days=1)
    amanha_date = amanha.date()  # Só a data (sem a hora)

    # Buscar os agendamentos para amanhã
    agendamentos = Agendamentos.query.filter(cast(Agendamentos.data_e_hora, Date) == amanha_date).all()

    if not agendamentos:
        print("Nenhum atendimento agendado para amanhã.")
        return

    # Enviar email para cada cliente
    for agendamento in agendamentos:
        cliente = Clientes.query.filter_by(id=agendamento.ID_Cliente).first()

        if cliente:
            subject = "Lembrete: Seu atendimento está agendado para amanhã!"
            body = f"Olá {cliente.nome},\n\nLembrete: Você tem um atendimento agendado para amanhã, {amanha_date}.\n\nAtenciosamente,\nEquipe FisioMais"

            msg = Message(subject=subject, recipients=[cliente.email], body=body)

            try:
                mail.send(msg)
                print(f"Notificação enviada para {cliente.email}")
            except Exception as e:
                print(f"Erro ao enviar email: {str(e)}")


BRASILIA = timezone('America/Sao_Paulo')

# Função para enviar o e-mail de notificação
def enviar_email(destinatario, agendamento):
    """Envia um e-mail de notificação sobre o agendamento."""
    msg = Message(
        'Lembrete: Seu atendimento é amanhã!',
        sender='fisiomaispilatesefisioterapia@gmail.com',
        recipients=[destinatario]
    )
    msg.body = f"""
    Olá, {destinatario}!

    Lembre-se que seu atendimento está agendado para amanhã, {agendamento.data_e_hora.strftime('%d/%m/%Y')} às {agendamento.data_e_hora.strftime('%H:%M')}.
    Aguardamos você!

    Atenciosamente,
    Equipe Fisiomais
    """
    try:
        mail.send(msg)
        print(f"Notificação enviada para {destinatario}")
    except Exception as e:
        print(f"Erro ao enviar email: {str(e)}")

# Função que verifica os agendamentos e envia as notificações
def notificar_atendimentos():
    """Verifica os agendamentos do dia seguinte e envia notificações por e-mail."""
    # Definir o dia de amanhã
    amanha = datetime.today() + timedelta(days=1)
    amanha_date = amanha.date()

    # Buscar os agendamentos para amanhã
    agendamentos = Agendamentos.query.filter(cast(Agendamentos.data_e_hora, Date) == amanha_date).all()

    if not agendamentos:
        print("Nenhum atendimento agendado para amanhã.")
        return

    # Enviar e-mail para cada cliente com agendamento
    for agendamento in agendamentos:
        cliente = Clientes.query.filter_by(id=agendamento.ID_Cliente).first()
        
        if cliente:
            enviar_email(cliente.email, agendamento)


