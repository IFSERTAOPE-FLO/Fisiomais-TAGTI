from flask import Blueprint, jsonify, request, url_for
from app.models import Clientes, Enderecos, Colaboradores, db
from app.utils import is_cpf_valid, send_email
from werkzeug.security import generate_password_hash
from datetime import datetime
import secrets
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.utils import secure_filename

clientes = Blueprint('clientes', __name__)

"""
Rotas relacionadas a clientes no sistema:

# Rotas GET:
1. '/' - Retorna a lista de todos os clientes cadastrados com seus detalhes, incluindo informações de endereço (se disponíveis).
2. '/confirm/<token>' - Confirma o e-mail de um cliente usando um token de confirmação.

# Rotas POST:
1. '/register' - Registra um cliente no sistema, exigindo autenticação JWT. Inclui validações de CPF, duplicidade de dados e informações obrigatórias.
2. '/register/public' - Registra um cliente no sistema sem exigir autenticação JWT. Inclui validações semelhantes à rota '/register', além de verificar a idade mínima de 18 anos.

Cada rota executa operações como validação de dados, criptografia de senha, gerenciamento de tokens de confirmação de e-mail e interação com o banco de dados para criar e salvar registros.
"""


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
    print("Dados recebidos no request:", data)

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
        print(f"CPF inválido: {cpf}")
        return jsonify({"message": "CPF inválido."}), 400

    # Converter a data de nascimento
    dt_nasc = None
    if dt_nasc_str:
        try:
            dt_nasc = datetime.strptime(dt_nasc_str, '%Y-%m-%d').date()
            print(f"Data de nascimento convertida: {dt_nasc}")
        except ValueError as ve:
            print(f"Erro ao converter data de nascimento: {dt_nasc_str}, erro: {ve}")
            return jsonify({"message": "Data de nascimento em formato inválido. Use AAAA-MM-DD."}), 400

    # Obter o e-mail do usuário autenticado
    usuario_email = get_jwt_identity()
    print(f"Usuário logado: {usuario_email}")

    # Verificar se o e-mail ou CPF já estão cadastrados
    cliente_existente = Clientes.query.filter((Clientes.email == email) | (Clientes.cpf == cpf)).first()
    colaborador_existente = Colaboradores.query.filter((Colaboradores.email == email) | (Colaboradores.cpf == cpf)).first()
    if cliente_existente or colaborador_existente:
        print(f"Email ou CPF já cadastrado: Email: {email}, CPF: {cpf}")
        return jsonify({"message": "Email ou CPF já cadastrado."}), 400

    # Hash da senha
    try:
        hashed_password = generate_password_hash(senha)
        print(f"Senha criptografada com sucesso para o cliente: {nome}")
    except Exception as e:
        print(f"Erro ao criptografar senha: {e}")
        return jsonify({"message": "Erro ao processar a senha."}), 500

    # Criar novo endereço
    try:
        novo_endereco = Enderecos(
            rua=rua,
            numero=numero,
            complemento=complemento,
            bairro=bairro,
            cidade=cidade,
            estado=estado
        )
        print(f"Endereço criado: {novo_endereco}")
    except Exception as e:
        print(f"Erro ao criar endereço: {e}")
        return jsonify({"message": "Erro ao processar o endereço."}), 500

    # Criar novo cliente
    try:
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
            sexo=sexo
        )
        print(f"Cliente criado: {novo_cliente}")
    except Exception as e:
        print(f"Erro ao criar cliente: {e}")
        return jsonify({"message": "Erro ao processar o cliente."}), 500

    # Salvar no banco de dados
    try:
        db.session.add(novo_endereco)
        db.session.add(novo_cliente)
        db.session.commit()
        print("Cliente e endereço salvos com sucesso no banco de dados.")
        return jsonify({"message": "Inscrição realizada com sucesso!"}), 201
    except Exception as e:
        print(f"Erro ao salvar no banco de dados: {e}")
        db.session.rollback()
        return jsonify({"message": f"Erro ao realizar a inscrição: {str(e)}"}), 500



from datetime import datetime

@clientes.route('/register/public', methods=['POST'])
def register_without_jwt():
    data = request.get_json()  # Recebe os dados em formato JSON
    nome = data.get('nome')
    email = data.get('email')
    cpf = data.get('cpf', '').strip()    
    senha = data.get('senha')
    telefone = data.get('telefone', '')
    dt_nasc_str = data.get('dt_nasc', None)
    sexo = data.get('sexo', '').strip()  # Campo sexo
    
    # Verificar se o sexo foi informado
    if sexo not in ['Masculino', 'Feminino', 'Outro']:
        return jsonify({"message": "Sexo inválido. Deve ser 'Masculino', 'Feminino' ou 'Outro'."}), 400
        
    if not cpf:
        return jsonify({"message": "CPF é obrigatório."}), 400

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
    
    # Verificar se dt_nasc foi corretamente convertida
    if not dt_nasc:
        return jsonify({"message": "Data de nascimento é obrigatória."}), 400

    # Verificar a idade mínima de 18 anos
    today = datetime.today().date()
    idade = today.year - dt_nasc.year - ((today.month, today.day) < (dt_nasc.month, dt_nasc.day))
    
    if idade < 18:
        return jsonify({"message": "A idade mínima para se inscrever é de 18 anos."}), 400

    # Verificar se o e-mail ou CPF já estão cadastrados
     # Verificar duplicidade de email ou CPF entre Clientes e Colaboradores
    if Clientes.query.filter((Clientes.email == email) | (Clientes.cpf == cpf)).first() or \
       Colaboradores.query.filter((Colaboradores.email == email) | (Colaboradores.cpf == cpf)).first():
        return jsonify({"message": "Email ou CPF já cadastrado."}), 400
    
    # Verificar se o telefone já está cadastrado
    if Clientes.query.filter(Clientes.telefone == telefone).first():
        return jsonify({"message": "Telefone já cadastrado."}), 400    

    # Hash da senha
    hashed_password = generate_password_hash(senha)

    # Gerar token de confirmação de email
    token_confirmacao = secrets.token_urlsafe(32)
    novo_cliente = Clientes(
        nome=nome,
        email=email,
        cpf=cpf,
        telefone=telefone,
        senha=hashed_password,
        dt_nasc=dt_nasc,
        sexo=sexo,  
        email_confirmado=False,
        token_confirmacao=token_confirmacao
    )

    try:
        db.session.add(novo_cliente)
        db.session.commit()
        # Simulação de falha no envio de e-mail (sem enviar)
        # link_confirmacao = url_for('clientes.confirm_email', token=token_confirmacao, _external=True)
        # try:
        #     send_email(
        #         subject="Confirme seu email",
        #         recipients=[email],
        #         body=f"Olá {nome}, clique no link para confirmar seu email: {link_confirmacao}"
        #     )
        # except Exception as e:
        #     db.session.rollback()  # Reverter a inscrição no banco se o envio falhar
        #     return jsonify({"message": f"Erro ao enviar o e-mail de confirmação: {str(e)}"}), 500

        # Realizar login automático
        access_token = create_access_token(identity=email)

        return jsonify({
            "message": "Inscrição realizada com sucesso! Verifique seu email para confirmação.",
            "access_token": access_token,
            "userId": novo_cliente.id_cliente,
            "name": novo_cliente.nome,
            "role": "cliente",
            "email": email  # Adiciona o email para login automático
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
