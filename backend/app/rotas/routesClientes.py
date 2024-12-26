from flask import Blueprint, jsonify, request, url_for
from app.models import Clientes, Enderecos, db
from app.utils import is_cpf_valid, send_email
from werkzeug.security import generate_password_hash
from datetime import datetime
import secrets
from app.utils import is_cpf_valid, send_email

clientes = Blueprint('clientes', __name__)

@clientes.route('/', methods=['GET'])
def get_clientes():
    clientes = Clientes.query.all()
    clientes_list = [
        {
            "ID_Cliente": cliente.id_cliente,
            "Nome": cliente.nome,
            "Email": cliente.email,
            "Email Confirmado": cliente.email_confirmado,
            "CPF": cliente.cpf,
            "Telefone": cliente.telefone,
            "Endereço": {
                "Rua": cliente.endereco.rua,
                "Número": cliente.endereco.numero,
                "Complemento": cliente.endereco.complemento,
                "Bairro": cliente.endereco.bairro,
                "Cidade": cliente.endereco.cidade,
                "Estado": cliente.endereco.estado
            } if cliente.endereco else None
        }
        for cliente in clientes
    ]
    return jsonify(clientes_list)

@clientes.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
    cpf = data.get('cpf')
    senha = data.get('senha')
    telefone = data.get('telefone', '')
    referencias = data.get('referencias', '')
    dt_nasc_str = data.get('dt_nasc', None)

    rua = data.get('rua', '')
    numero = data.get('numero', '')
    complemento = data.get('complemento', '')
    bairro = data.get('bairro', '')
    cidade = data.get('cidade', '')
    estado = data.get('estado', '')

    if not is_cpf_valid(cpf):
        return jsonify({"message": "CPF inválido."}), 400

    dt_nasc = None
    if dt_nasc_str:
        try:
            dt_nasc = datetime.strptime(dt_nasc_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "Data de nascimento em formato inválido. Use AAAA-MM-DD."}), 400

    if Clientes.query.filter((Clientes.email == email) | (Clientes.cpf == cpf)).first():
        return jsonify({"message": "Email ou CPF já cadastrado."}), 400

    hashed_password = generate_password_hash(senha)

    novo_endereco = Enderecos(
        rua=rua,
        numero=numero,
        complemento=complemento,
        bairro=bairro,
        cidade=cidade,
        estado=estado
    )

    token_confirmacao = secrets.token_urlsafe(32)
    novo_cliente = Clientes(
        nome=nome,
        email=email,
        cpf=cpf,
        telefone=telefone,
        senha=hashed_password,
        referencias=referencias,
        dt_nasc=dt_nasc,
        endereco=novo_endereco,
        email_confirmado=False,
        token_confirmacao=token_confirmacao
    )

    try:
        db.session.add(novo_endereco)
        db.session.add(novo_cliente)
        db.session.commit()

        link_confirmacao = url_for('clientes.confirm_email', token=token_confirmacao, _external=True)
        send_email(
            subject="Confirme seu email",
            recipients=[email],
            body=f"Olá {nome}, clique no link para confirmar seu email: {link_confirmacao}"
        )

        return jsonify({"message": "Inscrição realizada com sucesso! Verifique seu email para confirmação."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao realizar a inscrição: {str(e)}"}), 500

@clientes.route('/confirm/<token>', methods=['GET'])
def confirm_email(token):
    cliente = Clientes.query.filter_by(token_confirmacao=token).first()

    if not cliente:
        return jsonify({"message": "Token inválido ou expirado."}), 400

    if cliente.email_confirmado:
        return jsonify({"message": "Email já confirmado."}), 400

    cliente.email_confirmado = True
    cliente.token_confirmacao = None

    try:
        db.session.commit()
        return jsonify({"message": "Email confirmado com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao confirmar email: {str(e)}"}), 500
