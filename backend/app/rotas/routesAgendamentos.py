from flask import Blueprint, jsonify, request
from app.models import Colaboradores, Agendamentos, Clientes, Servicos, db
from flask_jwt_extended import jwt_required, get_jwt_identity


agendamentos= Blueprint('agendamentos', __name__)


@agendamentos.route('agendamentos', methods=['POST'])
@jwt_required()
def agendamento():
    data = request.get_json()

    # Obter o email do usuário logado
    usuario_email = get_jwt_identity()

    # Consultar o cliente ou colaborador logado pelo email
    cliente = Clientes.query.filter_by(email=usuario_email).first()
    colaborador = Colaboradores.query.filter_by(email=usuario_email).first()

    if not cliente and not colaborador:
        return jsonify({'message': 'Usuário não encontrado'}), 404

    # Verificar se o colaborador está agendando para um cliente específico
    if colaborador and 'cliente_id' in data and data['cliente_id']:
        cliente = Clientes.query.get(data['cliente_id'])
        if not cliente:
            return jsonify({'message': 'Cliente não encontrado'}), 404
    elif not colaborador:
        # Usuário logado deve ser cliente
        if not cliente:
            return jsonify({'message': 'Cliente não encontrado'}), 404

    # Obter o colaborador selecionado
    colaborador = Colaboradores.query.get(data['colaborador_id'])
    if not colaborador:
        return jsonify({'message': 'Colaborador não encontrado'}), 404

    # Obter o serviço selecionado
    servico = Servicos.query.get(data['servico_id'])
    if not servico:
        return jsonify({'message': 'Serviço não encontrado'}), 404

    # Validar o plano apenas para serviços que não sejam fisioterapia
    plano_id = data.get('plano_id')
    if servico.tipo_servico != 'fisioterapia':  # Verifica o tipo do serviço
        if plano_id is None:
            return jsonify({'message': 'Plano não fornecido'}), 400
        if not servico.planos:
            return jsonify({'message': 'O serviço selecionado não possui planos'}), 400

        plano_selecionado = next((p for p in servico.planos if p['ID_Plano'] == plano_id), None)
        if not plano_selecionado:
            return jsonify({'message': 'Plano não encontrado'}), 404
    else:
        plano_id = None  # Remove o plano para serviços de fisioterapia

    try:
        # Verificar disponibilidade do horário
        data_e_hora = datetime.fromisoformat(data['data']).astimezone(BRASILIA)

        if not horario_disponivel(data_e_hora, colaborador.ID_Colaborador):
            return jsonify({'message': 'Horário não disponível'}), 400

        # Criar agendamento
        novo_agendamento = Agendamentos(
            data_e_hora=data_e_hora,
            ID_Cliente=cliente.ID_Cliente,
            ID_Colaborador=colaborador.ID_Colaborador,
            ID_Servico=servico.ID_Servico,
            ID_Plano=plano_id  
        )

        db.session.add(novo_agendamento)
        db.session.commit()

        # Enviar notificações de e-mail
        subject_cliente = "Lembrete: Seu atendimento foi agendado!"
        body_cliente = f"Olá {cliente.nome},\n\nSeu atendimento foi agendado para {data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\nAtenciosamente,\nEquipe FisioMais"
        msg_cliente = Message(subject=subject_cliente, recipients=[cliente.email], body=body_cliente)

        subject_colaborador = "Novo agendamento"
        body_colaborador = f"Olá {colaborador.nome},\n\nVocê tem um atendimento agendado para o cliente {cliente.nome} em {data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\nAtenciosamente,\nEquipe FisioMais"
        msg_colaborador = Message(subject=subject_colaborador, recipients=[colaborador.email], body=body_colaborador)

        subject_sender = "Novo agendamento realizado"
        body_sender = f"Um novo agendamento foi realizado para o cliente {cliente.nome} com o colaborador {colaborador.nome} em {data_e_hora.strftime('%d/%m/%Y %H:%M')}."
        msg_sender = Message(subject=subject_sender, recipients=[current_app.config['MAIL_DEFAULT_SENDER']], body=body_sender)

        try:
            mail.send(msg_cliente)
            mail.send(msg_colaborador)
            mail.send(msg_sender)
        except Exception as e:
            print(f"Erro ao enviar e-mail: {str(e)}")

        return jsonify({'message': 'Agendamento realizado com sucesso e notificações enviadas'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao criar agendamento: {str(e)}'}), 500


def horario_disponivel(data_e_hora, colaborador_id):
    agendamento_existente = Agendamentos.query.filter_by(
        ID_Colaborador=colaborador_id,
        data_e_hora=data_e_hora
    ).first()
    return agendamento_existente is None


@agendamentos.route('/listar_agendamentos', methods=['GET'])
@jwt_required()
def listar_agendamentos():
    try:
        usuario_email = get_jwt_identity()

        # Identifica se o usuário é colaborador ou cliente
        usuario = Colaboradores.query.filter_by(email=usuario_email).first()
        if not usuario:
            usuario = Clientes.query.filter_by(email=usuario_email).first()
            if not usuario:
                return jsonify({'message': 'Usuário não encontrado'}), 404

        # Busca os agendamentos conforme o tipo de usuário
        if isinstance(usuario, Colaboradores):
            agendamentos = Agendamentos.query.all()
        elif isinstance(usuario, Clientes):
            agendamentos = Agendamentos.query.filter_by(ID_Cliente=usuario.ID_Cliente).all()

        if not agendamentos:
            return jsonify({'message': 'Nenhum agendamento encontrado'}), 404

        agendamentos_data = []
        for agendamento in agendamentos:
            cliente = Clientes.query.get(agendamento.ID_Cliente)
            servico = Servicos.query.get(agendamento.ID_Servico)
            colaborador = Colaboradores.query.get(agendamento.ID_Colaborador)  # Adicionado para buscar o colaborador

            plano_pagamento = []
            if servico and servico.tipo_servico == 'pilates' and hasattr(agendamento, 'ID_Plano'):  # Verifica se o plano está associado ao agendamento
                plano_selecionado = next((plano for plano in servico.planos if plano['ID_Plano'] == agendamento.ID_Plano), None)
                if plano_selecionado:
                    plano_pagamento.append(plano_selecionado)

            agendamentos_data.append({
                'id': agendamento.ID_Agendamento,
                'nome_cliente': cliente.nome if cliente else 'Cliente não encontrado',
                'data': agendamento.data_e_hora.strftime('%Y-%m-%d'),
                'hora': agendamento.data_e_hora.strftime('%H:%M'),
                'nome_servico': servico.Nome_servico if servico else 'Serviço não encontrado',
                'valor_servico': float(servico.Valor) if servico and servico.Valor else None,
                'nome_colaborador': colaborador.nome if colaborador else 'Colaborador não encontrado',  # Adicionado
                'plano_pagamento': plano_pagamento
            })

        return jsonify(agendamentos_data), 200

    except Exception as e:
        print(f"Erro ao carregar agendamentos: {str(e)}")
        return jsonify({'message': f'Erro ao carregar agendamentos: {str(e)}'}), 500
    


@agendamentos.route('deletar_agendamento/<int:id>', methods=['DELETE'])
@jwt_required()
def deletar_agendamento(id):
    try:
        agendamento = Agendamentos.query.get(id)

        if not agendamento:
            return jsonify({'message': 'Agendamento não encontrado'}), 404

        db.session.delete(agendamento)
        db.session.commit()

        return jsonify({'message': 'Agendamento deletado com sucesso'}), 200
    except Exception as e:
        print(f"Erro ao deletar agendamento: {str(e)}")
        return jsonify({'message': f'Erro ao deletar agendamento: {str(e)}'}), 500