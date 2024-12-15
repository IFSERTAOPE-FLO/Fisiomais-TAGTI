from flask import Blueprint, current_app, send_from_directory, request, jsonify
from datetime import datetime, timedelta
from app.models import Agendamentos, Clientes, Colaboradores, ColaboradoresServicos, Servicos,  BlacklistedToken, db
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename
from flask_mail import Message
from app import mail
from sqlalchemy import cast, Date
from pytz import timezone
import os



main = Blueprint('main', __name__)

@main.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({"message": "Pong!"})

@main.route('/form', methods=['GET'])
def form():
    return jsonify({"message": "Este endpoint não precisa de template"})

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


# Rota para registro do cliente
@main.route('/register', methods=['POST'])
def register():
    # Capturar os dados do cliente
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
    cpf = data.get('cpf')
    senha = data.get('senha')
    telefone = data.get('telefone', '')
    referencias = data.get('referencias', '')
    endereco = data.get('endereco', '')
    rua = data.get('rua', '')
    estado = data.get('estado', '')
    cidade = data.get('cidade', '')
    bairro = data.get('bairro', '')
    dt_nasc_str = data.get('dt_nasc', None)

    # Validar CPF
    if not is_cpf_valid(cpf):
        return jsonify({"message": "CPF inválido."}), 400

    # Validar data de nascimento
    dt_nasc = None
    if dt_nasc_str:
        try:
            dt_nasc = datetime.strptime(dt_nasc_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "Data de nascimento em formato inválido. Use AAAA-MM-DD."}), 400

    # Verificar duplicidade de email e CPF
    if Clientes.query.filter((Clientes.email == email) | (Clientes.cpf == cpf)).first():
        return jsonify({"message": "Email ou CPF já cadastrado."}), 400

    # Criptografar senha
    hashed_password = generate_password_hash(senha)

    # Criar novo cliente
    new_user = Clientes(
        nome=nome,
        email=email,
        cpf=cpf,
        telefone=telefone,
        senha=hashed_password,
        referencias=referencias,
        dt_nasc=dt_nasc,
        endereco=endereco,
        rua=rua,
        estado=estado,
        cidade=cidade,
        bairro=bairro
    )

    try:
        # Salvar no banco de dados
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Inscrição realizada com sucesso!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao realizar a inscrição: {str(e)}"}), 500

# Função para validar CPF
def is_cpf_valid(cpf):
    cpf = cpf.replace('.', '').replace('-', '').strip()
    if len(cpf) != 11 or not cpf.isdigit() or cpf == cpf[0] * len(cpf):
        return False
    for i in range(9, 11):
        value = sum((int(cpf[num]) * ((i + 1) - num) for num in range(0, i)))
        digit = ((value * 10) % 11) % 10
        if digit != int(cpf[i]):
            return False
    return True

# Rota de Inscrição
@main.route('/register-colaborador', methods=['POST'])
def register_colaborador():
    data = request.get_json()
    print(data)  # Adiciona um log para verificar os dados recebidos

    # Capturar os dados do colaborador
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')
    telefone = data.get('telefone')
    cpf = data.get('cpf')  
    referencias = data.get('referencias', '')
    cargo = data.get('cargo', '')
    endereco = data.get('endereco', '')
    rua = data.get('rua', '')
    estado = data.get('estado', '')
    cidade = data.get('cidade', '')
    bairro = data.get('bairro', '')
    is_admin = data.get('is_admin', False)  # Booleano para determinar se é admin

    # Validar campos obrigatórios
    if not all([nome, email, senha, cpf]):
        return jsonify({"message": "Os campos nome, email, senha e CPF são obrigatórios."}), 400

    # Validar CPF
    if not is_cpf_valid(cpf):
        return jsonify({"message": "CPF inválido."}), 400

    # Verificar se o email, telefone ou CPF já existe
    if Colaboradores.query.filter(
        (Colaboradores.email == email) | 
        (Colaboradores.telefone == telefone) | 
        (Colaboradores.cpf == cpf)
    ).first():
        return jsonify({"message": "Email, telefone ou CPF já cadastrado."}), 400

    # Criptografar a senha
    hashed_password = generate_password_hash(senha)

    # Criar um novo colaborador
    new_colaborador = Colaboradores(
        nome=nome,
        email=email,
        telefone=telefone,
        senha=hashed_password,
        cpf=cpf,  
        referencias=referencias,
        cargo=cargo,
        endereco=endereco,
        rua=rua,
        estado=estado,
        cidade=cidade,
        bairro=bairro,
        is_admin=is_admin
    )

    try:
        # Salvar no banco de dados
        db.session.add(new_colaborador)
        db.session.commit()
        return jsonify({"message": "Colaborador registrado com sucesso!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao registrar colaborador: {str(e)}"}), 500




    

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

    colaboradores = Colaboradores.query.filter(
        Colaboradores.servicos.any(ID_Servico=servico_id)).all()

    if not colaboradores:
        return jsonify({"error": "Nenhum colaborador encontrado para o serviço solicitado"}), 404

    horarios_possiveis = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]
    horarios_status = []  # Lista para armazenar os horários com status

    for horario in horarios_possiveis:
        horario_ocupado = False  # Assume que o horário está livre

        for colaborador in colaboradores:
            # Combina data e hora para verificar disponibilidade
            data_e_hora = datetime.combine(data_formatada, datetime.strptime(horario, "%H:%M").time())
            if not horario_disponivel(data_e_hora, colaborador.ID_Colaborador):
                horario_ocupado = True
                break  # Se qualquer colaborador já está ocupado, o horário é marcado como ocupado

        horarios_status.append({
            "horario": horario,
            "ocupado": horario_ocupado
        })

    return jsonify(horarios_status)


def horario_disponivel(data_e_hora, colaborador_id):
    agendamento_existente = Agendamentos.query.filter_by(
        ID_Colaborador=colaborador_id,
        data_e_hora=data_e_hora
    ).first()
    
    return agendamento_existente is None


@main.route('/api/colaboradores', methods=['GET'])
def get_colaboradores():
    servico_id = request.args.get('servico_id')
    if not servico_id:
        return jsonify({"error": "Servico ID é necessário"}), 400
    
    colaboradores = Colaboradores.query.filter(
        Colaboradores.servicos.any(ID_Servico=servico_id),
        Colaboradores.is_admin == False
    ).all()
    
    if not colaboradores:
        return jsonify({"message": "Nenhum colaborador encontrado para o serviço solicitado"}), 404
    
    colaboradores_list = [{"ID_Colaborador": c.ID_Colaborador, "Nome": c.nome} for c in colaboradores]
    return jsonify(colaboradores_list)

@main.route('/api/colaboradoresdisponiveis', methods=['GET'])
def get_colaboradoresdisponiveis():
    servico_id = request.args.get('servico_id')
    if not servico_id:
        return jsonify({"error": "Servico ID é necessário"}), 400
    
    # Buscar colaboradores que já estão alocados nesse serviço
    colaboradores_alocados = Colaboradores.query.filter(
        Colaboradores.servicos.any(ID_Servico=servico_id),
        Colaboradores.is_admin == False
    ).all()
    
    # Buscar colaboradores disponíveis (aqueles que não estão alocados nesse serviço)
    colaboradores_disponiveis = Colaboradores.query.filter(
        ~Colaboradores.servicos.any(ID_Servico=servico_id),
        Colaboradores.is_admin == False
    ).all()

    # Formatar as respostas para as listas de colaboradores alocados e disponíveis
    colaboradores_alocados_list = [{"ID_Colaborador": c.ID_Colaborador, "Nome": c.nome} for c in colaboradores_alocados]
    colaboradores_disponiveis_list = [{"ID_Colaborador": c.ID_Colaborador, "Nome": c.nome} for c in colaboradores_disponiveis]

    return jsonify({
        "alocados": colaboradores_alocados_list,
        "disponiveis": colaboradores_disponiveis_list
    })





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


# Rota para adicionar serviço
@main.route('/api/editar_usuario/<role>/<int:user_id>', methods=['PUT'])
@jwt_required()
def editar_usuario(role, user_id):
    data = request.get_json()
    if role == 'cliente':
        user = Clientes.query.filter_by(ID_Cliente=user_id).first()
    elif role == 'colaborador':
        user = Colaboradores.query.filter_by(ID_Colaborador=user_id).first()
    else:
        return jsonify({'message': 'Role inválido.'}), 400

    if not user:
        return jsonify({'message': 'Usuário não encontrado.'}), 404

    # Atualizar os dados
    for key, value in data.items():
        if hasattr(user, key):
            setattr(user, key, value)

    db.session.commit()
    return jsonify({'message': 'Dados atualizados com sucesso.'}), 200

@main.route('/api/alterar_senha/<role>/<int:user_id>', methods=['PUT'])
@jwt_required()
def alterar_senha(role, user_id):
    data = request.get_json()
    senha_atual = data.get('senhaAtual')
    nova_senha = data.get('novaSenha')

    if not senha_atual or not nova_senha:
        return jsonify({'message': 'Senha atual e nova senha são obrigatórias.'}), 400

    # Buscar o usuário com base no role e user_id
    user = None

    if role == 'colaborador':
        user = Colaboradores.query.filter_by(ID_Colaborador=user_id).first()
    elif role == 'cliente':
        user = Clientes.query.filter_by(ID_Cliente=user_id).first()
    else:
        return jsonify({'message': 'Role inválido.'}), 400

    if not user:
        return jsonify({'message': 'Usuário não encontrado.'}), 404

    # Verificar se a senha atual está correta
    if not user.check_password(senha_atual):
        return jsonify({'message': 'Senha atual inválida.'}), 400

    # Atualizar a senha com a nova
    user.set_password(nova_senha)  # Gera o hash da nova senha
    db.session.commit()

    return jsonify({'message': 'Senha alterada com sucesso.'}), 200


@main.route('/api/listar_usuarios', methods=['GET'])
@jwt_required()
def listar_usuarios():
    # Consulta os dados de clientes e colaboradores
    clientes = Clientes.query.order_by(Clientes.nome).all()
    colaboradores = Colaboradores.query.order_by(Colaboradores.nome).all()

    # Formata os dados para incluir todos os campos relevantes, exceto `photo`
    usuarios = [
        {
            "ID": cliente.ID_Cliente,
            "nome": cliente.nome,
            "email": cliente.email,
            "telefone": cliente.telefone,
            "endereco": cliente.endereco,
            "bairro": cliente.bairro,
            "cidade": cliente.cidade,
            "cpf": cliente.cpf,
            "estado": cliente.estado,
            "rua": cliente.rua,
            "referencias": cliente.referencias,
            "dt_nasc": cliente.dt_nasc.isoformat() if cliente.dt_nasc else None,
            "role": "cliente"
        }
        for cliente in clientes
    ] + [
        {
            "ID": colaborador.ID_Colaborador,
            "nome": colaborador.nome,
            "email": colaborador.email,
            "telefone": colaborador.telefone,
            "endereco": colaborador.endereco,
            "bairro": colaborador.bairro,
            "cidade": colaborador.cidade,
            "cpf": colaborador.cpf,
            "estado": colaborador.estado,
            "rua": colaborador.rua,
            "referencias": colaborador.referencias,
            "cargo": colaborador.cargo,
            "is_admin": colaborador.is_admin,
            "role": "colaborador"
        }
        for colaborador in colaboradores
    ]

    

    # Retorna os dados como JSON
    return jsonify(usuarios), 200



# Deletar usuário (cliente ou colaborador)
@main.route('/api/deletar_usuario/<string:tipo>/<int:id>', methods=['DELETE'])
@jwt_required()
def deletar_usuario(tipo, id):
    try:
        if tipo == "cliente":
            usuario = Clientes.query.get(id)
        elif tipo == "colaborador":
            usuario = Colaboradores.query.get(id)
        else:
            return jsonify({"message": "Tipo inválido. Use 'cliente' ou 'colaborador'"}), 400

        if not usuario:
            return jsonify({"message": f"{tipo.capitalize()} não encontrado"}), 404

        db.session.delete(usuario)
        db.session.commit()
        return jsonify({"message": f"{tipo.capitalize()} deletado com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao deletar {tipo}: {str(e)}"}), 500



@main.route('/api/perfil', methods=['GET'])
@jwt_required()
def get_perfil():
    email = get_jwt_identity()  # Recupera o email do usuário autenticado
    
    # Verifica se o usuário é um cliente ou colaborador
    cliente = Clientes.query.filter_by(email=email).first()
    colaborador = Colaboradores.query.filter_by(email=email).first()

    if cliente:
        return jsonify({
            'ID': cliente.ID_Cliente,
            'nome': cliente.nome,
            'email': cliente.email,
            'telefone': cliente.telefone,
            'cpf': cliente.cpf,
            'endereco': cliente.endereco,
            'bairro': cliente.bairro,
            'cidade': cliente.cidade,
            'photo': cliente.photo,
            'role': 'cliente'
        })

    elif colaborador:
        return jsonify({
            'ID': colaborador.ID_Colaborador,
            'nome': colaborador.nome,
            'email': colaborador.email,
            'telefone': colaborador.telefone,
            'cpf': colaborador.cpf,
            'endereco': colaborador.endereco,
            'bairro': colaborador.bairro,
            'cidade': colaborador.cidade,
            'cargo': colaborador.cargo,
            'photo': colaborador.photo,
            'role': 'colaborador'
        })

    return jsonify({'message': 'Usuário não encontrado.'}), 404

@main.route('/api/editar_usuario/<role>/<int:id>', methods=['PUT'])
@jwt_required()
def atualizar_usuario(role, id):
    dados = request.get_json()
    
    if role == 'cliente':
        usuario = Clientes.query.get(id)
    elif role == 'colaborador':
        usuario = Colaboradores.query.get(id)
    else:
        return jsonify({'message': 'Role não reconhecido.'}), 400

    if not usuario:
        return jsonify({'message': 'Usuário não encontrado.'}), 404
    
    # Atualiza os dados do usuário
    usuario.nome = dados.get('nome', usuario.nome)
    usuario.email = dados.get('email', usuario.email)
    usuario.telefone = dados.get('telefone', usuario.telefone)
    usuario.endereco = dados.get('endereco', usuario.endereco)
    usuario.bairro = dados.get('bairro', usuario.bairro)
    usuario.cidade = dados.get('cidade', usuario.cidade)
    usuario.cpf = dados.get('cpf', usuario.cpf)  # Atualizando o CPF
    if role == 'colaborador':
        usuario.cargo = dados.get('cargo', usuario.cargo)
    
    try:
        db.session.commit()
        return jsonify({'message': 'Dados atualizados com sucesso.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao atualizar dados: {str(e)}'}), 500


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@main.route('/api/upload_photo', methods=['POST'])
@jwt_required()
def upload_photo():
    email = get_jwt_identity()
    usuario = Clientes.query.filter_by(email=email).first() or Colaboradores.query.filter_by(email=email).first()

    if 'file' not in request.files:
        return jsonify({'message': 'Nenhum arquivo enviado.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'Nenhum arquivo selecionado.'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        if usuario:
            usuario.photo = filename  
            db.session.commit()
            return jsonify({'message': 'Foto de perfil atualizada com sucesso.', 'photo': filename}), 200

    return jsonify({'message': 'Tipo de arquivo não permitido.'}), 400

@main.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@main.route('/api/listar_servicos', methods=['GET'])
def get_list_servicos():
    try:
        servicos = Servicos.query.all()
        if not servicos:
            return jsonify({"message": "Nenhum serviço encontrado"}), 404

        servicos_list = []
        for s in servicos:
            colaboradores = [colaborador.nome for colaborador in s.colaboradores]  # Supondo que o nome seja um atributo de Colaboradores
            servico_data = {
                "ID_Servico": s.ID_Servico,
                "Nome_servico": s.Nome_servico,
                "Descricao": s.Descricao,
                "Valor": str(s.Valor) if s.tipo_servico == 'fisioterapia' else None,
                "Planos": s.planos if s.tipo_servico == 'pilates' else None,
                "Tipo": s.tipo_servico,
                "Colaboradores": colaboradores  # Adicionando os colaboradores
            }
            servicos_list.append(servico_data)

        return jsonify(servicos_list), 200
    except Exception as e:
        return jsonify({"message": f"Erro ao listar serviços: {str(e)}"}), 500

@main.route('/api/deletar_servico/<int:id>', methods=['DELETE'])
@jwt_required()
def deletar_servico(id):
    try:
        servico = Servicos.query.get(id)

        if not servico:
            return jsonify({"message": "Serviço não encontrado"}), 404

        # Remover os relacionamentos entre colaboradores e serviço
        if servico.colaboradores:
            for colaborador in servico.colaboradores:
                # Deletar a entrada na tabela de junção 'colaboradores_servicos'
                colaborador_servico = ColaboradoresServicos.query.filter_by(ID_Colaborador=colaborador.ID_Colaborador, ID_Servico=servico.ID_Servico).first()
                if colaborador_servico:
                    db.session.delete(colaborador_servico)

        # Agora, deletar o próprio serviço
        db.session.delete(servico)
        db.session.commit()

        return jsonify({"message": "Serviço e seus relacionamentos com colaboradores deletados com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao deletar serviço: {str(e)}"}), 500


    
@main.route('/add_servico', methods=['POST'])
def add_servico():
    try:
        data = request.get_json()
        nome_servico = data.get('nome_servico')
        descricao = data.get('descricao')
        valor = data.get('valor')
        tipo_servico = data.get('tipo_servico')
        colaboradores_ids = data.get('colaboradores_ids')
        planos = data.get('planos')

        if not nome_servico or not descricao or not tipo_servico:
            return jsonify({"error": "Nome, descrição e tipo de serviço são obrigatórios."}), 400

        # Incrementar automaticamente o ID_Plano
        if tipo_servico == 'pilates' and planos:
            for index, plano in enumerate(planos, start=1):
                plano['ID_Plano'] = index

        novo_servico = Servicos(
            Nome_servico=nome_servico,
            Descricao=descricao,
            Valor=valor if tipo_servico == 'fisioterapia' else None,
            tipo_servico=tipo_servico,
            planos=planos if tipo_servico == 'pilates' else None
        )

        if colaboradores_ids:
            colaboradores = Colaboradores.query.filter(Colaboradores.ID_Colaborador.in_(colaboradores_ids)).all()
            if len(colaboradores) != len(colaboradores_ids):
                return jsonify({"error": "Um ou mais colaboradores não encontrados."}), 404
            novo_servico.colaboradores = colaboradores

        db.session.add(novo_servico)
        db.session.commit()

        return jsonify({"message": "Serviço adicionado com sucesso!", "servico": novo_servico.to_dict()}), 201

    except Exception as e:
        return jsonify({"error": f"Erro ao adicionar serviço: {str(e)}"}), 500


   
    
@main.route('/api/editar_servico/<tipo>/<int:id>', methods=['PUT'])
@jwt_required()
def editar_servico(tipo, id):
    data = request.get_json()
    
    # Verifica se o tipo de serviço é válido
    if tipo not in ['fisioterapia', 'pilates']:
        return jsonify({"error": "Tipo de serviço inválido"}), 400
    
    # Busca o serviço no banco de dados
    servico = Servicos.query.get(id)
    if not servico:
        return jsonify({"error": "Serviço não encontrado"}), 404

    # Atualiza os campos básicos do serviço
    servico.Nome_servico = data.get('Nome_servico', servico.Nome_servico)
    servico.Descricao = data.get('Descricao', servico.Descricao)
    servico.Valor = data.get('Valor', servico.Valor)
    
    # Atualiza o tipo de serviço
    servico.tipo_servico = tipo
    
    # Se for o tipo Pilates, verifica e atualiza os planos
    if tipo == 'pilates':
        planos = data.get('Planos')
        if not planos or not isinstance(planos, list):
            return jsonify({"error": "Planos são obrigatórios e devem ser uma lista para serviços de Pilates"}), 400
        
        # Atualiza os planos
        for plano in planos:
            if 'Nome_plano' not in plano or 'Valor' not in plano:
                return jsonify({"error": "Cada plano deve conter 'Nome_plano' e 'Valor'"}), 400
        servico.planos = planos
    else:
        # Se o tipo não for Pilates, limpa os planos
        servico.planos = None

    try:
        db.session.commit()
        return jsonify({"message": "Serviço atualizado com sucesso!", "servico": servico.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        # Log do erro no console para depuração
        print(f"Erro ao atualizar serviço: {e}")
        return jsonify({"error": f"Erro ao atualizar serviço: {str(e)}"}), 500




    
@main.route('/api/adicionar_colaboradores', methods=['POST'])
def adicionar_colaboradores():
    data = request.get_json()
    servico_id = data.get('servico_id')
    colaboradores_ids = data.get('colaboradores_ids')

    if not servico_id or not colaboradores_ids:
        return jsonify({"error": "Servico ID e Colaboradores IDs são necessários"}), 400

    # Buscar o serviço pelo ID
    servico = Servicos.query.get(servico_id)
    if not servico:
        return jsonify({"error": "Serviço não encontrado"}), 404

    # Buscar os colaboradores pelo ID
    colaboradores = Colaboradores.query.filter(Colaboradores.ID_Colaborador.in_(colaboradores_ids)).all()
    if len(colaboradores) != len(colaboradores_ids):
        return jsonify({"error": "Alguns colaboradores não foram encontrados"}), 404

    # Adicionar os colaboradores ao serviço
    for colaborador in colaboradores:
        # Verifica se o relacionamento já existe para evitar duplicação
        if colaborador not in servico.colaboradores:
            servico.colaboradores.append(colaborador)

    try:
        db.session.commit()
        return jsonify({"message": "Colaboradores adicionados ao serviço com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao adicionar colaboradores: {str(e)}"}), 500
    
@main.route('/api/remover_colaboradores', methods=['POST'])
def remover_colaboradores():
    data = request.get_json()
    servico_id = data.get('servico_id')
    colaboradores_ids = data.get('colaboradores_ids')

    if not servico_id or not colaboradores_ids:
        return jsonify({"error": "Servico ID e Colaboradores IDs são necessários"}), 400

    # Buscar o serviço pelo ID
    servico = Servicos.query.get(servico_id)
    if not servico:
        return jsonify({"error": "Serviço não encontrado"}), 404

    # Buscar os colaboradores pelo ID
    colaboradores = Colaboradores.query.filter(Colaboradores.ID_Colaborador.in_(colaboradores_ids)).all()
    if len(colaboradores) != len(colaboradores_ids):
        return jsonify({"error": "Alguns colaboradores não foram encontrados"}), 404

    # Remover os colaboradores do serviço
    for colaborador in colaboradores:
        if colaborador in servico.colaboradores:
            servico.colaboradores.remove(colaborador)

    try:
        db.session.commit()
        return jsonify({"message": "Colaboradores removidos do serviço com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao remover colaboradores: {str(e)}"}), 500


@main.route('/api/remover_plano/<int:servico_id>/<int:plano_id>', methods=['DELETE'])
def remover_plano(servico_id, plano_id):
    try:
        # Encontra o serviço pelo ID
        servico = Servicos.query.get(servico_id)
        if not servico:
            return jsonify({"error": "Serviço não encontrado"}), 404

        # Filtra os planos associados ao serviço
        planos = servico.planos or []
        planos_restantes = [plano for plano in planos if plano.get('ID_Plano') != plano_id]

        if len(planos) == len(planos_restantes):
            return jsonify({"error": "Plano não encontrado"}), 404

        # Atualiza os planos do serviço
        servico.planos = planos_restantes
        db.session.commit()
        return jsonify({"message": "Plano removido com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500