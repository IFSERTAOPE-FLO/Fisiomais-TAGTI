from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError
from app.models import Agendamentos, Pagamentos, Faturas, Clientes, Servicos, Colaboradores, Clinicas
from app import db


'''
Aqui estão as rotas CRUD para as tabelas `Pagamentos` e `Faturas`, usando o Flask e Blueprints, conforme solicitado:

### Explicação:
1. **Rota para Criar Pagamento** (`POST /pagamentos`): Cria um pagamento com dados de agendamento e valores fornecidos.
2. **Rota para Listar Pagamentos** (`GET /pagamentos`): Retorna uma lista de pagamentos existentes.
3. **Rota para Atualizar Pagamento** (`PUT /pagamentos/<int:id>`): Atualiza um pagamento com base no ID.
4. **Rota para Excluir Pagamento** (`DELETE /pagamentos/<int:id>`): Exclui um pagamento com base no ID.
5. **Rota para Criar Fatura** (`POST /fatura`): Cria uma fatura associada a um pagamento.
6. **Rota para Listar Faturas** (`GET /faturas`): Retorna uma lista de faturas existentes.
7. **Rota para Atualizar Fatura** (`PUT /fatura/<int:id>`): Atualiza uma fatura com base no ID.
8. **Rota para Excluir Fatura** (`DELETE /fatura/<int:id>`): Exclui uma fatura com base no ID.

Essas rotas cuidam das operações CRUD para pagamentos e faturas, utilizando as tabelas com relacionamentos definidos no modelo.
'''

# Novo Blueprint para lidar com a criação de pagamentos e faturas
pagamentos_faturas = Blueprint('pagamentos_faturas', __name__)



from flask_jwt_extended import jwt_required, get_jwt_identity

from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

@pagamentos_faturas.route('/listar', methods=['GET'])
@jwt_required()
def listar_pagamentos():
    # Obtém o e-mail do usuário autenticado via JWT
    current_user_email = get_jwt_identity()
    colaborador = Colaboradores.query.filter_by(email=current_user_email).first()

    if colaborador and colaborador.is_admin:
        # Se for admin, pode ver todos os pagamentos
        pagamentos = Pagamentos.query.all()
    elif colaborador:
        # Se for colaborador, exibe apenas os pagamentos relacionados a ele
        pagamentos = Pagamentos.query.filter_by(id_colaborador=colaborador.id_colaborador).all()
    else:
        # Se for cliente, exibe apenas os pagamentos dele
        cliente = Clientes.query.filter_by(email=current_user_email).first()
        pagamentos = Pagamentos.query.filter_by(id_cliente=cliente.id_cliente).all()

    dados_pagamentos = []
    for pagamento in pagamentos:
        # Verifica se existe um agendamento e se ele possui clínica associada
        if pagamento.agendamento and pagamento.agendamento.clinica:
            endereco = None
            if pagamento.agendamento.clinica.endereco:
                # Concatena os dados de endereço se houver
                endereco = (
                    pagamento.agendamento.clinica.endereco.rua + ', ' +
                    pagamento.agendamento.clinica.endereco.bairro
                )
            clinica = {
                'nome': pagamento.agendamento.clinica.nome,
                'telefone': pagamento.agendamento.clinica.telefone,
                'endereco': endereco,
            }
        else:
            # Se não existir agendamento ou clínica, atribui None
            clinica = None

        pagamento_data = {
            'id_pagamento': pagamento.id_pagamento,
            'valor': str(pagamento.valor),
            'status': pagamento.status,
            'data_pagamento': pagamento.data_pagamento,
            'metodo_pagamento': pagamento.metodo_pagamento,
            'referencia_pagamento': pagamento.referencia_pagamento,
            'cliente': {
                'nome': pagamento.cliente.nome,
                'email': pagamento.cliente.email,
                'telefone': pagamento.cliente.telefone,
            },
            'colaborador': {
                'nome': pagamento.colaborador.nome if pagamento.colaborador else None,
                'email': pagamento.colaborador.email if pagamento.colaborador else None,
                'telefone': pagamento.colaborador.telefone if pagamento.colaborador else None,
            },
            'clinica': clinica,
            'servico': {
                'nome': pagamento.servico.nome,
                'descricao': pagamento.servico.descricao,
            },
            'plano': {
                'nome': pagamento.plano.nome if pagamento.plano else None,
                'descricao': pagamento.plano.descricao if pagamento.plano else None,
                'valor': str(pagamento.plano.valor) if pagamento.plano else None,
            },
        }
        dados_pagamentos.append(pagamento_data)

    return jsonify({'pagamentos': dados_pagamentos}), 200




from flask import current_app
from datetime import datetime
from pytz import timezone

@pagamentos_faturas.route('/editar/<int:id_pagamento>', methods=['PUT'])
@jwt_required()
def editar_pagamento(id_pagamento):
    # Obtém o email do usuário logado
    current_user_email = get_jwt_identity()
    current_app.logger.debug(f'Usuário logado: {current_user_email}')

    colaborador = Colaboradores.query.filter_by(email=current_user_email).first()
    cliente = Clientes.query.filter_by(email=current_user_email).first()

    # Buscar o pagamento pelo ID
    pagamento = Pagamentos.query.get(id_pagamento)

    if not pagamento:
        current_app.logger.debug(f'Pagamento com ID {id_pagamento} não encontrado.')
        return jsonify({'message': 'Pagamento não encontrado'}), 404

    # Verifica se o pagamento pertence ao cliente ou colaborador
    if cliente:
        current_app.logger.debug(f'Cliente {cliente.nome} tentando editar o pagamento.')
        if pagamento.id_cliente != cliente.id_cliente:
            current_app.logger.debug(f'Cliente {cliente.nome} não tem permissão para editar este pagamento.')
            return jsonify({'message': 'Você não tem permissão para editar esse pagamento'}), 403
    elif colaborador:
        current_app.logger.debug(f'Colaborador {colaborador.nome} tentando editar o pagamento.')
        if not colaborador.is_admin and pagamento.id_colaborador != colaborador.id_colaborador:
            current_app.logger.debug(f'Colaborador {colaborador.nome} não tem permissão para editar este pagamento.')
            return jsonify({'message': 'Você não tem permissão para editar esse pagamento'}), 403
    else:
        current_app.logger.debug('Usuário não autorizado para editar pagamento.')
        return jsonify({'message': 'Usuário não autorizado'}), 403

    # Processa a edição do pagamento
    if request.method == 'PUT':
        dados = request.get_json()
        current_app.logger.debug(f'Dados recebidos para atualização: {dados}')

        # Permite alteração de campos específicos
        if 'valor' in dados:
            current_app.logger.debug(f'Alterando valor para: {dados["valor"]}')
            pagamento.valor = dados['valor']
        if 'status' in dados:
            novo_status = dados['status']
            current_app.logger.debug(f'Alterando status para: {novo_status}')
            pagamento.status = novo_status

            # Se o status do pagamento for 'cancelado', altera o status do agendamento também
            if novo_status == 'Cancelado':
                current_app.logger.debug(f'Alterando status do agendamento para: cancelado')
                agendamento = pagamento.agendamento  # Obtém o agendamento relacionado ao pagamento
                if agendamento:
                    agendamento.status = 'cancelado'
                    current_app.logger.debug(f'Status do agendamento alterado para: cancelado')
            
        if 'metodo_pagamento' in dados:
            current_app.logger.debug(f'Alterando método de pagamento para: {dados["metodo_pagamento"]}')
            pagamento.metodo_pagamento = dados['metodo_pagamento']
        if 'referencia_pagamento' in dados:
            current_app.logger.debug(f'Alterando referência de pagamento para: {dados["referencia_pagamento"]}')
            pagamento.referencia_pagamento = dados['referencia_pagamento']
        if 'data_pagamento' in dados:
            # Converte a data de pagamento para o tipo datetime com o formato adequado
            try:
                pagamento.data_pagamento = datetime.strptime(dados['data_pagamento'], '%Y-%m-%dT%H:%M:%S.%fZ')
                current_app.logger.debug(f'Alterando data de pagamento para: {dados["data_pagamento"]}')
            except ValueError as e:
                current_app.logger.error(f'Erro ao converter a data de pagamento: {str(e)}')
                return jsonify({'message': 'Formato de data inválido'}), 400

        # Commit para salvar as mudanças no banco
        try:
            current_app.logger.debug('Tentando salvar as alterações no banco.')
            db.session.commit()
            current_app.logger.debug('Pagamento atualizado com sucesso.')
            return jsonify({'message': 'Pagamento atualizado com sucesso'}), 200
        except Exception as e:
            current_app.logger.error(f'Erro ao atualizar pagamento: {str(e)}')
            db.session.rollback()
            return jsonify({'message': 'Erro ao atualizar pagamento', 'error': str(e)}), 500

    return jsonify({'message': 'Método não permitido'}), 405





# Excluir Pagamento
@pagamentos_faturas.route('/pagamentos/<int:id>', methods=['DELETE'])
def excluir_pagamento(id):
    try:
        pagamento = Pagamentos.query.get(id)

        if pagamento:
            db.session.delete(pagamento)
            db.session.commit()

            return jsonify({'message': 'Pagamento excluído com sucesso!'}), 200
        else:
            return jsonify({'message': 'Pagamento não encontrado!'}), 404
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Criar Fatura
@pagamentos_faturas.route('/fatura', methods=['POST'])
def criar_fatura():
    try:
        data = request.get_json()

        # Criação da fatura
        fatura = Faturas(
            id_cliente=data['id_cliente'],
            id_pagamento=data['id_pagamento'],
            vencimento=datetime.strptime(data['vencimento'], '%Y-%m-%d'),
            valor_total=data['valor_total'],
            status=data.get('status', 'pendente')
        )

        db.session.add(fatura)
        db.session.commit()

        return jsonify({'message': 'Fatura criada com sucesso!'}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Listar Faturas
@pagamentos_faturas.route('/faturas', methods=['GET'])
def listar_faturas():
    try:
        faturas = Faturas.query.all()
        faturas_list = []
        for fatura in faturas:
            faturas_list.append({
                'id_fatura': fatura.id_fatura,
                'id_cliente': fatura.id_cliente,
                'id_pagamento': fatura.id_pagamento,
                'data_emissao': fatura.data_emissao,
                'vencimento': fatura.vencimento,
                'valor_total': str(fatura.valor_total),
                'status': fatura.status
            })
        return jsonify(faturas_list)
    except SQLAlchemyError as e:
        return jsonify({'error': str(e)}), 500


# Atualizar Fatura
@pagamentos_faturas.route('/fatura/<int:id>', methods=['PUT'])
def atualizar_fatura(id):
    try:
        data = request.get_json()
        fatura = Faturas.query.get(id)

        if fatura:
            fatura.status = data['status']
            fatura.vencimento = datetime.strptime(data['vencimento'], '%Y-%m-%d')
            fatura.valor_total = data['valor_total']

            db.session.commit()

            return jsonify({'message': 'Fatura atualizada com sucesso!'}), 200
        else:
            return jsonify({'message': 'Fatura não encontrada!'}), 404
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Excluir Fatura
@pagamentos_faturas.route('/fatura/<int:id>', methods=['DELETE'])
def excluir_fatura(id):
    try:
        fatura = Faturas.query.get(id)

        if fatura:
            db.session.delete(fatura)
            db.session.commit()

            return jsonify({'message': 'Fatura excluída com sucesso!'}), 200
        else:
            return jsonify({'message': 'Fatura não encontrada!'}), 404
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

import calendar
from datetime import datetime

@pagamentos_faturas.route('/gerar_pagamentos_automaticos', methods=['POST'])
@jwt_required()
def gerar_pagamentos_automaticos():
    try:
        # Usamos a data atual (UTC) para definir o período de verificação
        today = datetime.utcnow()
        pagamentos_criados = 0

        # Busca todos os clientes que possuem um plano associado
        clientes = Clientes.query.filter(Clientes.plano_id.isnot(None)).all()

        for cliente in clientes:
            # Recupera o plano associado ao cliente
            plano = cliente.plano
            if not plano:
                continue  # Evita inconsistências

            # Converte o nome do plano para minúsculas para busca case-insensitive
            plano_nome = plano.nome.lower()

            # Determina a frequência e define o período (início e fim) para verificação
            frequencia = None
            period_start = None
            period_end = None

            if 'mensal' in plano_nome:
                frequencia = 'mensal'
                period_start = datetime(today.year, today.month, 1, 0, 0, 0)
                last_day = calendar.monthrange(today.year, today.month)[1]
                period_end = datetime(today.year, today.month, last_day, 23, 59, 59, 999999)
            elif 'trimestral' in plano_nome:
                frequencia = 'trimestral'
                # Calcula o trimestre atual: Q1 (Jan-Mar), Q2 (Abr-Jun), Q3 (Jul-Set) ou Q4 (Out-Dez)
                quarter = (today.month - 1) // 3
                quarter_start_month = quarter * 3 + 1
                quarter_end_month = quarter * 3 + 3
                period_start = datetime(today.year, quarter_start_month, 1, 0, 0, 0)
                last_day = calendar.monthrange(today.year, quarter_end_month)[1]
                period_end = datetime(today.year, quarter_end_month, last_day, 23, 59, 59, 999999)
            elif 'semestral' in plano_nome:
                frequencia = 'semestral'
                if today.month <= 6:
                    period_start = datetime(today.year, 1, 1, 0, 0, 0)
                    period_end = datetime(today.year, 6, 30, 23, 59, 59, 999999)
                else:
                    period_start = datetime(today.year, 7, 1, 0, 0, 0)
                    period_end = datetime(today.year, 12, 31, 23, 59, 59, 999999)
            elif 'anual' in plano_nome:
                frequencia = 'anual'
                period_start = datetime(today.year, 1, 1, 0, 0, 0)
                period_end = datetime(today.year, 12, 31, 23, 59, 59, 999999)

            # Se o nome do plano não contiver nenhuma palavra-chave definida, ignora este cliente
            if not frequencia:
                continue

            # Verifica se já existe um pagamento para este cliente e plano dentro do período definido
            existing_payment = Pagamentos.query.filter(
                Pagamentos.id_cliente == cliente.id_cliente,
                Pagamentos.id_plano == plano.id_plano,
                Pagamentos.data_pagamento >= period_start,
                Pagamentos.data_pagamento <= period_end
            ).first()

            if existing_payment:
                # Se já existir um pagamento no período, não cria um novo
                continue

            # Cria um novo pagamento com base no plano do cliente
            novo_pagamento = Pagamentos(
                id_cliente=cliente.id_cliente,
                id_servico=plano.servico_id,   # O plano está vinculado a um serviço
                id_plano=plano.id_plano,
                valor=plano.valor,
                metodo_pagamento='a definir',  # Pode ser ajustado conforme sua lógica
                status='pendente',
                data_pagamento=datetime.utcnow()  # Data de criação do pagamento
            )
            db.session.add(novo_pagamento)
            pagamentos_criados += 1

        db.session.commit()
        return jsonify({'message': f'{pagamentos_criados} pagamentos gerados com sucesso!'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao gerar pagamentos: {str(e)}'}), 500