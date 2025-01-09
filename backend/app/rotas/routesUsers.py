from flask import Blueprint, current_app, send_from_directory, request, jsonify
import os
from app.models import Colaboradores, Clientes, Enderecos, db
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

usuarios = Blueprint('usuarios', __name__)



@usuarios.route('/editar_usuario/<role>/<int:user_id>', methods=['PUT'])
@jwt_required()
def editar_usuario(role, user_id):
    data = request.get_json()

    # Buscar o usuário dependendo do papel (cliente ou colaborador)
    if role == 'cliente':
        user = Clientes.query.filter_by(id_cliente=user_id).first()
    elif role == 'colaborador':
        user = Colaboradores.query.filter_by(id_colaborador=user_id).first()
    else:
        return jsonify({'message': 'Role inválido.'}), 400

    if not user:
        return jsonify({'message': 'Usuário não encontrado.'}), 404

    # Atualizar os dados gerais do usuário
    for key, value in data.items():
        if hasattr(user, key):
            setattr(user, key, value)

    db.session.commit()
    return jsonify({'message': 'Dados do usuário atualizados com sucesso.'}), 200

@usuarios.route('/editar_endereco/<role>/<int:user_id>', methods=['PUT'])
@jwt_required()
def editar_endereco(role, user_id):
    data = request.get_json()
    endereco_data = data.get("endereco")

    # Verificar se os dados de endereço estão presentes
    if not endereco_data:
        return jsonify({'message': 'Dados de endereço não fornecidos.'}), 400

    # Buscar o usuário dependendo do papel (cliente ou colaborador)
    if role == 'cliente':
        user = Clientes.query.filter_by(id_cliente=user_id).first()
    elif role == 'colaborador':
        user = Colaboradores.query.filter_by(id_colaborador=user_id).first()
    else:
        return jsonify({'message': 'Role inválido.'}), 400

    if not user:
        return jsonify({'message': 'Usuário não encontrado.'}), 404

    # Atualizar ou criar o endereço relacionado
    endereco = Enderecos.query.filter_by(id_endereco=user.endereco_id).first()

    if endereco:
        # Caso o endereço já exista, apenas atualize os campos
        for key, value in endereco_data.items():
            if hasattr(endereco, key):
                setattr(endereco, key, value)
    else:
        # Caso o endereço não exista, crie um novo
        endereco = Enderecos(**endereco_data)
        user.endereco = endereco  # Relacionar o endereço ao usuário

    db.session.commit()
    return jsonify({'message': 'Endereço atualizado com sucesso.'}), 200

@usuarios.route('/editar_usuario_com_endereco/<role>/<int:user_id>', methods=['PUT'])
@jwt_required()
def editar_usuario_com_endereco(role, user_id):
    try:
        data = request.get_json()
        user = None

        # Verifica se o usuário é colaborador ou cliente
        if role == 'colaborador':
            user = Colaboradores.query.get(user_id)
        elif role == 'cliente':
            user = Clientes.query.get(user_id)

        if not user:
            return jsonify({"message": "Usuário não encontrado!"}), 404

        # Verifica e atualiza o e-mail, se necessário
        novo_email = data.get('email')
        if novo_email and novo_email != user.email:  # O e-mail foi alterado
            # Verifica se o e-mail novo já está em uso, mas ignora se o e-mail for o mesmo do usuário logado
            if Clientes.query.filter_by(email=novo_email).first():
                return jsonify({"message": "Este e-mail já está em uso por outro cliente!"}), 400
            if Colaboradores.query.filter_by(email=novo_email).first():
                return jsonify({"message": "Este e-mail já está em uso por outro colaborador!"}), 400
            user.email = novo_email  # Atualiza o e-mail, caso passe na verificação

        # Atualiza os dados do usuário
        for key, value in data.items():
            if key == 'endereco':
                endereco_data = value  # O valor de 'endereco' é um dicionário

                # Verifica se o id_endereco foi passado
                if endereco_data.get('id_endereco'): 
                    # Caso o id_endereco exista, busca o endereço no banco de dados
                    endereco = Enderecos.query.filter_by(id_endereco=endereco_data['id_endereco']).first()
                    if not endereco:
                        return jsonify({"message": "Endereço não encontrado!"}), 404
                else:
                    # Caso não exista id_endereco, cria um novo endereço
                    endereco = Enderecos(
                        rua=endereco_data.get('rua'),
                        numero=endereco_data.get('numero'),
                        bairro=endereco_data.get('bairro'),
                        cidade=endereco_data.get('cidade'),
                        estado=endereco_data.get('estado'),
                        complemento=endereco_data.get('complemento')
                    )
                    db.session.add(endereco)
                    db.session.commit()

                # Atribui a instância de endereco ao usuário (não só o ID)
                user.endereco = endereco

            else:
                # Atualiza os outros campos diretamente no usuário
                if hasattr(user, key):  # Verifica se o atributo existe no modelo
                    setattr(user, key, value)

        db.session.commit()
        return jsonify({"message": f"Usuário {role} atualizado com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao atualizar usuário: {str(e)}"}), 500



@usuarios.route('/alterar_senha/<role>/<int:user_id>', methods=['PUT'])
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
        user = Colaboradores.query.filter_by(id_colaborador=user_id).first()
    elif role == 'cliente':
        user = Clientes.query.filter_by(id_cliente=user_id).first()
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



@usuarios.route('/listar_usuarios', methods=['GET'])
@jwt_required()
def listar_usuarios():
    user_email = get_jwt_identity()  # Obtem o email do usuário logado do token JWT

    # Buscar os dados do usuário logado (cliente ou colaborador)
    cliente_logado = Clientes.query.filter_by(email=user_email).first()
    colaborador_logado = Colaboradores.query.filter_by(email=user_email).first()

    # Serializar os dados do usuário logado
    usuario_logado = None
    if cliente_logado:
        usuario_logado = {
            "id": cliente_logado.id_cliente,
            "nome": cliente_logado.nome,
            "email": cliente_logado.email,
            "telefone": cliente_logado.telefone,
            "cpf": cliente_logado.cpf,
            "endereco": {
                "rua": cliente_logado.endereco.rua if cliente_logado.endereco else None,
                "numero": cliente_logado.endereco.numero if cliente_logado.endereco else None,
                "bairro": cliente_logado.endereco.bairro if cliente_logado.endereco else None,
                "cidade": cliente_logado.endereco.cidade if cliente_logado.endereco else None,
                "estado": cliente_logado.endereco.estado if cliente_logado.endereco else None,
            },
            "role": "cliente"
        }
    elif colaborador_logado:
        usuario_logado = {
            "id": colaborador_logado.id_colaborador,
            "nome": colaborador_logado.nome,
            "email": colaborador_logado.email,
            "telefone": colaborador_logado.telefone,
            "cpf": colaborador_logado.cpf,
            "cargo": colaborador_logado.cargo,
            "is_admin": colaborador_logado.is_admin,
            "clinica": {
                "id": colaborador_logado.clinica.id_clinica if colaborador_logado.clinica else None,
                "nome": colaborador_logado.clinica.nome if colaborador_logado.clinica else None,
            },
            "endereco": {
                "rua": colaborador_logado.endereco.rua if colaborador_logado.endereco else None,
                "numero": colaborador_logado.endereco.numero if colaborador_logado.endereco else None,
                "bairro": colaborador_logado.endereco.bairro if colaborador_logado.endereco else None,
                "cidade": colaborador_logado.endereco.cidade if colaborador_logado.endereco else None,
                "estado": colaborador_logado.endereco.estado if colaborador_logado.endereco else None,
            },
            "role": "colaborador"
        }

    # Buscar todos os outros usuários
    clientes = Clientes.query.order_by(Clientes.nome).all()
    colaboradores = Colaboradores.query.order_by(Colaboradores.nome).all()

    # Serializar os outros usuários
    usuarios = [
        {
            "id": cliente.id_cliente,
            "nome": cliente.nome,
            "email": cliente.email,
            "telefone": cliente.telefone,
            "cpf": cliente.cpf,
            "endereco": {
                "rua": cliente.endereco.rua if cliente.endereco else None,
                "numero": cliente.endereco.numero if cliente.endereco else None,
                "bairro": cliente.endereco.bairro if cliente.endereco else None,
                "cidade": cliente.endereco.cidade if cliente.endereco else None,
                "estado": cliente.endereco.estado if cliente.endereco else None,
            },
            "role": "cliente"
        }
        for cliente in clientes
    ] + [
        {
            "id": colaborador.id_colaborador,
            "nome": colaborador.nome,
            "email": colaborador.email,
            "telefone": colaborador.telefone,
            "cpf": colaborador.cpf,
            "cargo": colaborador.cargo,
            "is_admin": colaborador.is_admin,
            "clinica": {
                "id": colaborador.clinica.id_clinica if colaborador.clinica else None,
                "nome": colaborador.clinica.nome if colaborador.clinica else None,
            },
            "endereco": {
                "rua": colaborador.endereco.rua if colaborador.endereco else None,
                "numero": colaborador.endereco.numero if colaborador.endereco else None,
                "bairro": colaborador.endereco.bairro if colaborador.endereco else None,
                "cidade": colaborador.endereco.cidade if colaborador.endereco else None,
                "estado": colaborador.endereco.estado if colaborador.endereco else None,
            },
            "role": "colaborador"
        }
        for colaborador in colaboradores
    ]

    # Encontrar o índice do usuário logado
    usuario_logado_index = None
    if usuario_logado:
        usuario_logado_index = next((index for index, user in enumerate(usuarios) if user['email'] == usuario_logado['email']), None)

    # Retornar o índice do usuário logado
    return jsonify({"usuarios": usuarios, "usuario_logado_index": usuario_logado_index}), 200


# Deletar usuário (cliente ou colaborador)
@usuarios.route('/deletar_usuario/<string:tipo>/<int:id>', methods=['DELETE'])
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



@usuarios.route('/perfil', methods=['GET'])
@jwt_required()
def get_perfil():
    email = get_jwt_identity()

    cliente = Clientes.query.filter_by(email=email).first()
    colaborador = Colaboradores.query.filter_by(email=email).first()

    if cliente:
        return jsonify({
            'id': cliente.id_cliente,
            'nome': cliente.nome,
            'email': cliente.email,
            'telefone': cliente.telefone,
            'cpf': cliente.cpf,
            'endereco': {
                "rua": cliente.endereco.rua if cliente.endereco else None,
                "numero": cliente.endereco.numero if cliente.endereco else None,
                "complemento": cliente.endereco.complemento if cliente.endereco else None,  # Adicionando complemento
                "bairro": cliente.endereco.bairro if cliente.endereco else None,
                "cidade": cliente.endereco.cidade if cliente.endereco else None,
                "estado": cliente.endereco.estado if cliente.endereco else None,
            },
            'role': 'cliente'
        })

    elif colaborador:
        return jsonify({
            'id': colaborador.id_colaborador,
            'nome': colaborador.nome,
            'email': colaborador.email,
            'telefone': colaborador.telefone,
            'cpf': colaborador.cpf,
            'cargo': colaborador.cargo,
            'clinica': {
                "id": colaborador.clinica.id_clinica if colaborador.clinica else None,
                "nome": colaborador.clinica.nome if colaborador.clinica else None
            },
            'endereco': {
                "rua": colaborador.endereco.rua if colaborador.endereco else None,
                "numero": colaborador.endereco.numero if colaborador.endereco else None,
                "complemento": colaborador.endereco.complemento if colaborador.endereco else None,  # Adicionando complemento
                "bairro": colaborador.endereco.bairro if colaborador.endereco else None,
                "cidade": colaborador.endereco.cidade if colaborador.endereco else None,
                "estado": colaborador.endereco.estado if colaborador.endereco else None,
            },
            'role': 'colaborador'
        })

    return jsonify({'message': 'Usuário não encontrado.'}), 404

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


@usuarios.route('/upload_photo', methods=['POST'])
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

@usuarios.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
