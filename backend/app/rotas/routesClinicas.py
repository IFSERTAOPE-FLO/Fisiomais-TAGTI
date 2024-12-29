from flask import Blueprint, jsonify, request
from app.models import Clinicas, Enderecos, Colaboradores, db
from app.utils import is_cnpj_valid
from flask_jwt_extended import jwt_required, get_jwt_identity

clinicas = Blueprint('clinicas', __name__)

# Função para verificar se o usuário é administrador
def is_admin():
    role = request.headers.get('Role')  # Pega o role diretamente do cabeçalho da requisição
    return role == 'admin'

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
@jwt_required()
def register_clinica():
    if not is_admin():  # Verifica se o usuário é administrador
        return jsonify({"message": "Acesso negado: somente administradores podem adicionar clínicas."}), 403

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

    # Validação do CNPJ
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
    
    
# Rota para remover uma clínica
@clinicas.route('/remover_clinica/<int:clinica_id>', methods=['DELETE'])
@jwt_required()
def remover_clinica(clinica_id):
    if not is_admin():  # Verifica se o usuário é administrador
        return jsonify({"message": "Acesso negado: somente administradores podem remover clínicas."}), 403

    # Buscar a clínica pelo ID
    clinica = Clinicas.query.get(clinica_id)
    
    if not clinica:
        return jsonify({'message': 'Clínica não encontrada.'}), 404

    # Reatribuir o relacionamento de colaboradores para NULL
    colaboradores = Colaboradores.query.filter_by(clinica_id=clinica_id).all()
    for colaborador in colaboradores:
        colaborador.clinica_id = None
    
    # Remover a clínica
    try:
        # Remover o endereço da clínica
        if clinica.endereco:
            db.session.delete(clinica.endereco)
        
        # Remover a clínica
        db.session.delete(clinica)
        db.session.commit()
        
        return jsonify({'message': 'Clínica removida com sucesso.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao remover clínica: {str(e)}'}), 500

@clinicas.route('/editar_clinica/<int:clinica_id>', methods=['PUT'])
@jwt_required()
def editar_clinica(clinica_id):
    try:
        data = request.get_json()
        clinica = Clinicas.query.get(clinica_id)

        if not clinica:
            return jsonify({"message": "Clínica não encontrada!"}), 404

        # Atualizar os dados da clínica
        for key, value in data.items():
            if key == 'endereco':
                endereco_data = value  # O valor de 'endereco' é um dicionário

                # Verifica se o id_endereco foi passado
                if endereco_data.get('id_endereco'):
                    endereco = Enderecos.query.filter_by(id_endereco=endereco_data['id_endereco']).first()
                    if not endereco:
                        return jsonify({"message": "Endereço não encontrado!"}), 404
                else:
                    endereco = Enderecos(**endereco_data)
                    db.session.add(endereco)
                    db.session.commit()

                clinica.endereco = endereco
            else:
                if hasattr(clinica, key):  # Verifica se o atributo existe no modelo
                    setattr(clinica, key, value)

        db.session.commit()
        return jsonify({"message": "Clínica atualizada com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao atualizar a clínica: {str(e)}"}), 500
