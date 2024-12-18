from flask import Blueprint, jsonify, request
from app.models import Colaboradores, Agendamentos, Clientes, Servicos, Horarios, db
from datetime import datetime, timedelta

horarios= Blueprint('horarios', __name__)

@horarios.route('/horarios-colaborador/<int:colaborador_id>', methods=['GET'])
def get_horarios_colaborador(colaborador_id):
    try:
        horarios = Horarios.query.filter_by(ID_Colaborador=colaborador_id).all()
        if not horarios:
            return jsonify({"error": "Nenhum horário encontrado para este colaborador"}), 404

        horarios_dict = [
            {
                "dia_semana": horario.dia_semana,
                "hora_inicio": horario.hora_inicio.strftime('%H:%M'),
                "hora_fim": horario.hora_fim.strftime('%H:%M'),
            }
            for horario in horarios
        ]

        return jsonify(horarios_dict), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@horarios.route('/horarios-disponiveis', methods=['GET'])
def get_horarios_disponiveis():
    data = request.args.get('data')
    servico_id = request.args.get('servico_id')

    try:
        data_formatada = datetime.strptime(data, '%Y-%m-%d')
    except ValueError:
        return jsonify({"error": "Formato de data inválido"}), 400

    # Filtrar colaboradores que atendem ao serviço solicitado
    colaboradores = Colaboradores.query.filter(
        Colaboradores.servicos.any(ID_Servico=servico_id)).all()

    if not colaboradores:
        return jsonify({"error": "Nenhum colaborador encontrado para o serviço solicitado"}), 404

    horarios_status = []  # Lista para armazenar os horários com status

    # Obter horários disponíveis dos colaboradores
    for colaborador in colaboradores:
        for horario in colaborador.horarios:
            # Combinar data e hora para verificar disponibilidade
            data_e_hora = datetime.combine(data_formatada, datetime.strptime(horario.inicio, "%H:%M").time())
            
            # Verificar se o horário já foi agendado
            ocupado = not horario_disponivel(data_e_hora, colaborador.ID_Colaborador)
            
            horarios_status.append({
                "colaborador": colaborador.nome,
                "horario": f"{horario.dia} {horario.inicio}-{horario.fim}",
                "ocupado": ocupado
            })

    # Remover duplicados e ordenar por horário
    horarios_status = sorted(horarios_status, key=lambda x: x["horario"])

    return jsonify(horarios_status)


def horario_disponivel(data_e_hora, colaborador_id):
    """Verifica se o horário está disponível para o colaborador"""
    agendamento_existente = Agendamentos.query.filter_by(
        ID_Colaborador=colaborador_id,
        data_e_hora=data_e_hora
    ).first()
    
    return agendamento_existente is None

