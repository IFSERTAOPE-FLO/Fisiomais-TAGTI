from flask import Blueprint, current_app, send_from_directory, request, jsonify
from datetime import datetime, timedelta
from app.models import Agendamentos, Clientes, Colaboradores, ColaboradoresServicos, Servicos, Horarios,  BlacklistedToken, db
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







    

# Endpoint para retornar os serviços disponíveis


@main.route('/api/clientes', methods=['GET'])
def get_clientes():
    clientes = Clientes.query.all()  # Pegue todos os clientes cadastrados
    clientes_list = [{"ID_Cliente": s.ID_Cliente, "Nome": s.nome} for s in clientes]  # Corrigido o campo 'Nome'
    return jsonify(clientes_list)



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



def horario_disponivel(data_e_hora, colaborador_id):
    agendamento_existente = Agendamentos.query.filter_by(
        ID_Colaborador=colaborador_id,
        data_e_hora=data_e_hora
    ).first()
    
    return agendamento_existente is None




@main.route('/api/listar_agendamentos', methods=['GET'])
@jwt_required()
def listar_agendamentos():
    try:
        usuario_email = get_jwt_identity()

        # Identifica se o usuário é colaborador ou cliente
        usuario = Colaboradores.query.filter_by(email=usuario_email).first()
        if not usuario:
            usuario = Clientes.query.filter_by(email=usuario_email).first()
            if not usuario:
                return jsonify({'message': 'Usuário não encontrado'}), 404

        # Busca os agendamentos conforme o tipo de usuário
        if isinstance(usuario, Colaboradores):
            agendamentos = Agendamentos.query.all()
        elif isinstance(usuario, Clientes):
            agendamentos = Agendamentos.query.filter_by(ID_Cliente=usuario.ID_Cliente).all()

        if not agendamentos:
            return jsonify({'message': 'Nenhum agendamento encontrado'}), 404

        agendamentos_data = []
        for agendamento in agendamentos:
            cliente = Clientes.query.get(agendamento.ID_Cliente)
            servico = Servicos.query.get(agendamento.ID_Servico)
            colaborador = Colaboradores.query.get(agendamento.ID_Colaborador)  # Adicionado para buscar o colaborador

            plano_pagamento = []
            if servico and servico.tipo_servico == 'pilates' and hasattr(agendamento, 'ID_Plano'):  # Verifica se o plano está associado ao agendamento
                plano_selecionado = next((plano for plano in servico.planos if plano['ID_Plano'] == agendamento.ID_Plano), None)
                if plano_selecionado:
                    plano_pagamento.append(plano_selecionado)

            agendamentos_data.append({
                'id': agendamento.ID_Agendamento,
                'nome_cliente': cliente.nome if cliente else 'Cliente não encontrado',
                'data': agendamento.data_e_hora.strftime('%Y-%m-%d'),
                'hora': agendamento.data_e_hora.strftime('%H:%M'),
                'nome_servico': servico.Nome_servico if servico else 'Serviço não encontrado',
                'valor_servico': float(servico.Valor) if servico and servico.Valor else None,
                'nome_colaborador': colaborador.nome if colaborador else 'Colaborador não encontrado',  # Adicionado
                'plano_pagamento': plano_pagamento
            })

        return jsonify(agendamentos_data), 200

    except Exception as e:
        print(f"Erro ao carregar agendamentos: {str(e)}")
        return jsonify({'message': f'Erro ao carregar agendamentos: {str(e)}'}), 500



@main.route('/api/deletar_agendamento/<int:id>', methods=['DELETE'])
@jwt_required()
def deletar_agendamento(id):
    try:
        agendamento = Agendamentos.query.get(id)

        if not agendamento:
            return jsonify({'message': 'Agendamento não encontrado'}), 404

        db.session.delete(agendamento)
        db.session.commit()

        return jsonify({'message': 'Agendamento deletado com sucesso'}), 200
    except Exception as e:
        print(f"Erro ao deletar agendamento: {str(e)}")
        return jsonify({'message': f'Erro ao deletar agendamento: {str(e)}'}), 500


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




@main.route('/api/agendamento', methods=['POST'])
@jwt_required()
def agendamento():
    data = request.get_json()

    # Obter o email do usuário logado
    usuario_email = get_jwt_identity()

    # Consultar o cliente ou colaborador logado pelo email
    cliente = Clientes.query.filter_by(email=usuario_email).first()
    colaborador = Colaboradores.query.filter_by(email=usuario_email).first()

    if not cliente and not colaborador:
        return jsonify({'message': 'Usuário não encontrado'}), 404

    # Verificar se o colaborador está agendando para um cliente específico
    if colaborador and 'cliente_id' in data and data['cliente_id']:
        cliente = Clientes.query.get(data['cliente_id'])
        if not cliente:
            return jsonify({'message': 'Cliente não encontrado'}), 404
    elif not colaborador:
        # Usuário logado deve ser cliente
        if not cliente:
            return jsonify({'message': 'Cliente não encontrado'}), 404

    # Obter o colaborador selecionado
    colaborador = Colaboradores.query.get(data['colaborador_id'])
    if not colaborador:
        return jsonify({'message': 'Colaborador não encontrado'}), 404

    # Obter o serviço selecionado
    servico = Servicos.query.get(data['servico_id'])
    if not servico:
        return jsonify({'message': 'Serviço não encontrado'}), 404

    # Validar o plano apenas para serviços que não sejam fisioterapia
    plano_id = data.get('plano_id')
    if servico.tipo_servico != 'fisioterapia':  # Verifica o tipo do serviço
        if plano_id is None:
            return jsonify({'message': 'Plano não fornecido'}), 400
        if not servico.planos:
            return jsonify({'message': 'O serviço selecionado não possui planos'}), 400

        plano_selecionado = next((p for p in servico.planos if p['ID_Plano'] == plano_id), None)
        if not plano_selecionado:
            return jsonify({'message': 'Plano não encontrado'}), 404
    else:
        plano_id = None  # Remove o plano para serviços de fisioterapia

    try:
        # Verificar disponibilidade do horário
        data_e_hora = datetime.fromisoformat(data['data']).astimezone(BRASILIA)

        if not horario_disponivel(data_e_hora, colaborador.ID_Colaborador):
            return jsonify({'message': 'Horário não disponível'}), 400

        # Criar agendamento
        novo_agendamento = Agendamentos(
            data_e_hora=data_e_hora,
            ID_Cliente=cliente.ID_Cliente,
            ID_Colaborador=colaborador.ID_Colaborador,
            ID_Servico=servico.ID_Servico,
            ID_Plano=plano_id  
        )

        db.session.add(novo_agendamento)
        db.session.commit()

        # Enviar notificações de e-mail
        subject_cliente = "Lembrete: Seu atendimento foi agendado!"
        body_cliente = f"Olá {cliente.nome},\n\nSeu atendimento foi agendado para {data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\nAtenciosamente,\nEquipe FisioMais"
        msg_cliente = Message(subject=subject_cliente, recipients=[cliente.email], body=body_cliente)

        subject_colaborador = "Novo agendamento"
        body_colaborador = f"Olá {colaborador.nome},\n\nVocê tem um atendimento agendado para o cliente {cliente.nome} em {data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\nAtenciosamente,\nEquipe FisioMais"
        msg_colaborador = Message(subject=subject_colaborador, recipients=[colaborador.email], body=body_colaborador)

        subject_sender = "Novo agendamento realizado"
        body_sender = f"Um novo agendamento foi realizado para o cliente {cliente.nome} com o colaborador {colaborador.nome} em {data_e_hora.strftime('%d/%m/%Y %H:%M')}."
        msg_sender = Message(subject=subject_sender, recipients=[current_app.config['MAIL_DEFAULT_SENDER']], body=body_sender)

        try:
            mail.send(msg_cliente)
            mail.send(msg_colaborador)
            mail.send(msg_sender)
        except Exception as e:
            print(f"Erro ao enviar e-mail: {str(e)}")

        return jsonify({'message': 'Agendamento realizado com sucesso e notificações enviadas'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao criar agendamento: {str(e)}'}), 500


def horario_disponivel(data_e_hora, colaborador_id):
    agendamento_existente = Agendamentos.query.filter_by(
        ID_Colaborador=colaborador_id,
        data_e_hora=data_e_hora
    ).first()
    return agendamento_existente is None









    
