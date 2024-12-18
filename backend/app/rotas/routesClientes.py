from flask import Blueprint, jsonify, request
from app.models import  Clientes, db
from app.utils import is_cpf_valid
from werkzeug.security import generate_password_hash
from datetime import datetime


clientes = Blueprint('clientes', __name__)
@clientes.route('/', methods=['GET'])
def get_clientes():
    clientes = Clientes.query.all()  # Pegue todos os clientes cadastrados
    clientes_list = [{"ID_Cliente": s.ID_Cliente, "Nome": s.nome} for s in clientes]  # Corrigido o campo 'Nome'
    return jsonify(clientes_list)

# Rota para registro do cliente
@clientes.route('/register', methods=['POST'])
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

