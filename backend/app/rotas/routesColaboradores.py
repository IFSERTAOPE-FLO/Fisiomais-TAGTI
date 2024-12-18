from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from app.models import Colaboradores, db
from app.utils import is_cpf_valid  # Função de validação de CPF, que pode ser movida para utils

colaboradores = Blueprint('colaboradores', __name__)

@colaboradores.route('/register', methods=['POST'])
def register_colaborador():
    data = request.get_json()

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


@colaboradores.route('/', methods=['GET'])
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

@colaboradores.route('/colaboradoresdisponiveis', methods=['GET'])
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