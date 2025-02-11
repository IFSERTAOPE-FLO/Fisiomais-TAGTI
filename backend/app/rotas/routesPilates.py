from flask import Blueprint, jsonify, request
from app.models import Aulas, Pagamentos, Clientes, Colaboradores, Servicos, Planos, ColaboradoresServicos, AulasClientes, Clinicas, Agendamentos, Clientes, Aulas, db
from flask_jwt_extended import jwt_required, get_jwt_identity

pilates = Blueprint('pilates', __name__)

from datetime import datetime

from datetime import datetime, timedelta
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
# Certifique-se de importar os modelos: Colaboradores, Servicos, Aulas, etc.

@pilates.route('/adicionar_aula_pilates', methods=['POST'])
@jwt_required()
def adicionar_aula_pilates():
    try:
        # Recuperando os dados do request
        data = request.get_json()
        colaborador_email = get_jwt_identity()  # Email do colaborador logado
        servico_id = data.get('servico_id')       # ID do serviço (deve ser Pilates)
        dias_semana = data.get('dias_semana')       # Lista de dias (ex.: ["Segunda-feira", "Terça-feira"])
        hora_inicio = data.get('hora_inicio')       # Formato "HH:MM"
        hora_fim = data.get('hora_fim')             # Formato "HH:MM"
        limite_alunos = data.get('limite_alunos')   # Limite de alunos por aula
        duracao_aula = data.get('duracao_aula')       # Duração de cada aula (em minutos)

        # Validação de campos obrigatórios
        if not all([dias_semana, hora_inicio, hora_fim, duracao_aula]):
            return jsonify({"message": "Campos obrigatórios ausentes."}), 400
        if limite_alunos is None:
            return jsonify({"message": "O campo 'limite_alunos' é obrigatório."}), 400

        # Converter a duração para inteiro (removendo o sufixo 'min', se houver)
        try:
            if isinstance(duracao_aula, str):
                duracao_aula = duracao_aula.replace("min", "").strip()
            duracao_minutes = int(duracao_aula)
        except ValueError:
            return jsonify({"message": "Duração da aula inválida."}), 400

        # Converter hora de início e fim para objetos datetime (usando uma data arbitrária)
        try:
            hora_inicio_obj = datetime.strptime(hora_inicio, "%H:%M")
            hora_fim_obj = datetime.strptime(hora_fim, "%H:%M")
        except ValueError:
            return jsonify({"message": "Formato de horário inválido. Use HH:MM."}), 400

        if hora_inicio_obj >= hora_fim_obj:
            return jsonify({"message": "A hora de início deve ser antes da hora de fim."}), 400

        # Verificando se o colaborador existe
        colaborador = Colaboradores.query.filter_by(email=colaborador_email).first()
        if not colaborador:
            return jsonify({"message": "Colaborador não encontrado."}), 404

        # Se o colaborador for admin, pode informar o id de outro colaborador
        if colaborador.is_admin:
            id_colaborador = data.get('id_colaborador')
            if not id_colaborador:
                return jsonify({"message": "O campo 'id_colaborador' é obrigatório para administradores."}), 400
            
            colaborador_destino = Colaboradores.query.filter_by(id_colaborador=id_colaborador).first()
            if not colaborador_destino:
                return jsonify({"message": "Colaborador não encontrado para o ID fornecido."}), 404
            id_colaborador = colaborador_destino.id_colaborador
        else:
            id_colaborador = colaborador.id_colaborador

        # Verificando se o serviço é Pilates
        servico = Servicos.query.filter_by(id_servico=servico_id).first()
        if not servico or 'pilates' not in [tipo.tipo for tipo in servico.tipo_servicos]:
            return jsonify({"message": "Serviço inválido ou não é Pilates."}), 400

        # Para cada dia selecionado, cria aulas em intervalos de "duracao_minutes" até atingir a hora de fim
        for dia in dias_semana:
            current_time = hora_inicio_obj
            while current_time + timedelta(minutes=duracao_minutes) <= hora_fim_obj:
                interval_end = current_time + timedelta(minutes=duracao_minutes)
                nova_aula = Aulas(
                    id_colaborador=id_colaborador,
                    dia_semana=dia,
                    hora_inicio=current_time.time(),
                    hora_fim=interval_end.time(),
                    limite_alunos=limite_alunos
                )
                db.session.add(nova_aula)
                current_time = interval_end  # Avança para o próximo intervalo

        db.session.commit()
        return jsonify({"message": "Aulas de Pilates criadas com sucesso!"}), 201

    except Exception as e:
        db.session.rollback()
        response = jsonify({"message": f"Ocorreu um erro: {str(e)}"})
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        return response, 500





@pilates.route('/colaborador/adicionar_cliente_aula', methods=['POST'])
def adicionar_cliente_aula_colaborador():
    data = request.get_json()

    id_cliente = data.get('cliente_id')
    aula_id = data.get('aula_id')

    # Verificando se a aula existe
    aula = Aulas.query.get(aula_id)
    if not aula:
        return jsonify({"message": "Aula não encontrada!"}), 404

    # Verificando se o colaborador está associado à aula
    colaborador = aula.colaborador
    if not colaborador:
        return jsonify({"message": "Colaborador não encontrado para esta aula!"}), 404

    # Verificando se o cliente existe
    cliente = Clientes.query.get(id_cliente)
    if not cliente:
        return jsonify({"message": "Cliente não encontrado!"}), 404

    # Verificando se o cliente possui um plano associado
    if not cliente.plano_id:
        return jsonify({"message": "Cliente não possui um plano ativo!"}), 400

    # Verificando se o cliente já está inscrito
    aluno_existente = AulasClientes.query.filter_by(id_cliente=id_cliente, id_aula=aula_id).first()
    if aluno_existente:
        return jsonify({"message": "Cliente já inscrito nesta aula!"}), 400

    # Contando o número de alunos na aula
    total_alunos = AulasClientes.query.filter_by(id_aula=aula_id).count()
    if total_alunos >= aula.limite_alunos:
        return jsonify({"message": "O limite de alunos para esta aula foi atingido!"}), 400

    # Adicionando o cliente à aula
    nova_inscricao = AulasClientes(id_cliente=id_cliente, id_aula=aula_id)
    db.session.add(nova_inscricao)
    db.session.commit()   

    return jsonify({"message": "Cliente adicionado com sucesso à aula!"}), 201

@pilates.route('/colaborador/vincular_plano_aluno', methods=['POST'])
def vincular_plano_aluno():
    try:
        data = request.get_json()
        aluno_id = data.get('aluno_id')
        plano_id = data.get('plano_id')

        # Verifica se os dados necessários foram enviados
        if not aluno_id or not plano_id:
            return jsonify({"message": "Dados incompletos! Informe 'aluno_id' e 'plano_id'."}), 400

        # Buscando o aluno (ou cliente) no banco de dados.
        # Caso sua model se chame 'Clientes' ou 'Alunos', ajuste conforme necessário.
        aluno = Clientes.query.get(aluno_id)
        if not aluno:
            return jsonify({"message": "Aluno não encontrado!"}), 404

        # Buscando o plano no banco de dados
        plano = Planos.query.get(plano_id)
        if not plano:
            return jsonify({"message": "Plano não encontrado!"}), 404

        # Vincula o plano ao aluno
        aluno.plano_id = plano_id
        db.session.add(aluno)
        db.session.commit()

        return jsonify({"message": "Plano vinculado com sucesso ao aluno!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao vincular o plano ao aluno: {str(e)}"}), 500
    

from datetime import datetime, timedelta

@pilates.route('/cliente/cadastrar_aula', methods=['POST'])
def cadastrar_aula_cliente():
    try:
        data = request.get_json()
        cliente_id = data.get('cliente_id')
        plano_id = data.get('plano_id')  
        aulas_selecionadas = data.get('aulas_selecionadas', [])

        if not cliente_id or not aulas_selecionadas:
            return jsonify({"message": "Dados incompletos!"}), 400

        # Busca o cliente
        cliente = Clientes.query.get(cliente_id)
        if not cliente:
            return jsonify({"message": "Cliente não encontrado!"}), 404

        # Verifica se o cliente já possui um plano ativo;
        # caso contrário, usa o plano informado e o associa ao cliente.
        if cliente.plano_id:
            plano = Planos.query.get(cliente.plano_id)
        else:
            if not plano_id:
                return jsonify({"message": "Plano não informado e cliente não possui plano ativo!"}), 400
            plano = Planos.query.get(plano_id)
            if not plano:
                return jsonify({"message": "Plano não encontrado!"}), 404
            cliente.plano_id = plano_id
            db.session.add(cliente)

        # 1. Verifica o limite semanal
        data_inicio_semana = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
        aulas_semana_atual = (
            AulasClientes.query
            .join(Aulas)
            .filter(
                AulasClientes.id_cliente == cliente_id,
                Aulas.data >= data_inicio_semana
            )
            .count()
        )

        if aulas_semana_atual + len(aulas_selecionadas) > plano.quantidade_aulas_por_semana:
            return jsonify({
                "message": f"Limite de {plano.quantidade_aulas_por_semana} aulas semanais excedido!"
            }), 400

        # 2. Verifica o limite total (soma das aulas anteriores + novas)
        aulas_totais = AulasClientes.query.filter_by(id_cliente=cliente_id).count()
        if aulas_totais + len(aulas_selecionadas) > plano.limite_total_aulas:
            return jsonify({
                "message": f"Limite total de {plano.limite_total_aulas} aulas excedido!"
            }), 400

        # Percorre as aulas selecionadas e realiza as verificações individuais
        for aula_id in aulas_selecionadas:
            aula = Aulas.query.get(aula_id)
            if not aula:
                return jsonify({"message": f"Aula ID {aula_id} não encontrada!"}), 404

            # Verifica se o cliente já está inscrito nesta aula
            if AulasClientes.query.filter_by(id_cliente=cliente_id, id_aula=aula_id).first():
                return jsonify({"message": f"Cliente já está inscrito na aula ID {aula_id}!"}), 400

            # Verifica se a aula já atingiu o limite de alunos
            if len(aula.alunos) >= aula.limite_alunos:
                return jsonify({"message": f"Aula ID {aula_id} lotada!"}), 400

            # Cria a inscrição para a aula
            nova_inscricao = AulasClientes(
                id_cliente=cliente_id,
                id_aula=aula_id,
                data_inscricao=datetime.utcnow()
            )
            db.session.add(nova_inscricao)

        db.session.commit()

        # Após as inscrições, pode-se chamar uma função para agendar a semana atual, se necessário.
        response = criar_agendamentos_semana_atual(cliente_id)
        return response

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao cadastrar cliente na aula: {str(e)}"}), 500


@pilates.route('/colaborador/remover_cliente_aula', methods=['DELETE'])
def remover_cliente_aula_colaborador():
    data = request.get_json()

    id_cliente = data.get('cliente_id')
    aula_id = data.get('aula_id')

    # Verificando se a inscrição existe
    inscricao = AulasClientes.query.filter_by(id_cliente=id_cliente, id_aula=aula_id).first()
    if not inscricao:
        return jsonify({"message": "Cliente não encontrado nesta aula!"}), 404

    # Removendo a inscrição do cliente na aula
    db.session.delete(inscricao)
    db.session.commit()

    return jsonify({"message": "Cliente removido com sucesso da aula!"}), 200

from flask_jwt_extended import jwt_required, get_jwt_identity

@pilates.route('/cliente/remover_aula', methods=['DELETE'])
@jwt_required()
def remover_cliente_aula():
    data = request.get_json()
    aula_id = data.get('aula_id')

    # Obtém o e-mail do cliente a partir do token JWT
    email_cliente = get_jwt_identity()

    if not aula_id:
        return jsonify({"message": "ID da aula é obrigatório!"}), 400

    # Busca o ID do cliente com base no e-mail
    cliente = Clientes.query.filter_by(email=email_cliente).first()
    if not cliente:
        return jsonify({"message": "Cliente não encontrado!"}), 404

    # Verifica se o cliente está matriculado na aula
    inscricao = AulasClientes.query.filter_by(id_cliente=cliente.id_cliente, id_aula=aula_id).first()
    if not inscricao:
        return jsonify({"message": "Você não está matriculado nesta aula!"}), 404

    # Remove a matrícula da aula
    db.session.delete(inscricao)
    db.session.commit()

    return jsonify({"message": "Você saiu da aula com sucesso!"}), 200



@pilates.route('/aula/<int:aula_id>/clientes', methods=['GET'])
def listar_clientes_da_aula(aula_id):
    aula = Aulas.query.get(aula_id)
    if not aula:
        return jsonify({"message": "Aula não encontrada!"}), 404

    # Listar os clientes associados à aula
    clientes = [
        {"id_cliente": aluno.cliente.id_cliente, "nome": aluno.cliente.nome}
        for aluno in aula.alunos
    ]

    return jsonify({"clientes": clientes}), 200
@pilates.route('/cliente/<int:cliente_id>/aulas', methods=['GET'])
def listar_aulas_do_cliente(cliente_id):
    # Verifica se o cliente existe
    cliente = Clientes.query.get(cliente_id)
    if not cliente:
        return jsonify({"message": "Cliente não encontrado!"}), 404

    # Obtém todas as inscrições desse cliente na tabela AulasClientes
    inscricoes = AulasClientes.query.filter_by(id_cliente=cliente_id).all()

    # Para cada inscrição, extrai os dados da aula associada
    aulas = []
    for inscricao in inscricoes:
        aula = inscricao.aula  # Relação definida em AulasClientes (back_populates='aula')
        if aula:
            aulas.append({
                "idAula": aula.id_aula,
                "diaSemana": aula.dia_semana,
                "horaInicio": aula.hora_inicio.strftime('%H:%M') if aula.hora_inicio else None,
                "horaFim": aula.hora_fim.strftime('%H:%M') if aula.hora_fim else None,
                "limiteAlunos": aula.limite_alunos,
                "colaborador": {
                    "idColaborador": aula.colaborador.id_colaborador if aula.colaborador else None,
                    "nome": aula.colaborador.nome if aula.colaborador else None
                }
            })

    return jsonify({"aulas": aulas}), 200





from flask_jwt_extended import jwt_required, get_jwt_identity

@pilates.route('/listar_aulas', methods=['GET'])
@jwt_required()
def listar_aulas():
    try:
        colaborador_email = get_jwt_identity()  # Obtém o email do colaborador logado
        colaborador = Colaboradores.query.filter_by(email=colaborador_email).first()
        if not colaborador:
            return jsonify({"message": "Colaborador não encontrado."}), 404

        # Se for admin, exibe todas as aulas
        if colaborador.is_admin:
            aulas = Aulas.query.all()
        else:
            aulas = Aulas.query.filter_by(id_colaborador=colaborador.id_colaborador).all()

        aulas_list = []
        for aula in aulas:
            # Contando o número de alunos na aula
            num_alunos = len(aula.alunos)
            
            colaborador = aula.colaborador
            clinica = colaborador.clinica
            servico = colaborador.servicos[0] if colaborador.servicos else None

            aulas_list.append({
                'id_aula': aula.id_aula,
                'dia_semana': aula.dia_semana,
                'hora_inicio': aula.hora_inicio.strftime('%H:%M'),
                'hora_fim': aula.hora_fim.strftime('%H:%M'),
                'limite_alunos': aula.limite_alunos,
                'num_alunos': num_alunos,  # Número de alunos na aula
                'colaborador': {
                    'id_colaborador': colaborador.id_colaborador,
                    'nome': colaborador.nome,
                },
                'clinica': clinica.nome if clinica else None,
                'servico': servico.nome if servico else None
            })

        return jsonify(aulas_list)
    except Exception as e:
        db.session.rollback()
        response = jsonify({"message": str(e)})
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        return response, 500
    


@pilates.route('/excluir_aulas', methods=['DELETE'])
@jwt_required()
def excluir_aulas():
    try:
        data = request.get_json()
        aulas_ids = data.get('aulas_ids')

        if not aulas_ids or not isinstance(aulas_ids, list):
            return jsonify({"message": "Nenhuma aula informada para exclusão ou formato inválido."}), 400

        # Obtendo o colaborador logado
        colaborador_email = get_jwt_identity()
        colaborador = Colaboradores.query.filter_by(email=colaborador_email).first()
        if not colaborador:
            return jsonify({"message": "Colaborador não encontrado."}), 404

        # Percorre cada aula para excluir
        for id_aula in aulas_ids:
            aula = Aulas.query.filter_by(id_aula=id_aula).first()
            if not aula:
                return jsonify({"message": f"Aula com ID {id_aula} não encontrada."}), 404

            # Verifica se o colaborador é administrador ou o responsável pela aula
            if not colaborador.is_admin and aula.id_colaborador != colaborador.id_colaborador:
                return jsonify({"message": f"Você não tem permissão para excluir a aula {id_aula}."}), 403

            # Excluindo os registros relacionados na tabela AulasClientes
            AulasClientes.query.filter_by(id_aula=id_aula).delete()
            # Excluindo a aula
            db.session.delete(aula)

        db.session.commit()
        return jsonify({"message": "Aulas e seus relacionamentos excluídos com sucesso."}), 200

    except Exception as e:
        db.session.rollback()
        response = jsonify({"message": str(e)})
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        return response, 500


@pilates.route('/listar_aulas/clinica/<int:clinica_id>', methods=['GET'])
@jwt_required()
def listar_aulas_por_clinica(clinica_id):
    try:
        print(f"[DEBUG] Recebendo requisição para listar aulas da clínica ID: {clinica_id}")

        clinica = Clinicas.query.get(clinica_id)
        if not clinica:
            
            return jsonify({"message": "Clínica não encontrada."}), 404
        print(f"[DEBUG] Clínica encontrada: {clinica.nome}")

        # Buscar todos os colaboradores da clínica
        colaboradores = Colaboradores.query.filter_by(clinica_id=clinica_id).all()
        if not colaboradores:
            
            return jsonify({"message": "Nenhum colaborador encontrado para esta clínica."}), 404
        
        print(f"[DEBUG] {len(colaboradores)} colaborador(es) encontrado(s) na clínica {clinica.nome}.")
        # Buscar todas as aulas dos colaboradores dessa clínica
        aulas_list = []
        for colaborador in colaboradores:   
            aulas = Aulas.query.filter_by(id_colaborador=colaborador.id_colaborador).all()            

            for aula in aulas:
                num_alunos = len(aula.alunos)
                servico = colaborador.servicos[0] if colaborador.servicos else None

                aulas_list.append({
                    'id_aula': aula.id_aula,
                    'dia_semana': aula.dia_semana,
                    'hora_inicio': aula.hora_inicio.strftime('%H:%M'),
                    'hora_fim': aula.hora_fim.strftime('%H:%M'),
                    'limite_alunos': aula.limite_alunos,
                    'num_alunos': num_alunos,
                    'colaborador': {
                        'id_colaborador': colaborador.id_colaborador,
                        'nome': colaborador.nome,
                    },
                    'clinica': clinica.nome,
                    'servico': servico.nome if servico else None
                })

        print(f"[DEBUG] Total de aulas retornadas: {len(aulas_list)}")
        return jsonify(aulas_list)

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Erro ao listar aulas: {str(e)}")
        return jsonify({"message": str(e)}), 500




from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload
# Importe os modelos necessários: Aulas, Agendamentos, AulasClientes, etc.

# Dicionário para tradução dos dias da semana para português
dias_da_semana_pt = {
    'Monday': 'Segunda-feira',
    'Tuesday': 'Terça-feira',
    'Wednesday': 'Quarta-feira',
    'Thursday': 'Quinta-feira',
    'Friday': 'Sexta-feira',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo'
}

@pilates.route('/criar_agendamentos_aula/<int:aula_id>', methods=['POST'])
def criar_agendamentos_para_aula(aula_id):
    try:
        # Obtém a aula selecionada
        aula = Aulas.query.get(aula_id)
        if not aula:
            return jsonify({"message": "Aula não encontrada"}), 404

        # Obtém todos os alunos vinculados à aula
        alunos = aula.alunos
        if len(alunos) == 0:
            return jsonify({"message": "Não há alunos vinculados a esta aula."}), 400

        # Dados da aula
        dia_da_aula = aula.dia_semana  # Exemplo: "Segunda-feira"
        hora_inicio = aula.hora_inicio
        hora_fim = aula.hora_fim

        # Obter o primeiro dia do próximo mês
        hoje = datetime.today()
        if hoje.month < 12:
            primeiro_dia_proximo_mes = datetime(hoje.year, hoje.month + 1, 1)
        else:
            primeiro_dia_proximo_mes = datetime(hoje.year + 1, 1, 1)

        # Obtém o id do serviço e da clínica a partir do colaborador da aula
        servico_id = aula.colaborador.servicos[0].id_servico if aula.colaborador.servicos else None
        clinica_id = aula.colaborador.clinica.id_clinica if aula.colaborador.clinica else None

        # Contadores para informar quantos agendamentos foram criados ou ignorados
        agendamentos_criados = 0
        agendamentos_ignorados = 0

        # Para cada aluno vinculado à aula
        for cliente in alunos:
            # Obter os dias do próximo mês para o dia da semana desejado
            dias_agendados = obter_dias_do_mes(primeiro_dia_proximo_mes, dia_da_aula)
            for dia in dias_agendados:
                # Define a data e hora do agendamento (usando a hora de início da aula)
                data_e_hora_agendamento = dia.replace(
                    hour=hora_inicio.hour,
                    minute=hora_inicio.minute,
                    second=0,
                    microsecond=0
                )

                # Verifica se já existe um agendamento para este cliente nesse mesmo horário
                agendamento_existente = Agendamentos.query.filter_by(
                    data_e_hora=data_e_hora_agendamento,
                    id_cliente=cliente.id_cliente
                ).first()

                if agendamento_existente:
                    agendamentos_ignorados += 1
                    continue  # Pula a criação para este cliente

                # Traduz o dia da semana para português
                dia_em_portugues = dias_da_semana_pt[dia.strftime('%A')]

                # Cria o agendamento
                agendamento = Agendamentos(
                    data_e_hora=data_e_hora_agendamento,
                    dias_e_horarios=f"{dia_em_portugues} - {hora_inicio.strftime('%H:%M')} até {hora_fim.strftime('%H:%M')}",
                    id_cliente=cliente.id_cliente,
                    id_colaborador=aula.id_colaborador,
                    id_servico=servico_id,
                    id_clinica=clinica_id,
                    status="confirmado"
                )
                db.session.add(agendamento)
                agendamentos_criados += 1

        db.session.commit()
        message = f"Agendamentos criados com sucesso! Criados: {agendamentos_criados}."
        if agendamentos_ignorados > 0:
            message += f" {agendamentos_ignorados} agendamentos já existiam e foram ignorados."
        return jsonify({"message": message}), 200

    except Exception as e:
        db.session.rollback()
        response = jsonify({"message": str(e)})
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        return response, 500


def obter_dias_do_mes(data_inicial, dia_semana):
    """
    Retorna uma lista de datas (no próximo mês) correspondentes ao dia_semana informado.
    Por exemplo, se dia_semana for "Segunda-feira", retorna as segundas do próximo mês.
    """
    dias_da_semana = {
        'Segunda-feira': 0,
        'Terça-feira': 1,
        'Quarta-feira': 2,
        'Quinta-feira': 3,
        'Sexta-feira': 4,
        'Sábado': 5,
        'Domingo': 6
    }
    
    dia_semana_num = dias_da_semana.get(dia_semana)
    dias = []
    
    # Encontra o primeiro dia do mês que corresponda ao dia desejado
    data_atual = data_inicial
    while data_atual.weekday() != dia_semana_num:
        data_atual += timedelta(days=1)

    # Adiciona as datas correspondentes (supondo até 4 ocorrências no mês)
    for _ in range(4):
        dias.append(data_atual)
        data_atual += timedelta(weeks=1)

    return dias


from flask_jwt_extended import jwt_required, get_jwt_identity

@pilates.route('/cliente/minhas_aulas', methods=['GET'])
@jwt_required()
def listar_aulas_cliente():
    try:
        # Obtém o email do cliente logado a partir do token JWT
        cliente_email = get_jwt_identity()
        
        # Busca o cliente no banco de dados
        cliente = Clientes.query.filter_by(email=cliente_email).first()
        if not cliente:
            return jsonify({"message": "Cliente não encontrado."}), 404

        # Busca todas as aulas em que o cliente está matriculado
        aulas_cliente = AulasClientes.query.filter_by(id_cliente=cliente.id_cliente).all()

        # Lista para armazenar os dados das aulas
        aulas_list = []

        for aula_cliente in aulas_cliente:
            aula = Aulas.query.get(aula_cliente.id_aula)
            if not aula:
                continue  # Se a aula não existir, pula para a próxima

            colaborador = aula.colaborador
            clinica = colaborador.clinica if colaborador else None
            servico = colaborador.servicos[0] if colaborador and colaborador.servicos else None

            aulas_list.append({
                'id_aula': aula.id_aula,
                'dia_semana': aula.dia_semana,
                'hora_inicio': aula.hora_inicio.strftime('%H:%M'),
                'hora_fim': aula.hora_fim.strftime('%H:%M'),
                'limite_alunos': aula.limite_alunos,
                'num_alunos': len(aula.alunos),  # Número de alunos na aula
                'colaborador': {
                    'id_colaborador': colaborador.id_colaborador if colaborador else None,
                    'nome': colaborador.nome if colaborador else None,
                },
                'clinica': clinica.nome if clinica else None,
                'servico': servico.nome if servico else None,
                'data_inscricao': aula_cliente.data_inscricao.strftime('%Y-%m-%d %H:%M:%S')  # Data da inscrição
            })

        return jsonify(aulas_list), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Erro ao listar aulas do cliente: {str(e)}")
        return jsonify({"message": "Erro interno no servidor!"}), 500

from datetime import datetime, timedelta
import pytz
from flask import request, jsonify

# Define o fuso horário de Brasília
brt = pytz.timezone("America/Sao_Paulo")

@pilates.route('/criar_agendamentos_semana_atual/<int:cliente_id>', methods=['POST'])
@jwt_required()
def criar_agendamentos_semana_atual(cliente_id):
    try:
        # Verifica se o cliente existe
        cliente = Clientes.query.get(cliente_id)
        if not cliente:
            return jsonify({"message": "Cliente não encontrado!"}), 404

        data = request.get_json()
        id_aula = data.get("id_aula")  # Aula específica (opcional)

        # Recupera o plano associado ao cliente
        # Supondo que o objeto `cliente` tenha um atributo `plano_id`
        plano_id = cliente.plano_id  
        if not plano_id:
            return jsonify({"message": "Cliente não possui um plano cadastrado."}), 400

        hoje = datetime.now(brt)
        inicio_semana = (hoje - timedelta(days=hoje.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        fim_semana = (inicio_semana + timedelta(days=6)).replace(
            hour=23, minute=59, second=59, microsecond=999999
        )

        # Consulta as aulas do cliente na semana atual (filtrando por id_aula, se fornecido)
        query = AulasClientes.query.join(Aulas).filter(
            AulasClientes.id_cliente == cliente_id,
            Aulas.data.between(inicio_semana, fim_semana)
        )
        if id_aula:
            query = query.filter(AulasClientes.id_aula == id_aula)
        aulas_cliente = query.all()

        if not aulas_cliente:
            return jsonify({"message": "Nenhuma aula encontrada para esta semana!"}), 400

        # Criação dos agendamentos para cada aula encontrada
        for aula_cliente in aulas_cliente:
            aula = aula_cliente.aula

            data_aula = aula.data.astimezone(brt).replace(
                hour=aula.hora_inicio.hour,
                minute=aula.hora_inicio.minute,
                second=0,
                microsecond=0
            )

            # Verifica se já existe um agendamento para essa aula
            agendamento_existente = Agendamentos.query.filter_by(
                data_e_hora=data_aula,
                id_cliente=cliente_id
            ).first()
            if agendamento_existente:
                continue  # Pula se o agendamento já existir

            agendamento = Agendamentos(
                data_e_hora=data_aula,
                dias_e_horarios=f"{dias_da_semana_pt[data_aula.strftime('%A')]} - {aula.hora_inicio.strftime('%H:%M')} até {aula.hora_fim.strftime('%H:%M')}",
                id_cliente=cliente_id,
                id_colaborador=aula.id_colaborador,
                id_servico=aula.colaborador.servicos[0].id_servico if aula.colaborador.servicos else None,
                id_clinica=aula.colaborador.clinica.id_clinica if aula.colaborador.clinica else None,
                status="confirmado",
            )
            db.session.add(agendamento)

        db.session.commit()

        

        return jsonify({
            "message": "Agendamento(s) criado(s) com sucesso!",            
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao criar agendamentos: {str(e)}"}), 500



