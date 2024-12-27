from flask import Blueprint, current_app, send_from_directory, request, jsonify
from app.models import Colaboradores, Agendamentos, Clientes, Servicos, Horarios, Clinicas, db
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message
from flask import current_app
from app import mail
from datetime import datetime, timedelta
from pytz import timezone


agendamentos= Blueprint('agendamentos', __name__)
BRASILIA = timezone('America/Sao_Paulo')

import traceback

@agendamentos.route('/', methods=['OPTIONS'])
@jwt_required()
def handle_options():
    return '', 200  # Responde com status 200 OK

@agendamentos.route('/', methods=['POST'])
@jwt_required()
def agendamento():
    try:
        data = request.get_json()
        print(f"Received data: {data}")  # Exibe os dados recebidos para debugging

        # Verificar se o usuário é um cliente ou colaborador
        usuario_email = get_jwt_identity()
        print(f"User email: {usuario_email}")  # Exibe o email do usuário para debugging
        
        cliente = Clientes.query.filter_by(email=usuario_email).first()
        colaborador = Colaboradores.query.filter_by(email=usuario_email).first()

        if not cliente and not colaborador:
            print("User not found")  # Mensagem de erro se o usuário não for encontrado
            return jsonify({'message': 'Usuário não encontrado'}), 404

        # Se for colaborador e cliente_id for fornecido, verificamos se o cliente existe
        if colaborador and 'cliente_id' in data and data['cliente_id']:
            cliente = Clientes.query.get(data['cliente_id'])
            if not cliente:
                print("Cliente not found")  # Mensagem de erro se o cliente não for encontrado
                return jsonify({'message': 'Cliente não encontrado'}), 404
        elif not colaborador and not cliente:
            print("Cliente não encontrado")  # Mensagem de erro se não for cliente
            return jsonify({'message': 'Cliente não encontrado'}), 404

        # Verificar a existência do colaborador
        colaborador = Colaboradores.query.get(data['colaborador_id'])
        if not colaborador:
            print("Colaborador not found")  # Mensagem de erro se o colaborador não for encontrado
            return jsonify({'message': 'Colaborador não encontrado'}), 404
        
        # Verificar a existência do serviço
        servico = Servicos.query.get(data['servico_id'])
        if not servico:
            print("Servico not found")  # Mensagem de erro se o serviço não for encontrado
            return jsonify({'message': 'Serviço não encontrado'}), 404

        plano_id = data.get('plano_id')

        # Validar se o serviço exige plano
        if 'fisioterapia' not in [tipo.tipo for tipo in servico.tipo_servicos]:
            if plano_id is None:
                print("Plano not provided")  # Mensagem de erro se o plano não for fornecido
                return jsonify({'message': 'Plano não fornecido'}), 400

            if not servico.planos or not isinstance(servico.planos, list):
                print("Serviço não possui planos válidos")  # Mensagem de erro se o serviço não possuir planos válidos
                return jsonify({'message': 'O serviço selecionado não possui planos válidos'}), 400

            plano_selecionado = None
            for plano in servico.planos:
                if plano.id_plano == plano_id:
                    plano_selecionado = plano
                    break

            if not plano_selecionado:
                print("Plano not found")  # Mensagem de erro se o plano não for encontrado
                return jsonify({'message': 'Plano não encontrado'}), 404
        else:
            plano_selecionado = None
        
        # Verificar a existência da clínica associada ao colaborador
        clinica = Clinicas.query.filter_by(id_clinica=colaborador.id_clinica).first()
        if not clinica:
            print("Clinica not found")  # Mensagem de erro se a clínica não for encontrada
            return jsonify({'message': 'Clínica não encontrada'}), 404

        # Verificar se já existe agendamento para o colaborador no horário escolhido
        data_e_hora = datetime.fromisoformat(data['data']).astimezone(BRASILIA)
        agendamento_existente = Agendamentos.query.filter(
            Agendamentos.id_colaborador == colaborador.id_colaborador,
            Agendamentos.data_e_hora == data_e_hora
        ).first()

        if agendamento_existente:
            return jsonify({'message': 'Já existe um agendamento para esse colaborador neste horário.'}), 400

        # Criar o agendamento
        novo_agendamento = Agendamentos(
            data_e_hora=data_e_hora,
            id_cliente=cliente.id_cliente,
            id_colaborador=colaborador.id_colaborador,
            id_servico=servico.id_servico,
            status="pendente",  # Status inicial
            id_clinica=clinica.id_clinica  # Adicionando a clínica ao agendamento
        )
        if plano_selecionado:
            novo_agendamento.id_plano = plano_selecionado.id_plano

        print(f"Created appointment: {novo_agendamento}")  
        
        db.session.add(novo_agendamento)
        db.session.commit()
        enviar_email_agendamento(novo_agendamento.id_agendamento)

        return jsonify({'message': 'Agendamento criado com status pendente'}), 201
    
    except Exception as e:
        error_details = traceback.format_exc()  # Captura o traceback completo do erro
        print(f"Error: {e}")  # Exibe a mensagem do erro
        print(f"Error details: {error_details}")  # Exibe o traceback completo para análise
        db.session.rollback()
        return jsonify({'message': f'Erro ao criar agendamento: {str(e)}', 'error_details': error_details}), 500




@agendamentos.route('/dias-permitidos/<int:colaborador_id>', methods=['GET'])
def dias_permitidos(colaborador_id):
    try:
        # Verifica se o colaborador existe (caso seja necessário)
        colaborador = Colaboradores.query.get(colaborador_id)
        if not colaborador:
            return jsonify({"message": "Colaborador não encontrado"}), 404

        # Buscar todos os dias da semana em que o colaborador tem horários
        dias_disponiveis = db.session.query(Horarios.dia_semana).filter_by(id_colaborador=colaborador_id).distinct().all()
        if not dias_disponiveis:
            return jsonify({"message": "Nenhum dia disponível encontrado para o colaborador."}), 404

        dias = [dia[0].strip().lower() for dia in dias_disponiveis]  # Padroniza para minúsculas e remove espaços
        
        # Mapeamento dos dias da semana para valores numéricos de 0 (Domingo) a 6 (Sábado)
        dias_map = {
            "domingo": 0,
            "segunda-feira": 1,
            "terca-feira": 2,
            "quarta-feira": 3,
            "quinta-feira": 4,
            "sexta-feira": 5,
            "sabado": 6
        }

        # Converter os dias encontrados no banco para seus valores numéricos
        dias_convertidos = [dias_map[dia] for dia in dias if dia in dias_map]
        
        return jsonify({"dias_permitidos": dias_convertidos}), 200
    except Exception as e:
        # Captura mais detalhes do erro
        return jsonify({"message": f"Erro ao buscar dias permitidos: {str(e)}"}), 500




def obter_horarios_disponiveis(colaborador_id, data_obj):
    # Converte a data para o dia da semana (ex: Segunda-feira)
    dia_semana = data_obj.strftime("%A")  # Usa o nome completo do dia da semana (ex: "Monday")
    dia_semana_mapeado = {
        "Monday": "Segunda-feira",
        "Tuesday": "Terça-feira",
        "Wednesday": "Quarta-feira",
        "Thursday": "Quinta-feira",
        "Friday": "Sexta-feira",
        "Saturday": "Sábado",
        "Sunday": "Domingo"
    }[dia_semana]
    print(f"Dia da semana (nome mapeado): {dia_semana_mapeado}")  # Log para verificar o dia da semana nome mapeado

    # Obtém os horários do colaborador para o dia da semana específico
    horarios_colaborador = Horarios.query.filter_by(id_colaborador=colaborador_id, dia_semana=dia_semana_mapeado.lower()).all()
    print(f"Horários do colaborador: {horarios_colaborador}")  # Log para verificar os horários obtidos

    # Obtém os agendamentos existentes para o colaborador na data específica
    agendamentos = Agendamentos.query.filter(
        Agendamentos.id_colaborador == colaborador_id,
        Agendamentos.data_e_hora >= data_obj,
        Agendamentos.data_e_hora < (data_obj + timedelta(days=1))
    ).all()
    print(f"Agendamentos existentes: {agendamentos}")  # Log para verificar os agendamentos encontrados

    # Coleta os horários já agendados (convertidos para objetos 'time' com data incluída)
    agendamentos_horarios = {agendamento.data_e_hora.replace(second=0, microsecond=0) for agendamento in agendamentos}
    print(f"Horários agendados: {agendamentos_horarios}")  # Log para verificar horários agendados

    horarios_disponiveis = []

    # Elimina duplicatas na lista de horários do colaborador (considera horários únicos)
    horarios_colaborador_unicos = list({(horario.hora_inicio, horario.hora_fim): horario for horario in horarios_colaborador}.values())

    for horario in horarios_colaborador_unicos:
        # Combina a data com a hora de início para garantir que estamos no dia certo
        hora_atual = datetime.combine(data_obj, horario.hora_inicio)
        hora_fim = datetime.combine(data_obj, horario.hora_fim)

        # Use timedelta para incrementar em intervalos de 1 hora
        while hora_atual < hora_fim:
            # Adiciona o horário ao resultado se não estiver agendado
            if hora_atual.replace(second=0, microsecond=0) not in agendamentos_horarios:
                horarios_disponiveis.append(hora_atual)
            hora_atual += timedelta(hours=1)  # Ajuste para 1 hora

    print(f"Horários disponíveis: {horarios_disponiveis}")  # Log para verificar os horários disponíveis

    return horarios_disponiveis




@agendamentos.route('/horarios-disponiveis/<int:colaborador_id>/', methods=['GET'])
def horarios_disponiveis(colaborador_id):
    data = request.args.get('data')  # Recebe a data no formato "YYYY-MM-DD"
    if not data:
        return jsonify({"error": "O parâmetro 'data' é obrigatório"}), 400

    try:
        data = data.split('T')[0]  # Pega apenas a parte da data (YYYY-MM-DD)
        data_obj = datetime.strptime(data, "%Y-%m-%d")
        print(f"Data escolhida: {data_obj}")  # Log para verificar a data escolhida

        horarios = obter_horarios_disponiveis(colaborador_id, data_obj)
        if horarios:
            return jsonify({"horarios_disponiveis": [hora.strftime("%H:%M") for hora in horarios]}), 200
        else:
            return jsonify({"message": "Nenhum horário disponível."}), 200
    except Exception as e:
        return jsonify({"message": f"Erro ao buscar horários disponíveis: {str(e)}"}), 500


@agendamentos.route('/listar_agendamentos', methods=['GET'])
@jwt_required()
def listar_agendamentos():
    try:
        # Obtém o email do usuário a partir do token JWT
        usuario_email = get_jwt_identity()
        print(f"Usuário autenticado: {usuario_email}")

        # Tenta encontrar o colaborador com o email
        colaborador = Colaboradores.query.filter_by(email=usuario_email).first()
        print(f"Colaborador encontrado: {colaborador}")

        # Tenta encontrar o admin com o email
        admin = Colaboradores.query.filter_by(is_admin=True, email=usuario_email).first()
        print(f"Admin encontrado: {admin}")

        # Tenta encontrar o cliente com o email
        cliente = Clientes.query.filter_by(email=usuario_email).first()
        print(f"Cliente encontrado: {cliente}")

        # Verifica se o usuário é autorizado
        if not colaborador and not admin and not cliente:
            return jsonify({'message': 'Usuário não autorizado'}), 403

        # Se for admin, pode ver todos os agendamentos
        if admin:
            agendamentos = Agendamentos.query.all()
            print(f"Agendamentos encontrados para admin: {len(agendamentos)}")
        elif colaborador:
            # Se for colaborador, filtra os agendamentos para aquele colaborador
            agendamentos = Agendamentos.query.filter_by(id_colaborador=colaborador.id_colaborador).all()
            print(f"Agendamentos encontrados para o colaborador: {len(agendamentos)}")
        else:
            # Se for cliente, filtra os agendamentos para aquele cliente
            agendamentos = Agendamentos.query.filter_by(id_cliente=cliente.id.cliente).all()
            print(f"Agendamentos encontrados para o cliente: {len(agendamentos)}")

        # Monta a lista com os dados dos agendamentos
        agendamentos_data = []
        for agendamento in agendamentos:
            # Para cada agendamento, busca os dados relacionados
            cliente = Clientes.query.get(agendamento.id_cliente)
            colaborador = Colaboradores.query.get(agendamento.id_dolaborador)
            servico = Servicos.query.get(agendamento.id_servico)

            # Variáveis para plano, inicializadas como None
            nome_plano = None
            valor_plano = None

            # Verificando se o serviço possui planos
            print(f"Serviço encontrado: {servico.Nome_servico}, Tipo de serviço: {servico.tipo_servico}")
            if servico and servico.tipo_servico == 'pilates' and servico.planos:
                print(f"Planos disponíveis para o serviço {servico.Nome_servico}: {servico.planos}")
                
                planos = servico.planos
                plano_especifico = next((plano for plano in planos if plano['ID_Plano'] == agendamento.ID_Plano), None)
                
                if plano_especifico:
                    nome_plano = plano_especifico.get('Nome_plano')
                    valor_plano = plano_especifico.get('Valor')
                    print(f"Plano encontrado: {nome_plano}, Valor: {valor_plano}")
                else:
                    print("Nenhum plano específico encontrado para este agendamento.")
            else:
                print("Serviço não é de pilates ou não tem planos.")

            # Adiciona os dados do agendamento
            agendamentos_data.append({
                'id': agendamento.ID_Agendamento,
                'nome_cliente': cliente.nome,
                'data': agendamento.data_e_hora.isoformat(),
                'hora': agendamento.data_e_hora.strftime("%H:%M"),
                'nome_servico': servico.Nome_servico,
                'valor_servico': servico.Valor,
                'nome_colaborador': colaborador.nome,
                'status': agendamento.status,
                'nome_plano': nome_plano,
                'valor_plano': valor_plano
            })

        print(f"Total de agendamentos a serem retornados: {len(agendamentos_data)}")
        return jsonify(agendamentos_data), 200

    except Exception as e:
        print(f"Erro ao listar agendamentos: {str(e)}")
        return jsonify({'message': f'Erro ao listar agendamentos: {str(e)}'}), 500






@agendamentos.route('/confirmar_negativo_agendamento/<int:agendamento_id>', methods=['PUT'])
@jwt_required()
def confirmar_negativo_agendamento(agendamento_id):
    try:
        usuario_email = get_jwt_identity()
        print(f"Usuário logado: {usuario_email}")  # Print para verificar o email do usuário logado
        
        # Verifica o colaborador e se é admin
        colaborador = Colaboradores.query.filter_by(email=usuario_email).first()
        if colaborador and colaborador.is_admin:
            admin = colaborador  # Se for admin, o próprio colaborador é considerado admin
        else:
            admin = None  # Caso contrário, admin será None

        print(f"Colaborador: {colaborador}, Admin: {admin}")  # Verifica as variáveis de colaborador e admin

        agendamento = Agendamentos.query.get(agendamento_id)
        
        if not agendamento:
            print(f"Agendamento com ID {agendamento_id} não encontrado.")  # Print se não encontrar o agendamento
            return jsonify({'message': 'Agendamento não encontrado'}), 404
        
        # Verifica se o colaborador tem permissão para modificar esse agendamento
        if not admin and agendamento.id_colaborador != colaborador.id_colaborador:
            print(f"Colaborador {colaborador.id_colaborador} não tem permissão para alterar o agendamento {agendamento_id}.")  # Print de permissão negada
            return jsonify({'message': 'Você não tem permissão para alterar esse agendamento'}), 403

        # Alterar o status do agendamento
        novo_status = request.json.get('status')
        print(f"Novo status recebido: {novo_status}")  # Print para verificar o status recebido
        
        if novo_status not in ['confirmado', 'negado']:
            print(f"Status inválido: {novo_status}")  # Print para verificar o status inválido
            return jsonify({'message': 'Status inválido'}), 400

        agendamento.status = novo_status
        db.session.commit()
        print(f"Status do agendamento {agendamento_id} alterado para {novo_status}.")  # Print para confirmar que a alteração ocorreu com sucesso
        enviar_email_status_agendamento(agendamento, novo_status)
        return jsonify({'message': f'Agendamento {novo_status} com sucesso'}), 200
    except Exception as e:
        print(f"Erro ao atualizar status do agendamento: {str(e)}")  # Print de erro no processamento
        db.session.rollback()
        return jsonify({'message': f'Erro ao atualizar status do agendamento: {str(e)}'}), 500
    
def enviar_email_status_agendamento(agendamento, status):
    try:
        # Obter informações do cliente, colaborador e serviço
        cliente = Clientes.query.get(agendamento.id_cliente)
        colaborador = Colaboradores.query.get(agendamento.id_colaborador)
        servico = Servicos.query.get(agendamento.id_servico)

        if not cliente or not colaborador or not servico:
            print("Dados do agendamento incompletos")
            return

        # Preparar o e-mail para o cliente
        if status == 'confirmado':
            subject_cliente = "Seu agendamento foi confirmado!"
            body_cliente = (
                f"Olá {cliente.nome},\n\n"
                f"Seu atendimento para o serviço '{servico.Nome_servico}' foi confirmado para "
                f"{agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
                f"Atenciosamente,\nEquipe FisioMais"
            )
        elif status == 'negado':
            subject_cliente = "Seu agendamento foi cancelado"
            body_cliente = (
                f"Olá {cliente.nome},\n\n"
                f"Infelizmente, seu atendimento para o serviço '{servico.Nome_servico}' foi cancelado. "
                f"Por favor, entre em contato para mais informações.\n\n"
                f"Atenciosamente,\nEquipe FisioMais"
            )

        msg_cliente = Message(
            subject=subject_cliente,
            recipients=[cliente.email],
            body=body_cliente
        )

        # Preparar o e-mail para o colaborador
        if status == 'confirmado':
            subject_colaborador = "Agendamento confirmado!"
            body_colaborador = (
                f"Olá {colaborador.nome},\n\n"
                f"O agendamento com o cliente {cliente.nome} foi confirmado para o serviço "
                f"'{servico.Nome_servico}' em {agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
                f"Atenciosamente,\nEquipe FisioMais"
            )
        elif status == 'negado':
            subject_colaborador = "Agendamento cancelado"
            body_colaborador = (
                f"Olá {colaborador.nome},\n\n"
                f"Infelizmente, o agendamento com o cliente {cliente.nome} foi cancelado. "
                f"Por favor, entre em contato para mais informações.\n\n"
                f"Atenciosamente,\nEquipe FisioMais"
            )

        msg_colaborador = Message(
            subject=subject_colaborador,
            recipients=[colaborador.email],
            body=body_colaborador
        )

        # Enviar os e-mails
        mail.send(msg_cliente)
        mail.send(msg_colaborador)
        print(f"E-mails enviados para cliente {cliente.nome} e colaborador {colaborador.nome}.")
    
    except Exception as e:
        print(f"Erro ao enviar e-mails: {str(e)}")


@agendamentos.route('/deletar_agendamento/<int:agendamento_id>', methods=['DELETE'])
@jwt_required()
def deletar_agendamento(agendamento_id):
    try:
        print(f"Iniciando a exclusão do agendamento com ID: {agendamento_id}")  # Log de início da operação
        
        usuario_email = get_jwt_identity()
        print(f"Email do usuário autenticado: {usuario_email}")  # Log do e-mail do usuário

        # Verifica se o colaborador é um admin ou se tem permissão para deletar o agendamento
        colaborador = Colaboradores.query.filter_by(email=usuario_email).first()
        if not colaborador:
            print("Colaborador não encontrado.")  # Log de colaborador não encontrado
            return jsonify({'message': 'Colaborador não encontrado'}), 404
        
        # Verifica se o colaborador é um admin
        if not colaborador.is_admin:  
            print(f"Verificando se o colaborador {colaborador.nome} é admin.")  # Log de verificação admin

        agendamento = Agendamentos.query.get(agendamento_id)
        print(f"Agendamento encontrado: {agendamento}")  # Log do agendamento encontrado

        if not agendamento:
            return jsonify({'message': 'Agendamento não encontrado'}), 404

        # Verifica se o colaborador tem permissão para deletar o agendamento
        if not colaborador.is_admin and agendamento.id_colaborador != colaborador.id_colaborador:
            print("Permissão negada para deletar agendamento.")  # Log de permissão negada
            return jsonify({'message': 'Você não tem permissão para deletar este agendamento'}), 403

        # Dados do cliente e colaborador para enviar os e-mails
        cliente = Clientes.query.get(agendamento.id_cliente)
        colaborador = Colaboradores.query.get(agendamento.id_colaborador)
        servico = Servicos.query.get(agendamento.id_servico)

        if not cliente or not colaborador or not servico:
            print("Dados incompletos do agendamento.")  # Log de dados incompletos
            return jsonify({'message': 'Dados do agendamento incompletos'}), 404

        # Enviar e-mail para o cliente informando o cancelamento
        subject_cliente = "Aviso: Seu agendamento foi cancelado"
        body_cliente = (
            f"Olá {cliente.nome},\n\n"
            f"Infelizmente, o seu agendamento para o serviço '{servico.Nome_servico}' foi cancelado.\n\n"
            f"Se você tiver dúvidas, entre em contato conosco.\n\n"
            f"Atenciosamente,\nEquipe FisioMais"
        )
        msg_cliente = Message(
            subject=subject_cliente,
            recipients=[cliente.email],
            body=body_cliente
        )

        # Enviar e-mail para o colaborador informando o cancelamento
        subject_colaborador = "Aviso: Agendamento cancelado"
        body_colaborador = (
            f"Olá {colaborador.nome},\n\n"
            f"O agendamento para o serviço '{servico.Nome_servico}' com o cliente {cliente.nome} foi cancelado.\n\n"
            f"Se você tiver dúvidas, entre em contato conosco.\n\n"
            f"Atenciosamente,\nEquipe FisioMais"
        )
        msg_colaborador = Message(
            subject=subject_colaborador,
            recipients=[colaborador.email],
            body=body_colaborador
        )

        # Enviar os e-mails
        mail.send(msg_cliente)
        mail.send(msg_colaborador)
        print("E-mails enviados com sucesso.")  # Log de e-mails enviados

        # Deleta o agendamento
        db.session.delete(agendamento)
        db.session.commit()
        print(f"Agendamento {agendamento_id} deletado com sucesso.")  # Log de sucesso na exclusão

        return jsonify({'message': 'Agendamento deletado e e-mails enviados com sucesso'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao deletar agendamento: {str(e)}")  # Log do erro
        return jsonify({'message': f'Erro ao deletar agendamento: {str(e)}'}), 500



    
@agendamentos.route('enviar_email_agendamento/<int:agendamento_id>', methods=['POST'])
@jwt_required()
def enviar_email_agendamento(agendamento_id):
    try:
        # Obter o agendamento pelo ID
        agendamento = Agendamentos.query.get(agendamento_id)
        if not agendamento:
            return jsonify({'message': 'Agendamento não encontrado'}), 404

        # Obter informações do cliente, colaborador e serviço
        cliente = Clientes.query.get(agendamento.id_cliente)
        colaborador = Colaboradores.query.get(agendamento.id_colaborador)
        servico = Servicos.query.get(agendamento.id_servico)

        if not cliente or not colaborador or not servico:
            return jsonify({'message': 'Dados do agendamento incompletos'}), 404

        # Dados do e-mail para o cliente
        subject_cliente = "Lembrete: Seu atendimento foi agendado!"
        body_cliente = (
            f"Olá {cliente.nome},\n\n"
            f"Seu atendimento para o serviço '{servico.Nome_servico}' foi agendado para "
            f"{agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
            f"Status: Pendente. Por favor, aguarde a confirmação do colaborador.\n\n"
            f"Atenciosamente,\nEquipe FisioMais"
        )
        msg_cliente = Message(
            subject=subject_cliente,
            recipients=[cliente.email],
            body=body_cliente
        )

        # Dados do e-mail para o colaborador
        subject_colaborador = "Novo agendamento - Aguardando confirmação"
        body_colaborador = (
            f"Olá {colaborador.nome},\n\n"
            f"Você tem um atendimento agendado com o cliente {cliente.nome} "
            f"para o serviço '{servico.Nome_servico}' em {agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
            f"Status: Pendente. Por favor, confirme se você pode realizar esse atendimento.\n\n"
            f"Atenciosamente,\nEquipe FisioMais"
        )
        msg_colaborador = Message(
            subject=subject_colaborador,
            recipients=[colaborador.email],
            body=body_colaborador
        )

        # Dados do e-mail para o administrador
        subject_admin = "Novo agendamento registrado - Aguardando confirmação"
        body_admin = (
            f"Um novo agendamento foi registrado e está aguardando confirmação:\n\n"
            f"Cliente: {cliente.nome}\n"
            f"Colaborador: {colaborador.nome}\n"
            f"Serviço: {servico.Nome_servico}\n"
            f"Data e Hora: {agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
            f"Status: Pendente. Aguardando confirmação do colaborador e cliente.\n\n"
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
