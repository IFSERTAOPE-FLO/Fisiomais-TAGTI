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

@main.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({"message": "Pong!"})

@main.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '')
    senha = data.get('senha', '')

    # Verificar se o email pertence a um colaborador
    colaborador = Colaboradores.query.filter_by(email=email).first()
    if colaborador and colaborador.check_password(senha):
        access_token = create_access_token(identity=email)
        response = {
            "access_token": access_token,
            "userId": colaborador.ID_Colaborador,  # Inclui o ID
            "name": colaborador.nome,
            "photo": colaborador.photo if colaborador.photo else "",  # Retorna vazio se não houver foto
            "role": "admin" if colaborador.is_admin else "colaborador"
        }
        return jsonify(response), 200

    # Verificar se o email pertence a um cliente
    cliente = Clientes.query.filter_by(email=email).first()
    if cliente and cliente.check_password(senha):
        access_token = create_access_token(identity=email)
        return jsonify(
            access_token=access_token,
            userId=cliente.ID_Cliente,  # Inclui o ID
            name=cliente.nome,
            role="cliente",
            photo=cliente.photo if cliente.photo else ""  # Retorna vazio se não houver foto
        ), 200

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


@main.route('/api/horarios-disponiveis', methods=['GET'])
def get_horarios_disponiveis():
    data = request.args.get('data')
    servico_id = request.args.get('servico_id')

    try:
        data_formatada = datetime.strptime(data, '%Y-%m-%d')
    except ValueError:
        return jsonify({"error": "Formato de data inválido"}), 400

    # Filtrar colaboradores que atendem ao serviço solicitado
    colaboradores = Colaboradores.query.filter(
        Colaboradores.servicos.any(ID_Servico=servico_id)).all()

    if not colaboradores:
        return jsonify({"error": "Nenhum colaborador encontrado para o serviço solicitado"}), 404

    horarios_status = []  # Lista para armazenar os horários com status

    # Obter horários disponíveis dos colaboradores
    for colaborador in colaboradores:
        for horario in colaborador.horarios:
            # Combinar data e hora para verificar disponibilidade
            data_e_hora = datetime.combine(data_formatada, datetime.strptime(horario.inicio, "%H:%M").time())
            
            # Verificar se o horário já foi agendado
            ocupado = not horario_disponivel(data_e_hora, colaborador.ID_Colaborador)
            
            horarios_status.append({
                "colaborador": colaborador.nome,
                "horario": f"{horario.dia} {horario.inicio}-{horario.fim}",
                "ocupado": ocupado
            })

    # Remover duplicados e ordenar por horário
    horarios_status = sorted(horarios_status, key=lambda x: x["horario"])

    return jsonify(horarios_status)


def horario_disponivel(data_e_hora, colaborador_id):
    """Verifica se o horário está disponível para o colaborador"""
    agendamento_existente = Agendamentos.query.filter_by(
        ID_Colaborador=colaborador_id,
        data_e_hora=data_e_hora
    ).first()
    
    return agendamento_existente is None


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
    servico_nome = agendamento.servico.Nome_servico  # Nome do serviço
    data_agendamento = agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')  # Data e hora do agendamento
    cliente_email = agendamento.cliente.email  # E-mail do cliente
    colaborador_email = agendamento.colaborador.email  # E-mail do colaborador

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


