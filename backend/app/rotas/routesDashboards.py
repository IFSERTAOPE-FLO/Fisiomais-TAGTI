from flask import Blueprint, current_app, send_from_directory, request, jsonify
from datetime import datetime, timedelta
from app.models import Agendamentos, Clientes, Colaboradores, Servicos, Clinicas, db
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from sqlalchemy import func  # Add this import
import os

dashboards = Blueprint('dashboards', __name__)

@dashboards.route('/overview', methods=['GET'])
@jwt_required()
def dashboard_overview():
    total_agendamentos = Agendamentos.query.count()
    total_clientes = Clientes.query.count()
    total_colaboradores = Colaboradores.query.count()
    total_servicos = Servicos.query.count()
    
    # Calcular a receita total dos agendamentos
    total_receita = db.session.query(func.sum(Servicos.valor)).join(Agendamentos, Agendamentos.id_servico == Servicos.id_servico).scalar() or 0

    return jsonify({
        "total_agendamentos": total_agendamentos,
        "total_clientes": total_clientes,
        "total_colaboradores": total_colaboradores,
        "total_servicos": total_servicos,
        "total_receita": str(total_receita)  # Convertendo para string, caso o valor seja Decimal
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
