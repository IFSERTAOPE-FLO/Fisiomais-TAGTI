from flask import Blueprint, jsonify, request, url_for
from app.models import Clientes, Enderecos, db
from app.utils import is_cpf_valid, send_email
from werkzeug.security import generate_password_hash
from datetime import datetime
import secrets
from app.utils import is_cpf_valid, send_email
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.utils import secure_filename

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
@jwt_required()  # Exige que o usuário esteja autenticado
def register_with_jwt():
    # Obter dados do JSON enviado
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
    sexo = data.get('sexo', '')  # Novo campo 'sexo'

    # Verificar e validar CPF
    if not is_cpf_valid(cpf):
        return jsonify({"message": "CPF inválido."}), 400

    # Converter a data de nascimento
    dt_nasc = None
    if dt_nasc_str:
        try:
            dt_nasc = datetime.strptime(dt_nasc_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "Data de nascimento em formato inválido. Use AAAA-MM-DD."}), 400

    # Obter o e-mail do usuário autenticado
    usuario_email = get_jwt_identity()
    print(f"Usuário logado: {usuario_email}")

    # Verificar se o e-mail ou CPF já estão cadastrados
    if Clientes.query.filter((Clientes.email == email) | (Clientes.cpf == cpf)).first():
        return jsonify({"message": "Email ou CPF já cadastrado."}), 400

    # Hash da senha
    hashed_password = generate_password_hash(senha)

    # Criar novo endereço
    novo_endereco = Enderecos(
        rua=rua,
        numero=numero,
        complemento=complemento,
        bairro=bairro,
        cidade=cidade,
        estado=estado
    )

    # Gerar token de confirmação de email
   
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
        sexo = data.get('sexo', '')  # Novo campo 'sexo'
        
    )

    try:
        db.session.add(novo_endereco)
        db.session.add(novo_cliente)
        db.session.commit()        

        return jsonify({"message": "Inscrição realizada com sucesso! "}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao realizar a inscrição: {str(e)}"}), 500

@clientes.route('/register/public', methods=['POST'])
def register_without_jwt():
    data = request.form
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
    sexo = data.get('sexo')  # Novo campo 'sexo'

    # Verificar e validar CPF
    if not is_cpf_valid(cpf):
        return jsonify({"message": "CPF inválido."}), 400

    # Converter a data de nascimento
    dt_nasc = None
    if dt_nasc_str:
        try:
            dt_nasc = datetime.strptime(dt_nasc_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"message": "Data de nascimento em formato inválido. Use AAAA-MM-DD."}), 400

    # Verificar se o e-mail ou CPF já estão cadastrados
    if Clientes.query.filter((Clientes.email == email) | (Clientes.cpf == cpf)).first():
        return jsonify({"message": "Email ou CPF já cadastrado."}), 400

    # Hash da senha
    hashed_password = generate_password_hash(senha)

    # Criar novo endereço
    novo_endereco = Enderecos(
        rua=rua,
        numero=numero,
        complemento=complemento,
        bairro=bairro,
        cidade=cidade,
        estado=estado
    )

    # Processar a foto
    photo = request.files.get('foto')  # Campo foto
    if photo:
        photo_filename = secure_filename(photo.filename)
        photo.save(os.path.join(app.config['UPLOAD_FOLDER'], photo_filename))
    else:
        photo_filename = None  # Caso não tenha foto

    # Gerar token de confirmação de email
    token_confirmacao = secrets.token_urlsafe(32)
    novo_cliente = Clientes(
        nome=nome,
        email=email,
        cpf=cpf,
        telefone=telefone,
        senha=hashed_password,
        sexo=sexo,  # Adiciona o sexo
        photo=photo_filename,  # Salva o nome do arquivo de foto
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

        # Enviar email de confirmação
        link_confirmacao = url_for('clientes.confirm_email', token=token_confirmacao, _external=True)
        send_email(
            subject="Confirme seu email",
            recipients=[email],
            body=f"Olá {nome}, clique no link para confirmar seu email: {link_confirmacao}"
        )

        # Realizar login automático
        access_token = create_access_token(identity=email)

        return jsonify({
            "message": "Inscrição realizada com sucesso! Verifique seu email para confirmação.",
            "access_token": access_token,
            "userId": novo_cliente.id_cliente,
            "name": novo_cliente.nome,
            "role": "cliente",
            "photo": novo_cliente.photo if novo_cliente.photo else ""
        }), 201
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
