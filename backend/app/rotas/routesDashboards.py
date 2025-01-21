from flask import Blueprint, current_app, send_from_directory, request, jsonify
from datetime import datetime, timedelta
from app.models import Agendamentos, Clientes, Colaboradores, Servicos, Clinicas, db
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from sqlalchemy import func  # Add this import
import os


dashboards = Blueprint('dashboards', __name__)

"""
Rotas relacionadas a dashboards no sistema:

# Rotas GET:
1. '/overview' - Retorna uma visão geral do sistema, incluindo o total de agendamentos, clientes, colaboradores, serviços, clínicas, além de estatísticas como a receita total, receitas por ano e mês, e a média mensal do ano atual.
2. '/servicos/populares' - Retorna uma lista dos serviços mais populares, ordenados pela quantidade de agendamentos realizados para cada serviço.
3. '/agendamentos_por_clinica' - Retorna a quantidade de agendamentos realizados por clínica, agrupados por nome de clínica.
4. '/agendamentos_por_colaborador' - Retorna a quantidade de agendamentos realizados por colaborador, agrupados por nome de colaborador.
5. '/receita_por_mes' - Retorna a receita mensal de agendamentos confirmados, com a soma dos valores dos serviços por mês e ano.

Essas rotas utilizam autenticação JWT para garantir a segurança, realizam consultas ao banco de dados utilizando SQLAlchemy e funções agregadas para gerar relatórios e estatísticas sobre agendamentos, serviços e receitas. As respostas são formatadas em JSON para fácil integração com o frontend.
"""


@dashboards.route('/overview', methods=['GET'])
@jwt_required()
def dashboard_overview():
    total_agendamentos = Agendamentos.query.count()
    total_clientes = Clientes.query.count()
    total_colaboradores = Colaboradores.query.count()
    total_servicos = Servicos.query.count()    
    total_clinicas = Clinicas.query.count()


    # Contar agendamentos por status
    total_cancelados = Agendamentos.query.filter_by(status='cancelado').count()
    total_pendentes = Agendamentos.query.filter_by(status='pendente').count()
    total_outros = Agendamentos.query.filter(Agendamentos.status.notin_(['confirmado', 'cancelado', 'pendente'])).count()

    # Calcular a receita total dos agendamentos confirmados
    total_receita = db.session.query(func.sum(Servicos.valor))\
        .join(Agendamentos, Agendamentos.id_servico == Servicos.id_servico)\
        .filter(Agendamentos.status == 'confirmado').scalar() or 0

    # Calcular a receita do último ano para agendamentos confirmados
    ano_atual = datetime.now().year
    receita_ultimo_ano = db.session.query(func.sum(Servicos.valor))\
        .join(Agendamentos, Agendamentos.id_servico == Servicos.id_servico)\
        .filter(func.strftime('%Y', Agendamentos.data_e_hora) == str(ano_atual - 1))\
        .filter(Agendamentos.status == 'confirmado').scalar() or 0

    # Calcular a receita do último mês para agendamentos confirmados
    ultimo_mes = datetime.now().month - 1 if datetime.now().month > 1 else 12
    receita_ultimo_mes = db.session.query(func.sum(Servicos.valor))\
        .join(Agendamentos, Agendamentos.id_servico == Servicos.id_servico)\
        .filter(func.strftime('%m', Agendamentos.data_e_hora) == f"{ultimo_mes:02d}")\
        .filter(Agendamentos.status == 'confirmado').scalar() or 0

    # Calcular a receita de todos os anos para agendamentos confirmados
    receita_todos_anos = db.session.query(func.strftime('%Y', Agendamentos.data_e_hora), func.sum(Servicos.valor))\
        .join(Agendamentos, Agendamentos.id_servico == Servicos.id_servico)\
        .filter(Agendamentos.status == 'confirmado')\
        .group_by(func.strftime('%Y', Agendamentos.data_e_hora)).all()

    # Converte a lista de tuplas para um formato JSON serializável
    receita_todos_anos = [
        {"ano": row[0], "receita": row[1]} for row in receita_todos_anos
    ]

    # Calcular a receita anual do ano atual para agendamentos confirmados
    receita_ano_atual = db.session.query(func.sum(Servicos.valor))\
        .join(Agendamentos, Agendamentos.id_servico == Servicos.id_servico)\
        .filter(func.strftime('%Y', Agendamentos.data_e_hora) == str(ano_atual))\
        .filter(Agendamentos.status == 'confirmado').scalar() or 0

    # Calcular a média mensal do ano atual para agendamentos confirmados
    receita_mensal_ano_atual = db.session.query(func.strftime('%m', Agendamentos.data_e_hora), func.sum(Servicos.valor))\
        .join(Agendamentos, Agendamentos.id_servico == Servicos.id_servico)\
        .filter(func.strftime('%Y', Agendamentos.data_e_hora) == str(ano_atual))\
        .filter(Agendamentos.status == 'confirmado')\
        .group_by(func.strftime('%m', Agendamentos.data_e_hora)).all()
    # Calcular a receita do mês atual para agendamentos confirmados
    mes_atual = datetime.now().month
    receita_mes_atual = db.session.query(func.sum(Servicos.valor))\
        .join(Agendamentos, Agendamentos.id_servico == Servicos.id_servico)\
        .filter(func.strftime('%m', Agendamentos.data_e_hora) == f"{mes_atual:02d}")\
        .filter(Agendamentos.status == 'confirmado').scalar() or 0


    # Calcular a média mensal
    total_mes = len(receita_mensal_ano_atual)
    soma_receita_mensal = sum([row[1] for row in receita_mensal_ano_atual])
    media_mensal_ano_atual = soma_receita_mensal / total_mes if total_mes > 0 else 0

    return jsonify({
        "total_agendamentos": total_agendamentos,
        "total_clientes": total_clientes,
        "total_colaboradores": total_colaboradores,
        "total_servicos": total_servicos,
        "total_clinicas": total_clinicas,  # Incluindo o total de clínicas
        "total_receita": str(total_receita),
        "receita_ultimo_ano": str(receita_ultimo_ano),
        "receita_ultimo_mes": str(receita_ultimo_mes),
        "receita_mes_atual": str(receita_mes_atual),  # Adicionando receita do mês atual
        "receita_todos_anos": receita_todos_anos,
        "receita_ano_atual": str(receita_ano_atual),
        "media_mensal_ano_atual": str(media_mensal_ano_atual),
        "total_cancelados": total_cancelados,
        "total_pendentes": total_pendentes,
        "total_outros": total_outros
    })





@dashboards.route('/servicos/populares', methods=['GET'])
@jwt_required()
def servicos_populares():
    servicos_populares = db.session.query(
        Servicos.nome,  # Assuming 'nome' is the correct column name
        db.func.count(Agendamentos.id_agendamento).label('quantidade')
    ).join(Agendamentos, Agendamentos.id_servico == Servicos.id_servico).group_by(Servicos.id_servico).order_by(db.func.count(Agendamentos.id_agendamento).desc()).all()

    result = {servico.nome: servico.quantidade for servico in servicos_populares}  # Corrected field name
    
    return jsonify(result)


@dashboards.route('/agendamentos_por_clinica', methods=['GET'])
@jwt_required()
def agendamentos_por_clinica():
    agendamentos_clinica = db.session.query(
        Clinicas.nome,
        func.count(Agendamentos.id_agendamento).label('quantidade')
    ).join(Agendamentos, Agendamentos.id_clinica == Clinicas.id_clinica).group_by(Clinicas.id_clinica).all()

    result = {clinica.nome: int(clinica.quantidade) for clinica in agendamentos_clinica}  # Garante que a quantidade seja um inteiro

    return jsonify(result)

@dashboards.route('/agendamentos_por_colaborador', methods=['GET'])
@jwt_required()
def agendamentos_por_colaborador():
    agendamentos_colaborador = db.session.query(
        Colaboradores.nome,
        func.count(Agendamentos.id_agendamento).label('quantidade')
    ).join(Agendamentos, Agendamentos.id_colaborador == Colaboradores.id_colaborador).group_by(Colaboradores.id_colaborador).all()

    result = {colaborador.nome: int(colaborador.quantidade) for colaborador in agendamentos_colaborador}  # Garante que a quantidade seja um inteiro

    return jsonify(result)

@dashboards.route('/receita_por_mes', methods=['GET'])
@jwt_required()
def receita_por_mes():
    try:
        # Adicionando log para verificar entrada na rota
        print("Iniciando consulta para receita por mês.")

        # Query para somar os valores dos serviços por mês e ano
        receita_mensal = db.session.query(
            func.strftime('%m/%Y', Agendamentos.data_e_hora).label('mes'),  # Formatar data no estilo 'MM/YYYY'
            func.sum(Servicos.valor).label('receita')  # Somar os valores dos serviços
        ).join(Servicos, Agendamentos.id_servico == Servicos.id_servico) \
         .group_by(func.strftime('%m/%Y', Agendamentos.data_e_hora)) \
         .order_by(func.strftime('%m/%Y', Agendamentos.data_e_hora)) \
         .all()

        # Adicionando log para verificar o resultado da query
        print("Resultado da query receita_mensal:", receita_mensal)

        # Filtrar e formatar os dados para evitar valores None
        result = {
            mes if mes is not None else "Data Indisponível": float(receita) if receita is not None else 0.0
            for mes, receita in receita_mensal
        }

        # Log dos dados formatados
        print("Dados formatados:", result)
        return jsonify(result)

    except Exception as e:
        # Adicionando log para identificar o erro
        print("Erro na rota receita_por_mes:", str(e))
        return jsonify({"error": str(e)}), 500


