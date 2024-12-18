from flask import Blueprint, current_app, send_from_directory, request, jsonify
import os
from app.models import Colaboradores, Clientes, db
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

usuarios = Blueprint('usuarios', __name__)
@usuarios.route('/editar_usuario/<role>/<int:user_id>', methods=['PUT'])
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


@usuarios.route('/listar_usuarios', methods=['GET'])
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

@usuarios.route('/editar_usuario/<role>/<int:id>', methods=['PUT'])
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