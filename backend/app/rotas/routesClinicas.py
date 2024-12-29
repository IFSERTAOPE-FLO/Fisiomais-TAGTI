from flask import Blueprint, jsonify, request
from app.models import Clinicas, Enderecos, Colaboradores, db
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
    
@clinicas.route('/adicionar_colaborador', methods=['POST'])
def adicionar_colaborador():
    """
    Adiciona um colaborador a uma clínica existente.
    """
    dados = request.get_json()
    colaborador_id = dados.get('colaborador_id')
    clinica_id = dados.get('clinica_id')

    # Verifica se o ID do colaborador e da clínica foram fornecidos
    if not colaborador_id or not clinica_id:
        return jsonify({'message': 'ID do colaborador e da clínica são obrigatórios.'}), 400

    # Busca o colaborador pelo ID
    colaborador = Colaboradores.query.get(colaborador_id)
    if not colaborador:
        return jsonify({'message': 'Colaborador não encontrado.'}), 404

    # Busca a clínica pelo ID
    clinica = Clinicas.query.get(clinica_id)
    if not clinica:
        return jsonify({'message': 'Clínica não encontrada.'}), 404

    # Associa o colaborador à clínica
    try:
        colaborador.clinica = clinica
        db.session.commit()
        return jsonify({'message': 'Colaborador adicionado à clínica com sucesso.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao adicionar colaborador à clínica: {str(e)}'}), 500

@clinicas.route('/remover_colaborador', methods=['DELETE'])
def remover_colaborador():
    dados = request.get_json()
    colaborador_id = dados.get('colaborador_id')
    clinica_id = dados.get('clinica_id')

    if not colaborador_id or not clinica_id:
        return jsonify({'message': 'ID do colaborador e da clínica são obrigatórios.'}), 400

    colaborador = Colaboradores.query.get(colaborador_id)
    if not colaborador or colaborador.clinica_id != clinica_id:
        return jsonify({'message': 'Colaborador não encontrado na clínica.'}), 404

    try:
        colaborador.clinica_id = None
        db.session.commit()
        return jsonify({'message': 'Colaborador removido da clínica com sucesso.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao remover colaborador da clínica: {str(e)}'}), 500

