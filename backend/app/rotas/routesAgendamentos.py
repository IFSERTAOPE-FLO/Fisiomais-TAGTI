from flask import Blueprint, jsonify, request
from app.models import Colaboradores, Agendamentos, Clientes, Servicos, Horarios, db
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message
from flask import current_app
from app import mail
from datetime import datetime
from pytz import timezone


agendamentos= Blueprint('agendamentos', __name__)
BRASILIA = timezone('America/Sao_Paulo')

import traceback

@agendamentos.route('/', methods=[ 'POST'])
@jwt_required()
def agendamento():    
    try:
        data = request.get_json()
        print(f"Received data: {data}")  # Print the received data

        # Validate if the user is a client or collaborator
        usuario_email = get_jwt_identity()
        print(f"User email: {usuario_email}")  # Print the email of the user
        
        cliente = Clientes.query.filter_by(email=usuario_email).first()
        colaborador = Colaboradores.query.filter_by(email=usuario_email).first()

        if not cliente and not colaborador:
            print("User not found")  # Debug message when user is not found
            return jsonify({'message': 'Usuário não encontrado'}), 404

        # Check if the collaborator exists and if the client is provided for the collaborator
        if colaborador and 'cliente_id' in data and data['cliente_id']:
            cliente = Clientes.query.get(data['cliente_id'])
            if not cliente:
                print("Cliente not found")  # Debug message for client not found
                return jsonify({'message': 'Cliente não encontrado'}), 404
        elif not colaborador and not cliente:
            print("Client not found")  # Debug message for when no client is found
            return jsonify({'message': 'Cliente não encontrado'}), 404

        # Validate collaborator, service, and plan
        colaborador = Colaboradores.query.get(data['colaborador_id'])
        if not colaborador:
            print("Colaborador not found")  # Debug message for collaborator not found
            return jsonify({'message': 'Colaborador não encontrado'}), 404
        
        servico = Servicos.query.get(data['servico_id'])
        if not servico:
            print("Servico not found")  # Debug message for service not found
            return jsonify({'message': 'Serviço não encontrado'}), 404

        plano_id = data.get('plano_id')
        if servico.tipo_servico != 'fisioterapia' and plano_id is None:
            print("Plano not provided")  # Debug message for when plan is missing
            return jsonify({'message': 'Plano não fornecido'}), 400

        if servico.tipo_servico != 'fisioterapia' and not servico.planos:
            print("Servico doesn't have planos")  # Debug message when service has no plans
            return jsonify({'message': 'O serviço selecionado não possui planos'}), 400

        plano_selecionado = next((p for p in servico.planos if p['ID_Plano'] == plano_id), None)
        if not plano_selecionado:
            print("Plano not found")  # Debug message when plan is not found
            return jsonify({'message': 'Plano não encontrado'}), 404

        # Check if the time is available for the collaborator
        data_e_hora = datetime.fromisoformat(data['data']).astimezone(BRASILIA)
        horario = Horarios.query.filter_by(
            ID_Colaborador=colaborador.ID_Colaborador,
            dia_semana=data_e_hora.strftime('%A').lower()
        ).first()

        if not horario or not (horario.hora_inicio <= data_e_hora.time() <= horario.hora_fim):
            print("Horario indisponível")  # Debug message for unavailable time slot
            return jsonify({'message': 'Horário indisponível para este colaborador'}), 400

        if not horario_disponivel(data_e_hora, colaborador.ID_Colaborador):
            print("Horario já reservado")  # Debug message for already booked time
            return jsonify({'message': 'Horário já reservado'}), 400

        # Create the appointment
        novo_agendamento = Agendamentos(
            data_e_hora=data_e_hora,
            ID_Cliente=cliente.ID_Cliente,
            ID_Colaborador=colaborador.ID_Colaborador,
            ID_Servico=servico.ID_Servico,
            ID_Plano=plano_id,
            status="pendente"  # Status inicial
        )
        print(f"Created appointment: {novo_agendamento}")  # Print the new appointment details
        
        db.session.add(novo_agendamento)
        db.session.commit()

        return jsonify({'message': 'Agendamento criado com status pendente'}), 201
    
    except Exception as e:
        error_details = traceback.format_exc()  # Capture the full traceback
        print(f"Error: {e}")  # Print the error message for debugging
        print(f"Error details: {error_details}")  # Print the full traceback for more insights
        db.session.rollback()
        return jsonify({'message': f'Erro ao criar agendamento: {str(e)}', 'error_details': error_details}), 500
    





    
def horario_disponivel(data_e_hora, colaborador_id):
    """Verifica se o horário está disponível para o colaborador"""
    agendamento_existente = Agendamentos.query.filter_by(
        ID_Colaborador=colaborador_id,
        data_e_hora=data_e_hora
    ).first()
    
    return agendamento_existente is None


@agendamentos.route('confirmar_agendamento/<int:agendamento_id>', methods=['PUT'])
@jwt_required()
def confirmar_agendamento(agendamento_id):
    try:
        agendamento = Agendamentos.query.get(agendamento_id)

        if not agendamento:
            return jsonify({'message': 'Agendamento não encontrado'}), 404

        agendamento.status = "confirmado"
        db.session.commit()

        return jsonify({'message': 'Agendamento confirmado com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao confirmar agendamento: {str(e)}'}), 500


    
@agendamentos.route('enviar_email_agendamento/<int:agendamento_id>', methods=['POST'])
@jwt_required()
def enviar_email_agendamento(agendamento_id):
    try:
        # Obter o agendamento pelo ID
        agendamento = Agendamentos.query.get(agendamento_id)
        if not agendamento:
            return jsonify({'message': 'Agendamento não encontrado'}), 404

        # Obter informações do cliente, colaborador e serviço
        cliente = Clientes.query.get(agendamento.ID_Cliente)
        colaborador = Colaboradores.query.get(agendamento.ID_Colaborador)
        servico = Servicos.query.get(agendamento.ID_Servico)

        if not cliente or not colaborador or not servico:
            return jsonify({'message': 'Dados do agendamento incompletos'}), 404

        # Dados do e-mail para o cliente
        subject_cliente = "Lembrete: Seu atendimento foi agendado!"
        body_cliente = (
            f"Olá {cliente.nome},\n\n"
            f"Seu atendimento para o serviço '{servico.Nome_servico}' foi agendado para "
            f"{agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
            f"Atenciosamente,\nEquipe FisioMais"
        )
        msg_cliente = Message(
            subject=subject_cliente,
            recipients=[cliente.email],
            body=body_cliente
        )

        # Dados do e-mail para o colaborador
        subject_colaborador = "Novo agendamento"
        body_colaborador = (
            f"Olá {colaborador.nome},\n\n"
            f"Você tem um atendimento agendado com o cliente {cliente.nome} "
            f"para o serviço '{servico.Nome_servico}' em {agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
            f"Atenciosamente,\nEquipe FisioMais"
        )
        msg_colaborador = Message(
            subject=subject_colaborador,
            recipients=[colaborador.email],
            body=body_colaborador
        )

        # Dados do e-mail para o administrador
        subject_admin = "Novo agendamento registrado"
        body_admin = (
            f"Um novo agendamento foi registrado:\n\n"
            f"Cliente: {cliente.nome}\n"
            f"Colaborador: {colaborador.nome}\n"
            f"Serviço: {servico.Nome_servico}\n"
            f"Data e Hora: {agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
            f"Atenciosamente,\nEquipe FisioMais"
        )
        msg_admin = Message(
            subject=subject_admin,
            recipients=[current_app.config['MAIL_DEFAULT_SENDER']],
            body=body_admin
        )

        # Enviar os e-mails
        mail.send(msg_cliente)
        mail.send(msg_colaborador)
        mail.send(msg_admin)

        return jsonify({'message': 'E-mails enviados com sucesso'}), 200

    except Exception as e:
        return jsonify({'message': f'Erro ao enviar e-mails: {str(e)}'}), 500
