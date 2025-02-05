from flask import Blueprint, jsonify, request
from app.models import Aulas, Clientes, Colaboradores, Servicos, ColaboradoresServicos, AulasClientes, Clinicas, db
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
        dia_semana = data.get('dia_semana')
        hora_inicio = data.get('hora_inicio')
        hora_fim = data.get('hora_fim')
        limite_alunos = data.get('limite_alunos')  # Obtendo o limite de alunos do frontend
        colaboradores_associados = data.get('colaboradores')  # Lista de colaboradores para associar à aula

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
            return jsonify({"message": "Colaborador não encontrado."}), 404
        
        print(f"Colaborador encontrado: {colaborador.nome}, Admin: {colaborador.is_admin}")  # Debug

        # Verificando se o colaborador tem permissão de admin
        if not colaborador.is_admin:
            return jsonify({"message": "Você não tem permissão para adicionar aulas."}), 403

        # Verificando se o serviço é Pilates
        servico = Servicos.query.filter_by(id_servico=servico_id).first()
        if not servico or 'pilates' not in [tipo.tipo for tipo in servico.tipo_servicos]:
            return jsonify({"message": "Serviço inválido ou não é Pilates."}), 400

        nova_aula = Aulas(
            id_colaborador=colaborador.id_colaborador,
            dia_semana=dia_semana,
            hora_inicio=hora_inicio,
            hora_fim=hora_fim,
            limite_alunos=limite_alunos
        )

        db.session.add(nova_aula)
        db.session.commit()

        # Associando colaboradores à aula
        for col_id in colaboradores_associados:
            colaborador_servico = ColaboradoresServicos.query.filter_by(colaborador_id=col_id, servico_id=servico_id).first()
            if colaborador_servico:
                nova_aula.colaboradores.append(Colaboradores.query.get(col_id))

        db.session.commit()

        return jsonify({"message": "Aula de Pilates criada com sucesso!", "aula_id": nova_aula.id_aula}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Erro: {str(e)}")  # Debug: Log do erro
        return jsonify({"message": f"Ocorreu um erro: {str(e)}"}), 500


    
@pilates.route('/cliente/cadastrar_aula', methods=['POST'])
def cadastrar_aula_cliente():
    data = request.get_json()

    cliente_id = data.get('cliente_id')
    aula_id = data.get('aula_id')

    # Verificando se o cliente existe
    cliente = Clientes.query.get(cliente_id)
    if not cliente:
        return jsonify({"message": "Cliente não encontrado!"}), 404

    # Verificando se a aula existe
    aula = Aulas.query.get(aula_id)
    if not aula:
        return jsonify({"message": "Aula não encontrada!"}), 404

    # Verificando se o cliente já está inscrito
    aluno_existente = AulasClientes.query.filter_by(cliente_id=cliente_id, aula_id=aula_id).first()
    if aluno_existente:
        return jsonify({"message": "Cliente já inscrito nesta aula!"}), 400

    # Adicionando a inscrição
    novo_inscricao = AulasClientes(cliente_id=cliente_id, aula_id=aula_id)
    db.session.add(novo_inscricao)
    db.session.commit()

    return jsonify({"message": "Cliente inscrito com sucesso na aula!"}), 201

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

    # Verificando se o cliente já está inscrito
    aluno_existente = AulasClientes.query.filter_by(id_cliente=id_cliente, id_aula=aula_id).first()
    if aluno_existente:
        return jsonify({"message": "Cliente já inscrito nesta aula!"}), 400

    # Adicionando o cliente à aula
    novo_inscricao = AulasClientes(id_cliente=id_cliente, id_aula=aula_id)

    db.session.add(novo_inscricao)
    db.session.commit()

    return jsonify({"message": "Cliente adicionado com sucesso à aula!"}), 201

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
        print(f"Email do colaborador: {colaborador_email}")  # Log de depuração

        colaborador = Colaboradores.query.filter_by(email=colaborador_email).first()
        if not colaborador:
            print("Colaborador não encontrado")  # Log de depuração
            return jsonify({"message": "Colaborador não encontrado."}), 404

        # Se for admin, exibe todas as aulas
        if colaborador.is_admin:
            print("Colaborador é admin. Buscando todas as aulas.")  # Log de depuração
            aulas = Aulas.query.all()
        else:
            print("Colaborador não é admin. Buscando aulas específicas.")  # Log de depuração
            aulas = Aulas.query.filter_by(id_colaborador=colaborador.id_colaborador).all()

        print(f"Aulas encontradas: {len(aulas)}")  # Log de depuração

        aulas_list = []
        for aula in aulas:
            print(f"Processando aula ID: {aula.id_aula}")  # Log de depuração
            colaborador = aula.colaborador
            clinica = colaborador.clinica
            servico = colaborador.servicos[0] if colaborador.servicos else None  # Pegando o primeiro serviço associado

            aulas_list.append({
                'id_aula': aula.id_aula,
                'dia_semana': aula.dia_semana,
                'hora_inicio': aula.hora_inicio.strftime('%H:%M'),
                'hora_fim': aula.hora_fim.strftime('%H:%M'),
                'limite_alunos': aula.limite_alunos,
                'colaborador': {
                    'id_colaborador': colaborador.id_colaborador,
                    'nome': colaborador.nome,
                },
                'clinica': clinica.nome if clinica else None,
                'servico': servico.nome if servico else None
            })

        print(f"Aulas formatadas para resposta: {len(aulas_list)}")  # Log de depuração
        return jsonify(aulas_list)
    except Exception as e:
        print(f"Erro: {str(e)}")  # Log de erro
        return jsonify({"message": f"Ocorreu um erro: {str(e)}"}), 500

