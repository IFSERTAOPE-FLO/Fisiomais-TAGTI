from flask import Blueprint, jsonify, request, url_for
from app.models import Clientes, Enderecos, Colaboradores, db, PlanosTratamento, HistoricoSessao

from werkzeug.security import generate_password_hash
from datetime import datetime
import secrets
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.utils import secure_filename

planos_de_tratamento = Blueprint('planos_de_tratamento', __name__)

@planos_de_tratamento.route('/criar_planos_de_tratamento', methods=['POST'])
def criar_plano_tratamento():
    data = request.get_json()

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
            data_fim=datetime.strptime(data['data_fim'], '%Y-%m-%d') if 'data_fim' in data else None
        )

        db.session.add(novo_plano)
        db.session.commit()
        return jsonify({'message': 'Plano de tratamento criado com sucesso!'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400