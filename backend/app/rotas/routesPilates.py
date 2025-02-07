from flask import Blueprint, jsonify, request
from app.models import Aulas, Clientes, Colaboradores, Servicos, ColaboradoresServicos, AulasClientes, Clinicas, Agendamentos, Clientes, Aulas, db
from flask_jwt_extended import jwt_required, get_jwt_identity

pilates = Blueprint('pilates', __name__)

from datetime import datetime

@pilates.route('/adicionar_aula_pilates', methods=['POST'])
@jwt_required()
def adicionar_aula_pilates():
    try:
        # Recuperando os dados do request
        data = request.get_json()
        colaborador_email = get_jwt_identity()  # Obtém o email do colaborador logado
        servico_id = data.get('servico_id')  # ID do serviço (deve ser Pilates)
        dias_semana = data.get('dias_semana')  # Lista de dias
        hora_inicio = data.get('hora_inicio')
        hora_fim = data.get('hora_fim')
        limite_alunos = data.get('limite_alunos')  # Limite de alunos

        if limite_alunos is None:
            return jsonify({"message": "O campo 'limite_alunos' é obrigatório."}), 400
        
        # Convertendo hora_inicio e hora_fim para objetos time
        try:
            hora_inicio = datetime.strptime(hora_inicio, "%H:%M").time()
            hora_fim = datetime.strptime(hora_fim, "%H:%M").time()
        except ValueError:
            return jsonify({"message": "Formato de horário inválido. Use HH:MM."}), 400

        # Verificando se o colaborador existe e possui o email correto
        colaborador = Colaboradores.query.filter_by(email=colaborador_email).first()
        if not colaborador:
            print(f"Colaborador com email {colaborador_email} não encontrado.")  # Debug
            return jsonify({"message": "Colaborador nao encontrado."}), 404
        
        print(f"Colaborador encontrado: {colaborador.nome}, Admin: {colaborador.is_admin}")  # Debug

        # Verificando se o colaborador tem permissão de admin
        if colaborador.is_admin:
            # Se for admin, o admin pode usar o ID de colaborador fornecido no frontend
            id_colaborador = data.get('id_colaborador')  # ID do colaborador no frontend
            if not id_colaborador:
                return jsonify({"message": "O campo 'id_colaborador' é obrigatorio para administradores."}), 400
            
            colaborador_destino = Colaboradores.query.filter_by(id_colaborador=id_colaborador).first()
            if not colaborador_destino:
                return jsonify({"message": "Colaborador nao encontrado para o ID fornecido."}), 404
            id_colaborador = colaborador_destino.id_colaborador  # Usa o id do colaborador enviado
        else:
            # Se não for admin, usamos o id do colaborador logado
            id_colaborador = colaborador.id_colaborador

        # Verificando se o serviço é Pilates
        servico = Servicos.query.filter_by(id_servico=servico_id).first()
        if not servico or 'pilates' not in [tipo.tipo for tipo in servico.tipo_servicos]:
            return jsonify({"message": "Serviço invalido ou nao e Pilates."}), 400

        # Criando novas aulas para cada dia na lista de dias
        for dia in dias_semana:
            nova_aula = Aulas(
                id_colaborador=id_colaborador,
                dia_semana=dia,
                hora_inicio=hora_inicio,
                hora_fim=hora_fim,
                limite_alunos=limite_alunos
            )
            db.session.add(nova_aula)

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
        return jsonify({"message": "Aula nao encontrada!"}), 404

    # Verificando se o colaborador está associado à aula
    colaborador = aula.colaborador
    if not colaborador:
        return jsonify({"message": "Colaborador nao encontrado para esta aula!"}), 404

    # Verificando se o cliente existe
    cliente = Clientes.query.get(id_cliente)
    if not cliente:
        return jsonify({"message": "Cliente nao encontrado!"}), 404

    # Verificando se o cliente já está inscrito
    aluno_existente = AulasClientes.query.filter_by(id_cliente=id_cliente, id_aula=aula_id).first()
    if aluno_existente:
        return jsonify({"message": "Cliente ja inscrito nesta aula!"}), 400

    # Contando o número de alunos na aula
    total_alunos = AulasClientes.query.filter_by(id_aula=aula_id).count()

    if total_alunos >= aula.limite_alunos:
        return jsonify({"message": "O limite de alunos para esta aula foi atingido!"}), 400

    # Adicionando o cliente à aula
    nova_inscricao = AulasClientes(id_cliente=id_cliente, id_aula=aula_id)

    db.session.add(nova_inscricao)
    db.session.commit()

    return jsonify({"message": "Cliente adicionado com sucesso a aula!"}), 201
    
@pilates.route('/cliente/cadastrar_aula', methods=['POST'])
def cadastrar_aula_cliente():
    data = request.get_json()

    cliente_id = data.get('cliente_id')
    aula_id = data.get('aula_id')

    # Verificando se o cliente existe
    cliente = Clientes.query.get(cliente_id)
    if not cliente:
        return jsonify({"message": "Cliente nao encontrado!"}), 404

    # Verificando se a aula existe
    aula = Aulas.query.get(aula_id)
    if not aula:
        return jsonify({"message": "Aula nao encontrada!"}), 404

    # Verificando se o cliente já está inscrito
    aluno_existente = AulasClientes.query.filter_by(cliente_id=cliente_id, aula_id=aula_id).first()
    if aluno_existente:
        return jsonify({"message": "Cliente ja inscrito nesta aula!"}), 400

    # Adicionando a inscrição
    novo_inscricao = AulasClientes(cliente_id=cliente_id, aula_id=aula_id)
    db.session.add(novo_inscricao)
    db.session.commit()

    return jsonify({"message": "Cliente inscrito com sucesso na aula!"}), 201



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
    
@pilates.route('/excluir_aula/<int:id_aula>', methods=['DELETE'])
@jwt_required()
def excluir_aula(id_aula):
    try:
        # Obtendo o colaborador logado
        colaborador_email = get_jwt_identity()
        colaborador = Colaboradores.query.filter_by(email=colaborador_email).first()
        
        if not colaborador:
            return jsonify({"message": "Colaborador não encontrado."}), 404

        # Buscando a aula pelo ID
        aula = Aulas.query.filter_by(id_aula=id_aula).first()
        if not aula:
            return jsonify({"message": "Aula não encontrada."}), 404

        # Verificando se o colaborador é administrador ou o responsável pela aula
        if not colaborador.is_admin and aula.id_colaborador != colaborador.id_colaborador:
            return jsonify({"message": "Você não tem permissão para excluir esta aula."}), 403

        # Excluindo os alunos associados à aula
        AulasClientes.query.filter_by(id_aula=id_aula).delete()

        # Excluindo a aula
        db.session.delete(aula)
        db.session.commit()

        return jsonify({"message": "Aula e seus relacionamentos excluídos com sucesso."}), 200

    except Exception as e:
        db.session.rollback()
        response = jsonify({"message": str(e)})
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        return response, 500

from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload



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
        # Pegue a aula selecionada
        aula = Aulas.query.get(aula_id)
        if not aula:
            return jsonify({"message": "Aula nao encontrada"}), 404
        
        # Pegue todos os alunos vinculados à aula
        alunos = aula.alunos
        # Verificar se a lista de alunos não está vazia
        if len(alunos) == 0:
            return jsonify({"message": "Nao ha alunos vinculados a esta aula."}), 400
        
        # Calcular as datas para o próximo mês, nos dias da semana da aula
        dias_semana = aula.dia_semana  # Exemplo: "Segunda-feira"
        hora_inicio = aula.hora_inicio
        hora_fim = aula.hora_fim
        
        # Obter o primeiro dia do próximo mês
        hoje = datetime.today()
        primeiro_dia_proximo_mes = datetime(hoje.year, hoje.month + 1, 1) if hoje.month < 12 else datetime(hoje.year + 1, 1, 1)

        # Acessa o serviço e a clínica do colaborador da aula
        servico_id = aula.colaborador.servicos[0].id_servico if aula.colaborador.servicos else None
        clinica_id = aula.colaborador.clinica.id_clinica if aula.colaborador.clinica else None
        
        for cliente in alunos:
            # Calcular os dias da semana do próximo mês
            dias_agendados = obter_dias_do_mes(primeiro_dia_proximo_mes, dias_semana)
            for dia in dias_agendados:
                # Verificar se já existe um agendamento para esse dia e hora
                agendamento_existente = Agendamentos.query.filter_by(
                    data_e_hora=dia.replace(hour=hora_inicio.hour, minute=hora_inicio.minute, second=0, microsecond=0),
                    id_colaborador=aula.id_colaborador
                ).first()

                if agendamento_existente:
                    return jsonify({"message": f"Ja existe um agendamento para o colaborador nesse dia: {dia.strftime('%d/%m/%Y')}, {dias_da_semana_pt[dia.strftime('%A')]}."}), 400

                # Traduzir o dia da semana para português
                dia_em_portugues = dias_da_semana_pt[dia.strftime('%A')] 

                # Criar o agendamento
                agendamento = Agendamentos(
                    data_e_hora=dia.replace(hour=hora_inicio.hour, minute=hora_inicio.minute, second=0, microsecond=0),  # Ajuste para a hora de início
                    dias_e_horarios=f"{dia_em_portugues} - {hora_inicio.strftime('%H:%M')} até {hora_fim.strftime('%H:%M')}",  # Armazena o dia, hora de início e hora de fim
                    id_cliente=cliente.id_cliente,
                    id_colaborador=aula.id_colaborador,                    
                    id_servico=servico_id,  # Utiliza o id_servico do colaborador
                    id_clinica=clinica_id,  # Utiliza o id_clinica do colaborador
                    status="confirmado",
                )
                db.session.add(agendamento)

        # Commit para salvar os agendamentos no banco
        db.session.commit()
        
        return jsonify({"message": "Agendamentos criados com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        response = jsonify({"message": str(e)})
        response.headers["Content-Type"] = "application/json; charset=utf-8"
        return response, 500


def obter_dias_do_mes(data_inicial, dia_semana):
    """
    Função que retorna os dias específicos da semana para o próximo mês
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
    
    # Encontre o primeiro dia da semana correta
    data_atual = data_inicial
    while data_atual.weekday() != dia_semana_num:
        data_atual += timedelta(days=1)

    # Adicione todos os dias no próximo mês
    for i in range(4):  # Maximo de 4 semanas no mês
        dias.append(data_atual)
        data_atual += timedelta(weeks=1)

    return dias




