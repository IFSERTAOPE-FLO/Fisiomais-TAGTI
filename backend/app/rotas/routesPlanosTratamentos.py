from flask import Blueprint, jsonify, request, url_for
from app.models import Clientes, Enderecos,Servicos, Clinicas, Agendamentos,  Colaboradores, db,PlanosTratamentoServicos, PlanosTratamento, HistoricoSessao

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

@planos_de_tratamento.route('/criar', methods=['POST'])
@jwt_required()
def criar_plano_tratamento():
    data = request.get_json()

    # Verifica se o usuário é um colaborador
    current_user_email = get_jwt_identity()
    colaborador = Colaboradores.query.filter_by(email=current_user_email).first()
    if not colaborador:
        return jsonify({"message": "Acesso negado. Somente colaboradores podem criar planos de tratamento."}), 403

    # Valida campos obrigatórios
    required_fields = ['diagnostico', 'objetivos', 'duracao_prevista', 'servicos']
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Campo obrigatório ausente: {field}"}), 400

    # Valida serviços
    servicos = data['servicos']
    for servico in servicos:
        if 'id_servico' not in servico or 'quantidade_sessoes' not in servico:
            return jsonify({"message": "Cada serviço deve conter id_servico e quantidade_sessoes."}), 400
        if not Servicos.query.get(servico['id_servico']):
            return jsonify({"message": f"Serviço com id {servico['id_servico']} não encontrado."}), 404

    # Cria o plano de tratamento padrão
    novo_plano = PlanosTratamento(
        diagnostico=data['diagnostico'],
        objetivos=data['objetivos'],
        metodologia=data.get('metodologia'),
        duracao_prevista=data['duracao_prevista'],
        valor=data.get('valor')
    )
    db.session.add(novo_plano)
    db.session.flush()  # Obtém o ID sem commit

    # Associa serviços ao plano
    for servico in servicos:
        associacao = PlanosTratamentoServicos(
            id_plano_tratamento=novo_plano.id_plano_tratamento,
            id_servico=servico['id_servico'],
            quantidade_sessoes=servico['quantidade_sessoes']
        )
        db.session.add(associacao)

    db.session.commit()

    return jsonify({
        "message": "Plano de tratamento padrão criado com sucesso.",
        "id_plano_tratamento": novo_plano.id_plano_tratamento
    }), 201

@planos_de_tratamento.route('/', methods=['GET'])
@jwt_required()
def listar_planos_tratamento():
    # Verifica se o usuário é um colaborador
    current_user_email = get_jwt_identity()
    colaborador = Colaboradores.query.filter_by(email=current_user_email).first()
    if not colaborador:
        return jsonify({"message": "Acesso negado. Somente colaboradores podem listar planos de tratamento."}), 403

    # Busca todos os planos padrão
    planos = PlanosTratamento.query.all()
    planos_list = []

    for plano in planos:
        servicos = []
        for associacao in plano.servicos_relacionados:
            servico = Servicos.query.get(associacao.id_servico)
            servicos.append({
                "id_servico": servico.id_servico,
                "nome": servico.nome,
                "quantidade_sessoes": associacao.quantidade_sessoes
            })

        plano_data = {
            "id_plano_tratamento": plano.id_plano_tratamento,
            "diagnostico": plano.diagnostico,
            "objetivos": plano.objetivos,
            "metodologia": plano.metodologia,
            "duracao_prevista": plano.duracao_prevista,
            "valor": float(plano.valor) if plano.valor else None,
            "servicos": servicos
        }
        planos_list.append(plano_data)

    return jsonify(planos_list), 200

@planos_de_tratamento.route('/editar/<int:id_plano>', methods=['PUT'])
@jwt_required()
def editar_plano_tratamento(id_plano):
    data = request.get_json()

    # Verifica se o usuário é um colaborador
    current_user_email = get_jwt_identity()
    colaborador = Colaboradores.query.filter_by(email=current_user_email).first()
    if not colaborador:
        return jsonify({"message": "Acesso negado. Somente colaboradores podem editar planos de tratamento."}), 403

    # Busca o plano de tratamento
    plano = PlanosTratamento.query.get(id_plano)
    if not plano:
        return jsonify({"message": "Plano de tratamento não encontrado."}), 404

    # Atualiza os campos
    plano.diagnostico = data.get('diagnostico', plano.diagnostico)
    plano.objetivos = data.get('objetivos', plano.objetivos)
    plano.metodologia = data.get('metodologia', plano.metodologia)
    plano.duracao_prevista = data.get('duracao_prevista', plano.duracao_prevista)
    plano.valor = data.get('valor', plano.valor)

    # Atualiza serviços associados
    if 'servicos' in data:
        PlanosTratamentoServicos.query.filter_by(id_plano_tratamento=id_plano).delete()
        for servico in data['servicos']:
            associacao = PlanosTratamentoServicos(
                id_plano_tratamento=id_plano,
                id_servico=servico['id_servico'],
                quantidade_sessoes=servico['quantidade_sessoes']
            )
            db.session.add(associacao)
    
    db.session.commit()
    return jsonify({"message": "Plano de tratamento atualizado com sucesso."}), 200


@planos_de_tratamento.route('/excluir/<int:id_plano>', methods=['DELETE'])
@jwt_required()
def excluir_plano_tratamento(id_plano):
    # Verifica se o usuário é um colaborador
    current_user_email = get_jwt_identity()
    colaborador = Colaboradores.query.filter_by(email=current_user_email).first()
    if not colaborador:
        return jsonify({"message": "Acesso negado. Somente colaboradores podem excluir planos de tratamento."}), 403

    # Busca o plano de tratamento
    plano = PlanosTratamento.query.get(id_plano)
    if not plano:
        return jsonify({"message": "Plano de tratamento não encontrado."}), 404

    # Remove associações com serviços e o próprio plano
    PlanosTratamentoServicos.query.filter_by(id_plano_tratamento=id_plano).delete()
    db.session.delete(plano)
    db.session.commit()

    return jsonify({"message": "Plano de tratamento excluído com sucesso."}), 200

@planos_de_tratamento.route('/sessoes', methods=['POST'])
@jwt_required()
def criar_sessao():
    data = request.get_json()

    # Verifica se o usuário é um colaborador
    current_user_id = get_jwt_identity()
    colaborador = Colaboradores.query.get(current_user_id)
    if not colaborador:
        return jsonify({"message": "Acesso negado. Somente colaboradores podem criar sessões."}), 403

    # Valida campos obrigatórios
    required_fields = ['id_cliente', 'id_plano_tratamento', 'id_agendamento']
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Campo obrigatório ausente: {field}"}), 400

    # Verifica se cliente, plano e agendamento existem
    cliente = Clientes.query.get(data['id_cliente'])
    plano = PlanosTratamento.query.get(data['id_plano_tratamento'])
    agendamento = Agendamentos.query.get(data['id_agendamento'])

    if not cliente or not plano or not agendamento:
        return jsonify({"message": "Cliente, plano ou agendamento não encontrado."}), 404

    # Cria a sessão no histórico
    nova_sessao = HistoricoSessao(
        id_cliente=data['id_cliente'],
        id_colaborador=current_user_id,
        id_plano_tratamento=data['id_plano_tratamento'],
        id_agendamento=data['id_agendamento'],
        data_sessao=data.get('data_sessao', datetime.utcnow()),
        detalhes=data.get('detalhes'),
        observacoes=data.get('observacoes'),
        avaliacao_cliente=data.get('avaliacao_cliente'),
        ficha_anamnese=data.get('ficha_anamnese')
    )
    db.session.add(nova_sessao)
    db.session.commit()

    return jsonify({
        "message": "Sessão registrada com sucesso.",
        "id_sessao": nova_sessao.id_sessao
    }), 201
    
@planos_de_tratamento.route('/agendamento-plano-tratamento', methods=['POST'])
@jwt_required()
def agendamento_sem_pagamento():
    try:
        data = request.get_json()
        current_user_email = get_jwt_identity()
        colaborador = Colaboradores.query.filter_by(email=current_user_email).first()

        if not colaborador:
            return jsonify({'message': 'Acesso negado'}), 403

        required_fields = ['cliente_id', 'servico_id', 'data', 'detalhes']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'Campo obrigatório ausente: {field}'}), 400

        cliente = Clientes.query.get(data['cliente_id'])
        servico = Servicos.query.get(data['servico_id'])

        if not cliente or not servico:
            return jsonify({'message': 'Cliente ou serviço não encontrado'}), 404

        # Verificar se o serviço requer plano
        if 'pilates' in [t.tipo for t in servico.tipo_servicos] and not cliente.plano_id:
            return jsonify({'message': 'Plano necessário para este serviço'}), 400

        # Criar agendamento
        novo_agendamento = Agendamentos(
            data_e_hora=datetime.fromisoformat(data['data']),
            id_cliente=cliente.id_cliente,
            id_colaborador=colaborador.id_colaborador,
            id_servico=servico.id_servico,
            status='Confirmado',
            id_clinica=colaborador.clinica_id
        )
        db.session.add(novo_agendamento)
        db.session.commit()

        # Adicionar ao histórico
        nova_sessao = HistoricoSessao(
            id_cliente=cliente.id_cliente,
            id_colaborador=colaborador.id_colaborador,
            id_agendamento=novo_agendamento.id_agendamento,
            id_plano_tratamento=cliente.plano_id if cliente.plano_id else None,
            data_sessao=novo_agendamento.data_e_hora,
            detalhes=data.get('detalhes', '')
        )
        db.session.add(nova_sessao)
        db.session.commit()

        return jsonify({
            'message': 'Agendamento criado com sucesso',
            'agendamento_id': novo_agendamento.id_agendamento,
            'sessao_id': nova_sessao.id_sessao
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro: {str(e)}")
        return jsonify({'message': 'Erro interno no servidor'}), 500
# Rotas para Histórico de Sessões
@planos_de_tratamento.route('/historico-sessoes/<int:cliente_id>', methods=['GET'])
@jwt_required()
def listar_historico_sessoes(cliente_id):
    try:
        # Verificar autenticação
        current_user_email = get_jwt_identity()
        user = Clientes.query.filter_by(email=current_user_email).first() or Colaboradores.query.filter_by(email=current_user_email).first()
        
        if not user:
            return jsonify({'message': 'Acesso não autorizado'}), 401

        # Buscar histórico do cliente
        historico = HistoricoSessao.query.filter_by(id_cliente=cliente_id).all()
        
        historico_formatado = []
        for sessao in historico:
            agendamento = Agendamentos.query.get(sessao.id_agendamento)
            servico = Servicos.query.get(agendamento.id_servico)
            colaborador = Colaboradores.query.get(sessao.id_colaborador)
            
            historico_formatado.append({
                'id_sessao': sessao.id_sessao,
                'data': sessao.data_sessao.isoformat(),
                'servico': servico.nome,
                'colaborador': colaborador.nome,
                'detalhes': sessao.detalhes,
                'observacoes': sessao.observacoes,
                'avaliacao_cliente': sessao.avaliacao_cliente,
                'plano_tratamento': sessao.plano_tratamento.diagnostico if sessao.plano_tratamento else None
            })

        return jsonify(historico_formatado), 200

    except Exception as e:
        print(f"Erro: {str(e)}")
        return jsonify({'message': 'Erro ao buscar histórico'}), 500