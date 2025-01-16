from flask import Blueprint, current_app, send_from_directory, request, jsonify
from app.models import Colaboradores, Agendamentos, Clientes, Servicos, Horarios, Clinicas,Planos, db
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message
from flask import current_app
from app import mail
from datetime import datetime, timedelta
from pytz import timezone
from sqlalchemy.orm import joinedload

agendamentos= Blueprint('agendamentos', __name__)

"""
Rotas relacionadas aos serviços no sistema:

# Rotas GET:
1. '/listar_servicos' - Lista os serviços relacionados ao colaborador autenticado, incluindo planos e tipos de serviço. Se o colaborador for administrador, lista todos os serviços do sistema.
2. '/listar_todos_servicos' - Lista todos os serviços do sistema, independentemente do colaborador autenticado. Inclui planos e tipos de serviço.

# Rotas PUT:
1. '/editar_servico/<int:id_servico>' - Atualiza as informações de um serviço específico pelo ID, incluindo nome, descrição, tipo e planos (se for do tipo pilates). Se o tipo de serviço for alterado, a associação é atualizada.

# Rotas POST:
1. '/add_servico' - Adiciona um novo serviço ao sistema, incluindo nome, descrição, valor, tipo, colaboradores associados e planos (se o serviço for do tipo pilates).
2. '/adicionar_colaboradores' - Associa colaboradores a um serviço existente, permitindo adicionar múltiplos colaboradores ao serviço.
3. '/remover_colaboradores' - Remove colaboradores de um serviço existente, com base nos IDs fornecidos.

# Rota DELETE:
1. '/deletar_servico/<int:id>' - Exclui um serviço do sistema, removendo também os relacionamentos com colaboradores associados.

Essas rotas utilizam autenticação JWT para garantir a segurança e fazem uso de validações de entrada para evitar dados inconsistentes. As operações de leitura (GET) retornam os dados solicitados, enquanto as de escrita (POST, PUT, DELETE) atualizam o banco de dados e realizam ações sobre os serviços e seus relacionamentos com colaboradores.
"""



import traceback

@agendamentos.route('/', methods=['OPTIONS'])
@jwt_required()
def handle_options():
    return '', 200  # Responde com status 200 OK

# Define o fuso horário de Brasília
BRASILIA = timezone('America/Sao_Paulo')

from datetime import datetime, timedelta
from pytz import timezone

# Define o fuso horário de Brasília
BRASILIA = timezone('America/Sao_Paulo')

@agendamentos.route('/', methods=['POST'])
@jwt_required()
def agendamento():
    try:
        data = request.get_json()
        print(f"Received data: {data}")  # Exibe os dados recebidos para debugging

        usuario_email = get_jwt_identity()
        print(f"User email: {usuario_email}")  # Exibe o email do usuário para debugging
        data_str = data['data']
        print(f"Data recebida do frontend: {data_str}")
        
        try:
            # Converte diretamente da string ISO, que agora contém o fuso horário
            data_e_hora_utc = datetime.fromisoformat(data_str).astimezone(timezone('UTC'))
            print(f"Data convertida para UTC: {data_e_hora_utc}")

        except ValueError as e:
            print(f"Erro ao converter data: {e}")
            return jsonify({'message': f'Formato de data inválido: {e}'}), 400

        cliente = Clientes.query.filter_by(email=usuario_email).first()
        colaborador = Colaboradores.query.filter_by(email=usuario_email).first()

        if not cliente and not colaborador:
            print("User not found")  # Mensagem de erro se o usuário não for encontrado
            return jsonify({'message': 'Usuário não encontrado'}), 404

        if colaborador and 'cliente_id' in data and data['cliente_id']:
            cliente = Clientes.query.get(data['cliente_id'])
            if not cliente:
                print("Cliente not found")  # Mensagem de erro se o cliente não for encontrado
                return jsonify({'message': 'Cliente não encontrado'}), 404
        elif not colaborador and not cliente:
            print("Cliente não encontrado")  # Mensagem de erro se não for cliente
            return jsonify({'message': 'Cliente não encontrado'}), 404

        colaborador = Colaboradores.query.get(data['colaborador_id'])
        if not colaborador:
            print("Colaborador not found")  # Mensagem de erro se o colaborador não for encontrado
            return jsonify({'message': 'Colaborador não encontrado'}), 404

        servico = Servicos.query.get(data['servico_id'])
        if not servico:
            print("Servico not found")  # Mensagem de erro se o serviço não for encontrado
            return jsonify({'message': 'Serviço não encontrado'}), 404

        plano_id = data.get('plano_id')
        if 'pilates' in [tipo.tipo for tipo in servico.tipo_servicos]:
            if not plano_id:
                print("Plano não fornecido para Pilates.")  # Mensagem de erro
                return jsonify({'message': 'Plano não fornecido para Pilates.'}), 400

            plano_selecionado = None
            for plano in servico.planos or []:
                if plano.id_plano == plano_id:
                    plano_selecionado = plano
                    break

            if not plano_selecionado:
                print("Plano não encontrado para Pilates.")  # Mensagem de erro
                return jsonify({'message': 'Plano não encontrado para Pilates.'}), 404
        else:
            plano_selecionado = None  # Fisioterapia não exige plano.

        clinica = Clinicas.query.filter_by(id_clinica=colaborador.clinica_id).first()
        if not clinica:
            print("Clinica not found")  # Mensagem de erro se a clínica não for encontrada
            return jsonify({'message': 'Clínica não encontrada'}), 404

        # Corrigir o problema da data
        data_e_hora_utc = datetime.fromisoformat(data['data']).astimezone(timezone('UTC'))
        data_e_hora_brasilia = data_e_hora_utc.astimezone(BRASILIA)

        # Remover a parte do fuso horário depois de ajustar para o horário correto
        data_e_hora_local = data_e_hora_brasilia.replace(tzinfo=None)

        # Verifica se já existe um agendamento nesse horário
        agendamento_existente = Agendamentos.query.filter(
            Agendamentos.id_colaborador == colaborador.id_colaborador,
            Agendamentos.data_e_hora == data_e_hora_local
        ).first()

        if agendamento_existente:
            return jsonify({'message': 'Já existe um agendamento para esse colaborador neste horário.'}), 400
        
        # Criação do novo agendamento
        novo_agendamento = Agendamentos(
            data_e_hora=data_e_hora_local,
            id_cliente=cliente.id_cliente,
            id_colaborador=colaborador.id_colaborador,
            id_servico=servico.id_servico,
            status="pendente",
            id_clinica=clinica.id_clinica
        )
        if plano_selecionado:
            novo_agendamento.id_plano = plano_selecionado.id_plano

        print(f"Created appointment: {novo_agendamento}")

        db.session.add(novo_agendamento)
        db.session.commit()

        # Enviar e-mail de agendamento (opcional)
        # enviar_email_agendamento(novo_agendamento.id_agendamento)

        return jsonify({'message': 'Agendamento criado com status pendente'}), 201

    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error: {e}")
        print(f"Error details: {error_details}")
        db.session.rollback()
        return jsonify({'message': f'Erro ao criar agendamento: {str(e)}', 'error_details': error_details}), 500




@agendamentos.route('/listar_agendamentos', methods=['GET'])
@jwt_required()
def listar_agendamentos():
    try:
        usuario_email = get_jwt_identity()
        print(f"Usuário autenticado: {usuario_email}")

        colaborador = Colaboradores.query.filter_by(email=usuario_email).first()
        print(f"Colaborador encontrado: {colaborador}")

        admin = Colaboradores.query.filter_by(is_admin=True, email=usuario_email).first()
        print(f"Admin encontrado: {admin}")

        cliente = Clientes.query.filter_by(email=usuario_email).first()
        print(f"Cliente encontrado: {cliente}")

        if not colaborador and not admin and not cliente:
            return jsonify({'message': 'Usuário não autorizado'}), 403

        query = db.session.query(Agendamentos).options(
            joinedload(Agendamentos.servico),
            joinedload(Agendamentos.colaborador),
            joinedload(Agendamentos.cliente),
            joinedload(Agendamentos.clinica).joinedload(Clinicas.endereco)
        )

        if admin:
            agendamentos = query.all()
            print(f"Agendamentos encontrados para admin: {len(agendamentos)}")
        elif colaborador:
            agendamentos = query.filter(Agendamentos.id_colaborador == colaborador.id_colaborador).all()
            print(f"Agendamentos encontrados para o colaborador: {len(agendamentos)}")
        elif cliente:
            agendamentos = query.filter(Agendamentos.id_cliente == cliente.id_cliente).all()
            print(f"Agendamentos encontrados para o cliente: {len(agendamentos)}")

        resultado = []
        for agendamento in agendamentos:
            clinica = agendamento.clinica
            endereco_clinica = clinica.endereco if clinica else None
            cliente = agendamento.cliente
            colaborador = agendamento.colaborador
            servico = agendamento.servico

            plano_servico = None
            if servico and servico.valor is None:
                plano_servico = Planos.query.filter_by(servico_id=servico.id_servico).first()

            # Convertendo a data e hora para o fuso horário de Brasília
            data_e_hora_brasilia = agendamento.data_e_hora.astimezone(BRASILIA)

            resultado.append({
                'id': agendamento.id_agendamento,
                'data': data_e_hora_brasilia.strftime('%Y-%m-%d'),
                'hora': data_e_hora_brasilia.strftime('%H:%M'),
                'status': agendamento.status,
                'servico': agendamento.servico.nome if agendamento.servico else None,
                'valor': servico.valor if servico.valor else (plano_servico.valor if plano_servico else None),
                'plano': {
                    'nome': plano_servico.nome if plano_servico else None,
                    'descricao': plano_servico.descricao if plano_servico else None,
                    'valor': plano_servico.valor if plano_servico else None
                } if plano_servico else None,
                'colaborador': agendamento.colaborador.nome if agendamento.colaborador else None,
                'cliente': agendamento.cliente.nome if agendamento.cliente else None,
                'clinica': {
                    'nome': clinica.nome if clinica else None,
                    'cnpj': clinica.cnpj if clinica else None,
                    'telefone': clinica.telefone if clinica else None,
                    'endereco': {
                        'rua': endereco_clinica.rua if endereco_clinica else None,
                        'numero': endereco_clinica.numero if endereco_clinica else None,
                        'complemento': endereco_clinica.complemento if endereco_clinica else None,
                        'bairro': endereco_clinica.bairro if endereco_clinica else None,
                        'cidade': endereco_clinica.cidade if endereco_clinica else None,
                        'estado': endereco_clinica.estado if endereco_clinica else None
                    } if endereco_clinica else None
                }
            })

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500




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
        "Monday": "segunda-feira",
        "Tuesday": "terca-feira",
        "Wednesday": "quarta-feira",
        "Thursday": "quinta-feira",
        "Friday": "sexta-feira",
        "Saturday": "sabado",
        "Sunday": "domingo"
    }[dia_semana]
    print(f"Dia da semana (nome mapeado): {dia_semana_mapeado}")  # Log para verificar o dia da semana nome mapeado

    # Obtém os horários do colaborador para o dia da semana específico
    try:
        horarios_colaborador = Horarios.query.filter_by(id_colaborador=colaborador_id, dia_semana=dia_semana_mapeado).all()
        print(f"Horários do colaborador: {horarios_colaborador}")  # Log para verificar os horários obtidos
    except Exception as e:
        print(f"Erro ao buscar horários: {str(e)}")  # Log de erro ao buscar horários
        horarios_colaborador = []

    # Obtém os agendamentos existentes para o colaborador na data específica (início do dia a fim do dia)
    data_inicio = data_obj.replace(hour=0, minute=0, second=0, microsecond=0)
    data_fim = data_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
    print(f"Data início: {data_inicio}, Data fim: {data_fim}")  # Log para verificar os limites de data para agendamentos

    try:
        agendamentos = Agendamentos.query.filter(
            Agendamentos.id_colaborador == colaborador_id,
            Agendamentos.data_e_hora >= data_inicio,
            Agendamentos.data_e_hora <= data_fim
        ).all()
        print(f"Agendamentos existentes: {agendamentos}")  # Log para verificar os agendamentos encontrados
    except Exception as e:
        print(f"Erro ao buscar agendamentos: {str(e)}")  # Log de erro ao buscar agendamentos
        agendamentos = []

    # Coleta os horários já agendados (convertidos para objetos 'time' com data incluída)
    agendamentos_horarios = {agendamento.data_e_hora.replace(second=0, microsecond=0) for agendamento in agendamentos}
    print(f"Horários agendados: {agendamentos_horarios}")  # Log para verificar horários agendados

    # Verifica se a data é o dia atual e ajusta o filtro de horários
    hora_atual_brasilia = datetime.now() + timedelta(hours=-3)  # Ajusta para o horário de Brasília
    limite_minimo_horario = hora_atual_brasilia + timedelta(hours=2)

    horarios_disponiveis = []

    for horario in horarios_colaborador:
        # Combina a data com a hora de início para garantir que estamos no dia certo
        hora_atual = datetime.combine(data_obj, horario.hora_inicio)
        hora_fim = datetime.combine(data_obj, horario.hora_fim)

        # Use timedelta para incrementar em intervalos de 1 hora
        while hora_atual < hora_fim:
            # Verifica se o horário está no futuro e não em cima da hora no dia atual
            if (data_obj.date() != hora_atual_brasilia.date() or hora_atual >= limite_minimo_horario) and \
                    hora_atual.replace(second=0, microsecond=0) not in agendamentos_horarios:
                print(f"Horário disponível: {hora_atual}")  # Log para verificar horário disponível
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
        # Ajusta para o formato de data correto
        data = data.split('T')[0]  # Pega apenas a parte da data (YYYY-MM-DD)
        data_obj = datetime.strptime(data, "%Y-%m-%d")
        print(f"Data escolhida: {data_obj}")  # Log para verificar a data escolhida

        # Ajusta para o início do dia (00:00:00) e fim do dia (23:59:59)
        data_inicio = data_obj.replace(hour=0, minute=0, second=0, microsecond=0)
        data_fim = data_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
        print(f"Data início: {data_inicio}, Data fim: {data_fim}")  # Log para verificar os limites de data

        # Obtém os horários disponíveis para o colaborador, considerando a data de início e fim
        horarios = obter_horarios_disponiveis(colaborador_id, data_obj)

        # Filtra os horários disponíveis considerando os agendamentos
        if horarios:
            # Retorna os horários no formato de hora:minuto
            return jsonify({"horarios_disponiveis": [hora.strftime("%H:%M") for hora in horarios]}), 200
        else:
            return jsonify({"message": "Nenhum horário disponível."}), 200
    except Exception as e:
        print(f"Erro ao buscar horários disponíveis: {str(e)}")  # Log de erro ao buscar horários
        return jsonify({"message": f"Erro ao buscar horários disponíveis: {str(e)}"}), 500








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
        
        if novo_status not in ['confirmado', 'negado', 'cancelado', 'nao_compareceu', 'remarcado']:
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
            current_app.logger.error("Dados do agendamento incompletos.")
            return

        # Função auxiliar para criar e-mails
        def criar_email(subject, recipients, body):
            return Message(subject=subject, recipients=recipients, body=body)

        # Preparar os e-mails com base no status
        if status == 'confirmado':
            subject_cliente = "Seu agendamento foi confirmado!"
            body_cliente = (
                f"Olá {cliente.nome},\n\n"
                f"Seu atendimento para o serviço '{servico.nome}' foi confirmado para "
                f"{agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
                f"Atenciosamente,\nEquipe FisioMais"
            )

            subject_colaborador = "Agendamento confirmado!"
            body_colaborador = (
                f"Olá {colaborador.nome},\n\n"
                f"O agendamento com o cliente {cliente.nome} foi confirmado para o serviço "
                f"'{servico.nome}' em {agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
                f"Atenciosamente,\nEquipe FisioMais"
            )

        elif status == 'negado':
            subject_cliente = "Seu agendamento foi cancelado"
            body_cliente = (
                f"Olá {cliente.nome},\n\n"
                f"Infelizmente, seu atendimento para o serviço '{servico.nome}' foi cancelado. "
                f"Por favor, entre em contato para mais informações.\n\n"
                f"Atenciosamente,\nEquipe FisioMais"
            )

            subject_colaborador = "Agendamento cancelado"
            body_colaborador = (
                f"Olá {colaborador.nome},\n\n"
                f"Infelizmente, o agendamento com o cliente {cliente.nome} foi cancelado. "
                f"Por favor, entre em contato para mais informações.\n\n"
                f"Atenciosamente,\nEquipe FisioMais"
            )

        else:
            current_app.logger.warning(f"Status desconhecido: {status}")
            return

        # Criar e-mails
        msg_cliente = criar_email(subject_cliente, [cliente.email], body_cliente)
        msg_colaborador = criar_email(subject_colaborador, [colaborador.email], body_colaborador)

        # Enviar os e-mails
        mail.send(msg_cliente)
        mail.send(msg_colaborador)
        current_app.logger.info(f"E-mails enviados para cliente {cliente.nome} e colaborador {colaborador.nome}.")
    
    except Exception as e:
        current_app.logger.error(f"Erro ao enviar e-mails: {str(e)}")



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
            f"Infelizmente, o seu agendamento para o serviço '{servico.nome}' foi cancelado.\n\n"
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
            f"O agendamento para o serviço '{servico.nome}' com o cliente {cliente.nome} foi cancelado.\n\n"
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

        # Função auxiliar para montar o e-mail
        def criar_email(subject, recipients, body):
            return Message(subject=subject, recipients=recipients, body=body)

        # Dados do e-mail para o cliente
        subject_cliente = "Lembrete: Seu atendimento foi agendado!"
        body_cliente = (
            f"Olá {cliente.nome},\n\n"
            f"Seu atendimento para o serviço '{servico.nome}' foi agendado para "
            f"{agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
            f"Status: Pendente. Por favor, aguarde a confirmação do colaborador.\n\n"
            f"Atenciosamente,\nEquipe FisioMais"
        )
        msg_cliente = criar_email(subject_cliente, [cliente.email], body_cliente)

        # Dados do e-mail para o colaborador
        subject_colaborador = "Novo agendamento - Aguardando confirmação"
        body_colaborador = (
            f"Olá {colaborador.nome},\n\n"
            f"Você tem um atendimento agendado com o cliente {cliente.nome} "
            f"para o serviço '{servico.nome}' em {agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
            f"Status: Pendente. Por favor, confirme se você pode realizar esse atendimento.\n\n"
            f"Atenciosamente,\nEquipe FisioMais"
        )
        msg_colaborador = criar_email(subject_colaborador, [colaborador.email], body_colaborador)

        # Dados do e-mail para o administrador
        subject_admin = "Novo agendamento registrado - Aguardando confirmação"
        body_admin = (
            f"Um novo agendamento foi registrado e está aguardando confirmação:\n\n"
            f"Cliente: {cliente.nome}\n"
            f"Colaborador: {colaborador.nome}\n"
            f"Serviço: {servico.nome}\n"
            f"Data e Hora: {agendamento.data_e_hora.strftime('%d/%m/%Y %H:%M')}.\n\n"
            f"Status: Pendente. Aguardando confirmação do colaborador e cliente.\n\n"
            f"Atenciosamente,\nEquipe FisioMais"
        )
        msg_admin = criar_email(subject_admin, [current_app.config['MAIL_DEFAULT_SENDER']], body_admin)

        # Enviar os e-mails
        mail.send(msg_cliente)
        mail.send(msg_colaborador)
        mail.send(msg_admin)

        return jsonify({'message': 'E-mails enviados com sucesso'}), 200

    except Exception as e:
        current_app.logger.error(f"Erro ao enviar e-mails para o agendamento {agendamento_id}: {e}")
        return jsonify({'message': 'Erro ao enviar e-mails'}), 500

