
from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from datetime import datetime
from app.models import Agendamentos, Clientes, Colaboradores, Servicos, Pagamentos, BlacklistedToken, db
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename
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
        response = {"access_token": access_token, "name": colaborador.nome}
        
        if colaborador.is_admin:
            response["role"] = "admin"  # Permissão de administrador
        else:
            response["role"] = "colaborador"  # Permissão de colaborador comum
            
        return jsonify(response), 200

    # Verificar se o email pertence a um cliente
    cliente = Clientes.query.filter_by(email=email).first()

    if cliente and cliente.check_password(senha):
        access_token = create_access_token(identity=email)
        return jsonify(access_token=access_token, name=cliente.nome, role="cliente"), 200

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

# Rota de Inscrição
@main.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Capturar os dados do cliente
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')
    telefone = data.get('telefone')
    referencias = data.get('referencias', '')
    endereco = data.get('endereco', '')
    rua = data.get('rua', '')
    estado = data.get('estado', '')
    cidade = data.get('cidade', '')
    bairro = data.get('bairro', '')
    dt_nasc_str = data.get('dt_nasc', None)

    # Converter dt_nasc para um objeto date, se fornecido
    dt_nasc = None
    if dt_nasc_str:
        try:
            dt_nasc = datetime.strptime(dt_nasc_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "Data de nascimento em formato inválido. Use AAAA-MM-DD."}), 400

    # Verificar se o email já existe
    if Clientes.query.filter_by(email=email).first():
        return jsonify({"message": "Email já registrado."}), 400

    # Verificar se o telefone já existe
    if Clientes.query.filter_by(telefone=telefone).first():
        return jsonify({"message": "Telefone já registrado."}), 400

    # Criptografar a senha
    hashed_password = generate_password_hash(senha)

    # Criar um novo cliente
    new_user = Clientes(
        nome=nome,
        email=email,
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
    
@main.route('/register-colaborador', methods=['POST'])
def register_colaborador():
    data = request.get_json()

    # Capturar os dados do colaborador
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')
    telefone = data.get('telefone')
    referencias = data.get('referencias', '')
    cargo = data.get('cargo', '')
    endereco = data.get('endereco', '')
    rua = data.get('rua', '')
    estado = data.get('estado', '')
    cidade = data.get('cidade', '')
    bairro = data.get('bairro', '')
    is_admin = data.get('is_admin', False)  # Booleano para determinar se é admin

    # Verificar se o email ou telefone já existe
    if Colaboradores.query.filter((Colaboradores.email == email) | (Colaboradores.telefone == telefone)).first():
        return jsonify({"message": "Email ou telefone já cadastrado."}), 400

    # Criptografar a senha
    hashed_password = generate_password_hash(senha)

    # Criar um novo colaborador
    new_colaborador = Colaboradores(
        nome=nome,
        email=email,
        telefone=telefone,
        senha=hashed_password,
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
@main.route('/api/servicos', methods=['GET'])
def get_servicos():
    servicos = Servicos.query.all()  # Pegue todos os serviços cadastrados
    servicos_list = [{"ID_Servico": s.ID_Servico, "Nome_servico": s.Nome_servico} for s in servicos]
    return jsonify(servicos_list)

@main.route('/api/clientes', methods=['GET'])
def get_clientes():
    clientes = Clientes.query.all()  # Pegue todos os clientes cadastrados
    clientes_list = [{"ID_Cliente": s.ID_Cliente, "Nome": s.nome} for s in clientes]  # Corrigido o campo 'Nome'
    return jsonify(clientes_list)



# Endpoint para verificar horários disponíveis
@main.route('/api/horarios-disponiveis', methods=['GET'])
def get_horarios_disponiveis():
    data = request.args.get('data')
    servico_id = request.args.get('servico_id')

    # Converte a data recebida em formato datetime
    try:
        data_formatada = datetime.strptime(data, '%Y-%m-%d')
    except ValueError:
        return jsonify({"error": "Formato de data inválido"}), 400

    # Buscar os colaboradores que oferecem o serviço
    colaboradores = Colaboradores.query.filter(
        Colaboradores.servicos.any(ID_Servico=servico_id)).all()

    if not colaboradores:
        return jsonify({"error": "Nenhum colaborador encontrado para o serviço solicitado"}), 404

    # Horários possíveis entre 8h às 12h e 13h às 17h
    horarios_possiveis = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]
    horarios_disponiveis = []

    for colaborador in colaboradores:
        for horario in horarios_possiveis:
            data_e_hora = datetime.combine(data_formatada, datetime.strptime(horario, "%H:%M").time())
            
            # Verificar se o horário está disponível para o colaborador
            if horario_disponivel(data_e_hora, colaborador.ID_Colaborador):
                horarios_disponiveis.append({
                    "colaborador_id": colaborador.ID_Colaborador,
                    "nome_colaborador": colaborador.nome,
                    "horario": horario
                })
    
    if not horarios_disponiveis:
        return jsonify({"message": "Nenhum horário disponível para a data selecionada"}), 200

    return jsonify(horarios_disponiveis)

def horario_disponivel(data_e_hora, colaborador_id):
    agendamento_existente = Agendamentos.query.filter_by(
        ID_Colaborador=colaborador_id,
        data_e_hora=data_e_hora
    ).first()
    
    return agendamento_existente is None


@main.route('/api/colaboradores', methods=['GET'])
def get_colaboradores():
    colaboradores = Colaboradores.query.filter_by(is_admin=False).all()
    
    print(colaboradores)  # Verifique os dados
    colaboradores_list = [{"ID_Colaborador": c.ID_Colaborador, "Nome": c.nome} for c in colaboradores]
    return jsonify(colaboradores_list)

   

# Rota para obter os agendamentos
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
            servico = Servicos.query.get(agendamento.ID_Servico)  # Relacionamento com serviços

            agendamentos_data.append({
                'id': agendamento.ID_Agendamento,
                'nome_cliente': cliente.nome if cliente else 'Cliente não encontrado',
                'data': agendamento.data_e_hora.strftime('%Y-%m-%d'),
                'hora': agendamento.data_e_hora.strftime('%H:%M:%S'),
                'nome_servico': servico.Nome_servico if servico else 'Serviço não encontrado',
                'valor_servico': float(servico.Valor) if servico and servico.Valor else 'Valor não informado'
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




# Rota para agendamento
@main.route('/api/agendamento', methods=['POST'])
@jwt_required()
def agendamento():
    data = request.get_json()

    # Obter o ID do cliente logado, mas se for admin, utilizar o cliente_id da requisição
    cliente_id = data.get('cliente_id') if 'cliente_id' in data else get_jwt_identity()

    # Obter o colaborador selecionado
    colaborador = Colaboradores.query.get(data['colaborador_id'])

    # Obter o serviço selecionado
    servico = Servicos.query.get(data['servico_id'])

    if not colaborador:
        return jsonify({'message': 'Colaborador não encontrado'}), 404
    if not servico:
        return jsonify({'message': 'Serviço não encontrado'}), 404

    try:
        # Verificar disponibilidade do horário
        data_e_hora = datetime.strptime(data['data'], '%Y-%m-%d %H:%M:%S')
        if not horario_disponivel(data_e_hora, colaborador.ID_Colaborador):
            return jsonify({'message': 'Horário não disponível'}), 400

        # Criar agendamento
        novo_agendamento = Agendamentos(
            data_e_hora=data_e_hora,
            ID_Cliente=cliente_id,
            ID_Colaborador=colaborador.ID_Colaborador,
            ID_Servico=servico.ID_Servico  # Atribuindo o ID do serviço
        )

        db.session.add(novo_agendamento)
        db.session.commit()

        return jsonify({'message': 'Agendamento realizado com sucesso'}), 200

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
@main.route('/add_servico', methods=['POST'])
def add_servico():
    nome_servico = request.form.get('nome_servico')
    descricao = request.form.get('descricao')
    valor = request.form.get('valor')
    
    # Criar um novo serviço
    novo_servico = Servicos(
        Nome_servico=nome_servico,
        Descricao=descricao,
        Valor=valor
    )
    
    # Adicionar ao banco de dados
    db.session.add(novo_servico)
    db.session.commit()
    
    # Redirecionar após inserir
    return redirect(url_for('main.form'))

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


# Rota para adicionar pagamento
@main.route('/add_pagamento', methods=['POST'])
def add_pagamento():
    id_servico = request.form.get('id_servico')
    id_cliente = request.form.get('id_cliente')
    valor = request.form.get('valor')
    data_pagamento = request.form.get('data_pagamento')
    
    # Criar um novo pagamento
    novo_pagamento = Pagamentos(
        ID_servico=id_servico,
        ID_cliente=id_cliente,
        valor=valor,
        data_pagamento=data_pagamento
    )
    
    # Adicionar ao banco de dados
    db.session.add(novo_pagamento)
    db.session.commit()
    
    # Redirecionar após inserir
    return redirect(url_for('main.form'))


@main.route('/api/perfil', methods=['GET'])
@jwt_required()
def get_profile():
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
            'endereco': colaborador.endereco,
            'bairro': colaborador.bairro,
            'cidade': colaborador.cidade,
            'cargo': colaborador.cargo,
            'photo': colaborador.photo,
            'role': 'colaborador'
        })

    return jsonify({'message': 'Usuário não encontrado.'}), 404

# A variável UPLOAD_FOLDER é acessada diretamente da configuração do app
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@main.route('/api/upload_photo', methods=['POST'])
@jwt_required()
def upload_photo():
    email = get_jwt_identity()
    user = Clientes.query.filter_by(email=email).first() or Colaboradores.query.filter_by(email=email).first()

    if 'file' not in request.files:
        return jsonify({'message': 'Nenhum arquivo enviado.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'Nenhum arquivo selecionado.'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Atualiza o banco de dados com o caminho da foto
        if user:
            user.photo = filepath
            db.session.commit()
            return jsonify({'message': 'Foto de perfil atualizada com sucesso.'}), 200

    return jsonify({'message': 'Tipo de arquivo não permitido.'}), 400

