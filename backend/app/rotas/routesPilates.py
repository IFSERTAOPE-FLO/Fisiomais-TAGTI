from flask import Blueprint, jsonify, request
from app.models import Aulas, Pagamentos, Clientes, Colaboradores, Servicos, Planos, ColaboradoresServicos, AulasClientes, Clinicas, Agendamentos, Clientes, Aulas, db
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

    # Gerando pagamento mensal com base no plano do cliente
    resultado_pagamento = gerar_pagamento_mensal(cliente.id_cliente, cliente.plano_id)

    # Retornar a resposta do pagamento caso haja erro
    if resultado_pagamento["status"] != 201:
        return jsonify(resultado_pagamento), resultado_pagamento["status"]

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

        cliente = Clientes.query.get(cliente_id)
        if not cliente:
            return jsonify({"message": "Cliente não encontrado!"}), 404

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

        data_inicio_semana = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
        aulas_semana_atual = AulasClientes.query.join(Aulas).filter(
            AulasClientes.id_cliente == cliente_id,
            Aulas.data >= data_inicio_semana
        ).count()

        if aulas_semana_atual + len(aulas_selecionadas) > plano.quantidade_aulas_por_semana:
            return jsonify({"message": f"Limite de {plano.quantidade_aulas_por_semana} aulas semanais excedido!"}), 400

        for aula_id in aulas_selecionadas:
            aula = Aulas.query.get(aula_id)
            if not aula:
                return jsonify({"message": f"Aula ID {aula_id} não encontrada!"}), 404

            if AulasClientes.query.filter_by(id_cliente=cliente_id, id_aula=aula_id).first():
                return jsonify({"message": f"Cliente já está inscrito na aula ID {aula_id}!"}), 400

            if len(aula.alunos) >= aula.limite_alunos:
                return jsonify({"message": f"Aula ID {aula_id} lotada!"}), 400

            nova_inscricao = AulasClientes(
                id_cliente=cliente_id,
                id_aula=aula_id,
                data_inscricao=datetime.utcnow()
            )
            db.session.add(nova_inscricao)

        db.session.commit()
        resultado_pagamento = gerar_pagamento_mensal(cliente_id, plano_id)
        # Retornar a resposta do pagamento caso haja erro
        if resultado_pagamento["status"] != 201:
            return jsonify(resultado_pagamento), resultado_pagamento["status"]


        # 🔹 **Chamada da nova rota após a inscrição**
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



from datetime import datetime, timedelta

def gerar_pagamento_mensal(cliente_id, plano_id):
    try:
        if not cliente_id or not plano_id:
            return {"message": "Dados incompletos!", "status": 400}

        cliente = Clientes.query.get(cliente_id)
        if not cliente:
            return {"message": "Cliente não encontrado!", "status": 404}

        plano = Planos.query.get(plano_id)
        if not plano:
            return {"message": "Plano não encontrado!", "status": 404}

        # Verificar se já existe um pagamento no último mês
        um_mes_atras = datetime.utcnow() - timedelta(days=30)
        pagamento_existente = Pagamentos.query.filter(
            Pagamentos.id_cliente == cliente_id,
            Pagamentos.id_plano == plano_id,
            Pagamentos.data_pagamento >= um_mes_atras
        ).first()

        if pagamento_existente:
            return {"message": "Pagamento já realizado neste mês.", "status": 200}

        # Criar novo pagamento
        novo_pagamento = Pagamentos(
            id_cliente=cliente_id,
            id_plano=plano_id,
            id_servico=plano.servico_id,
            valor=plano.valor,
            metodo_pagamento='a definir',
            status='pendente',
            data_pagamento=datetime.utcnow()
        )
        db.session.add(novo_pagamento)
        db.session.commit()

        return {"message": "Pagamento gerado com sucesso!", "status": 201, "id_pagamento": novo_pagamento.id_pagamento}
    
    except Exception as e:
        db.session.rollback()
        return {"message": f"Erro ao gerar pagamento: {str(e)}", "status": 500}
