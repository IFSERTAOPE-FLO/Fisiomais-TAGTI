from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from app.models import db, HistoricoSessao, Clientes, Colaboradores, PlanosTratamento, Agendamentos

historico_sessoes = Blueprint('historico_sessoes', __name__)

# Criar uma nova sessão no histórico
@historico_sessoes.route('/historico_sessoes', methods=['POST'])
@jwt_required()
def criar_sessao():
    data = request.get_json()
    
    required_fields = ['id_cliente', 'id_colaborador', 'id_agendamento', 'data_sessao']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Campo obrigatório ausente: {field}'}), 400
    
    nova_sessao = HistoricoSessao(
        id_cliente=data['id_cliente'],
        id_colaborador=data['id_colaborador'],
        id_agendamento=data['id_agendamento'],
        id_plano_tratamento=data.get('id_plano_tratamento'),
        data_sessao=datetime.fromisoformat(data['data_sessao']),
        detalhes=data.get('detalhes'),
        observacoes=data.get('observacoes'),
        avaliacao_cliente=data.get('avaliacao_cliente'),
        ficha_anamnese=data.get('ficha_anamnese'),
        sessoes_realizadas=data.get('sessoes_realizadas', 0)
    )
    
    db.session.add(nova_sessao)
    db.session.commit()
    return jsonify({'message': 'Sessão criada com sucesso', 'id_sessao': nova_sessao.id_sessao}), 201

# Listar todas as sessões (opcionalmente filtradas por cliente)
@historico_sessoes.route('', methods=['GET'])
@jwt_required()
def listar_sessoes():
    id_cliente = request.args.get('id_cliente')
    query = HistoricoSessao.query
    
    if id_cliente:
        query = query.filter_by(id_cliente=id_cliente)
    
    sessoes = query.all()
    return jsonify([
        {
            'id_sessao': s.id_sessao,
            'id_cliente': s.id_cliente,
            'id_colaborador': s.id_colaborador,
            'id_agendamento': s.id_agendamento,
            'id_plano_tratamento': s.id_plano_tratamento,
            'data_sessao': s.data_sessao.isoformat(),
            'detalhes': s.detalhes,
            'observacoes': s.observacoes,
            'avaliacao_cliente': s.avaliacao_cliente,
            'ficha_anamnese': s.ficha_anamnese,
            'sessoes_realizadas': s.sessoes_realizadas
        } for s in sessoes
    ])

# Obter uma sessão específica pelo ID
@historico_sessoes.route('/<int:id_sessao>', methods=['GET'])
@jwt_required()
def obter_sessao(id_sessao):
    sessao = HistoricoSessao.query.get(id_sessao)
    if not sessao:
        return jsonify({'message': 'Sessão não encontrada'}), 404
    
    return jsonify({
        'id_sessao': sessao.id_sessao,
        'id_cliente': sessao.id_cliente,
        'id_colaborador': sessao.id_colaborador,
        'id_agendamento': sessao.id_agendamento,
        'id_plano_tratamento': sessao.id_plano_tratamento,
        'data_sessao': sessao.data_sessao.isoformat(),
        'detalhes': sessao.detalhes,
        'observacoes': sessao.observacoes,
        'avaliacao_cliente': sessao.avaliacao_cliente,
        'ficha_anamnese': sessao.ficha_anamnese,
        'sessoes_realizadas': sessao.sessoes_realizadas
    })

# Atualizar uma sessão existente
@historico_sessoes.route('/<int:id_sessao>', methods=['PUT'])
@jwt_required()
def atualizar_sessao(id_sessao):
    sessao = HistoricoSessao.query.get(id_sessao)
    if not sessao:
        return jsonify({'message': 'Sessão não encontrada'}), 404
    
    data = request.get_json()
    sessao.id_cliente = data.get('id_cliente', sessao.id_cliente)
    sessao.id_colaborador = data.get('id_colaborador', sessao.id_colaborador)
    sessao.id_agendamento = data.get('id_agendamento', sessao.id_agendamento)
    sessao.id_plano_tratamento = data.get('id_plano_tratamento', sessao.id_plano_tratamento)
    sessao.data_sessao = datetime.fromisoformat(data['data_sessao']) if 'data_sessao' in data else sessao.data_sessao
    sessao.detalhes = data.get('detalhes', sessao.detalhes)
    sessao.observacoes = data.get('observacoes', sessao.observacoes)
    sessao.avaliacao_cliente = data.get('avaliacao_cliente', sessao.avaliacao_cliente)
    sessao.ficha_anamnese = data.get('ficha_anamnese', sessao.ficha_anamnese)
    sessao.sessoes_realizadas = data.get('sessoes_realizadas', sessao.sessoes_realizadas)
    
    db.session.commit()
    return jsonify({'message': 'Sessão atualizada com sucesso'})

# Deletar uma sessão
@historico_sessoes.route('/<int:id_sessao>', methods=['DELETE'])
@jwt_required()
def deletar_sessao(id_sessao):
    sessao = HistoricoSessao.query.get(id_sessao)
    if not sessao:
        return jsonify({'message': 'Sessão não encontrada'}), 404
    
    db.session.delete(sessao)
    db.session.commit()
    return jsonify({'message': 'Sessão deletada com sucesso'})
