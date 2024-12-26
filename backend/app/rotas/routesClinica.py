from flask import Blueprint, jsonify, request
from app.models import Clinicas, Enderecos, db
from app.utils import is_cnpj_valid
from werkzeug.security import generate_password_hash

clinicas = Blueprint('clinicas', __name__)

# Rota para listar clínicas
@clinicas.route('/', methods=['GET'])
def get_clinicas():
    clinicas = Clinicas.query.all()
    clinicas_list = [
        {
            "ID_Clinica": clinica.id_clinica,
            "Nome": clinica.nome,
            "CNPJ": clinica.cnpj,
            "Telefone": clinica.telefone,
            "Endereço": {
                "Rua": clinica.endereco.rua,
                "Número": clinica.endereco.numero,
                "Complemento": clinica.endereco.complemento,
                "Bairro": clinica.endereco.bairro,
                "Cidade": clinica.endereco.cidade,
                "Estado": clinica.endereco.estado
            } if clinica.endereco else None
        }
        for clinica in clinicas
    ]
    return jsonify(clinicas_list)

# Rota para adicionar uma nova clínica
@clinicas.route('/register', methods=['POST'])
def register_clinica():
    data = request.get_json()
    nome = data.get('nome')
    cnpj = data.get('cnpj')
    telefone = data.get('telefone', '')
    
    rua = data.get('rua', '')
    numero = data.get('numero', '')
    complemento = data.get('complemento', '')
    bairro = data.get('bairro', '')
    cidade = data.get('cidade', '')
    estado = data.get('estado', '')

    # Validação do CNPJ (você pode criar uma função `is_cnpj_valid` similar à de CPF)
    if not is_cnpj_valid(cnpj):
        return jsonify({"message": "CNPJ inválido."}), 400

    # Verificar se já existe uma clínica com o mesmo CNPJ
    if Clinicas.query.filter_by(cnpj=cnpj).first():
        return jsonify({"message": "CNPJ já cadastrado."}), 400

    # Criar novo endereço
    novo_endereco = Enderecos(
        rua=rua,
        numero=numero,
        complemento=complemento,
        bairro=bairro,
        cidade=cidade,
        estado=estado
    )

    # Criar nova clínica
    nova_clinica = Clinicas(
        nome=nome,
        cnpj=cnpj,
        telefone=telefone,
        endereco=novo_endereco
    )

    try:
        db.session.add(novo_endereco)
        db.session.add(nova_clinica)
        db.session.commit()

        return jsonify({"message": "Clínica cadastrada com sucesso!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao cadastrar a clínica: {str(e)}"}), 500
