from flask import Blueprint, jsonify, request, url_for
from app.models import Clientes, Enderecos, Colaboradores, db, PlanosTratamento, HistoricoSessao

from werkzeug.security import generate_password_hash
from datetime import datetime
import secrets
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.utils import secure_filename

import os
from flask import current_app

UPLOAD_FOLDER = os.path.join(current_app.root_path, 'uploads/anamneses')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Garante que a pasta existe

planos_de_tratamento = Blueprint('planos_de_tratamento', __name__)

@planos_de_tratamento.route('/criar_planos_de_tratamento', methods=['POST'])
def criar_plano_tratamento():
    if 'anamnese' not in request.files:
        return jsonify({'error': 'Arquivo de anamnese obrigatório'}), 400

    file = request.files['anamnese']
    data = request.form  # Agora os dados virão do formulário

    if file and file.filename.endswith(('.pdf', '.doc', '.docx')):
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
    else:
        return jsonify({'error': 'Formato de arquivo inválido'}), 400
    #data = request.get_json()
    

    try:
        novo_plano = PlanosTratamento(
            id_cliente=data['id_cliente'],
            id_colaborador=data['id_colaborador'],
            id_servico=data['id_servico'],
            diagnostico=data['diagnostico'],
            objetivos=data['objetivos'],
            metodologia=data.get('metodologia', ''),
            duracao_prevista=data['duracao_prevista'],
            data_inicio=datetime.strptime(data['data_inicio'], '%Y-%m-%d'),
            data_fim=datetime.strptime(data['data_fim'], '%Y-%m-%d') if 'data_fim' in data else None,
            anamnese_filename=filename  # Salvando o nome do arquivo no banco
        )

        db.session.add(novo_plano)
        db.session.commit()
        return jsonify({'message': 'Plano de tratamento criado com sucesso!'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    
from flask import Blueprint, jsonify, request
from app.models import db, PlanosTratamento, HistoricoSessao, Clientes
from flask_jwt_extended import jwt_required, get_jwt_identity

planos_de_tratamento = Blueprint('planos_de_tratamento', __name__)

# Listar planos de tratamento de um cliente específico
@planos_de_tratamento.route('/planos_de_tratamento/<int:id_cliente>', methods=['GET'])
@jwt_required()
def listar_planos_cliente(id_cliente):
    cliente = Clientes.query.get(id_cliente)
    if not cliente:
        return jsonify({'error': 'Cliente não encontrado'}), 404

    planos = PlanosTratamento.query.filter_by(id_cliente=id_cliente).all()

    lista_planos = [{
        'id_plano_tratamento': plano.id_plano_tratamento,
        'diagnostico': plano.diagnostico,
        'objetivos': plano.objetivos,
        'metodologia': plano.metodologia,
        'duracao_prevista': plano.duracao_prevista,
        'data_inicio': plano.data_inicio.strftime('%Y-%m-%d'),
        'data_fim': plano.data_fim.strftime('%Y-%m-%d') if plano.data_fim else None,
        'anamnese_filename': plano.anamnese_filename
    } for plano in planos]

    return jsonify(lista_planos), 200


# Listar histórico de sessões de um plano de tratamento específico
@planos_de_tratamento.route('/historico_sessoes/<int:id_plano_tratamento>', methods=['GET'])
@jwt_required()
def listar_historico_sessoes(id_plano_tratamento):
    plano = PlanosTratamento.query.get(id_plano_tratamento)
    if not plano:
        return jsonify({'error': 'Plano de tratamento não encontrado'}), 404

    sessoes = HistoricoSessao.query.filter_by(id_plano_tratamento=id_plano_tratamento).all()

    historico = [{
        'id_sessao': sessao.id_sessao,
        'data_sessao': sessao.data_sessao.strftime('%Y-%m-%d %H:%M'),
        'detalhes': sessao.detalhes,
        'observacoes': sessao.observacoes,
        'avaliacao_cliente': sessao.avaliacao_cliente,
        'ficha_anamnese': sessao.ficha_anamnese
    } for sessao in sessoes]

    return jsonify(historico), 200
