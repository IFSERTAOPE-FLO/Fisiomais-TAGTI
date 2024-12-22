from flask import Blueprint, jsonify, request
from app.models import Colaboradores, Servicos, ColaboradoresServicos, db  # ColaboradoresServicos importado
from flask_jwt_extended import jwt_required, get_jwt_identity


servicos= Blueprint('servicos', __name__)

@servicos.route('/listar_servicos', methods=['GET'])
@jwt_required()
def get_list_servicos():
    try:
        email = get_jwt_identity()  # Recupera o email do usuário autenticado
        colaborador = Colaboradores.query.filter_by(email=email).first()  # Busca o colaborador logado
        
        if colaborador:
            if colaborador.is_admin == False:  # Verifica se o colaborador é admin
                # Se não for admin, buscar serviços relacionados ao colaborador logado
                servicos = Servicos.query.filter(Servicos.colaboradores.any(ID_Colaborador=colaborador.ID_Colaborador)).all()
            else:
                # Se for admin, retorna todos os serviços
                servicos = Servicos.query.all()
        else:
            # Se não for um colaborador, retorna todos os serviços
            servicos = Servicos.query.all()

        if not servicos:
            return jsonify({"message": "Nenhum serviço encontrado"}), 404

        servicos_list = []
        for s in servicos:
            colaboradores = [colaborador.nome for colaborador in s.colaboradores]
            servico_data = {
                "ID_Servico": s.ID_Servico,
                "Nome_servico": s.Nome_servico,
                "Descricao": s.Descricao,
                "Valor": str(s.Valor) if s.tipo_servico == 'fisioterapia' else None,
                "Planos": s.planos if s.tipo_servico == 'pilates' else None,
                "Tipo": s.tipo_servico,
                "Colaboradores": colaboradores
            }
            servicos_list.append(servico_data)

        return jsonify(servicos_list), 200
    except Exception as e:
        return jsonify({"message": f"Erro ao listar serviços: {str(e)}"}), 500


@servicos.route('/deletar_servico/<int:id>', methods=['DELETE'])
@jwt_required()
def deletar_servico(id):
    try:
        servico = Servicos.query.get(id)

        if not servico:
            return jsonify({"message": "Serviço não encontrado"}), 404

        # Remover os relacionamentos entre colaboradores e serviço
        if servico.colaboradores:
            for colaborador in servico.colaboradores:
                # Deletar a entrada na tabela de junção 'colaboradores_servicos'
                colaborador_servico = ColaboradoresServicos.query.filter_by(ID_Colaborador=colaborador.ID_Colaborador, ID_Servico=servico.ID_Servico).first()
                if colaborador_servico:
                    db.session.delete(colaborador_servico)

        # Agora, deletar o próprio serviço
        db.session.delete(servico)
        db.session.commit()

        return jsonify({"message": "Serviço e seus relacionamentos com colaboradores deletados com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao deletar serviço: {str(e)}"}), 500


    
@servicos.route('/add_servico', methods=['POST'])
def add_servico():
    try:
        data = request.get_json()
        nome_servico = data.get('nome_servico')
        descricao = data.get('descricao')
        valor = data.get('valor')
        tipo_servico = data.get('tipo_servico')
        colaboradores_ids = data.get('colaboradores_ids')
        planos = data.get('planos')

        if not nome_servico or not descricao or not tipo_servico:
            return jsonify({"error": "Nome, descrição e tipo de serviço são obrigatórios."}), 400

        # Incrementar automaticamente o ID_Plano
        if tipo_servico == 'pilates' and planos:
            for index, plano in enumerate(planos, start=1):
                plano['ID_Plano'] = index

        novo_servico = Servicos(
            Nome_servico=nome_servico,
            Descricao=descricao,
            Valor=valor if tipo_servico == 'fisioterapia' else None,
            tipo_servico=tipo_servico,
            planos=planos if tipo_servico == 'pilates' else None
        )

        if colaboradores_ids:
            colaboradores = Colaboradores.query.filter(Colaboradores.ID_Colaborador.in_(colaboradores_ids)).all()
            if len(colaboradores) != len(colaboradores_ids):
                return jsonify({"error": "Um ou mais colaboradores não encontrados."}), 404
            novo_servico.colaboradores = colaboradores

        db.session.add(novo_servico)
        db.session.commit()

        return jsonify({"message": "Serviço adicionado com sucesso!", "servico": novo_servico.to_dict()}), 201

    except Exception as e:
        return jsonify({"error": f"Erro ao adicionar serviço: {str(e)}"}), 500


   
    
@servicos.route('/editar_servico/<tipo>/<int:id>', methods=['PUT'])
@jwt_required()
def editar_servico(tipo, id):
    data = request.get_json()
    
    # Verifica se o tipo de serviço é válido
    if tipo not in ['fisioterapia', 'pilates']:
        return jsonify({"error": "Tipo de serviço inválido"}), 400
    
    # Busca o serviço no banco de dados
    servico = Servicos.query.get(id)
    if not servico:
        return jsonify({"error": "Serviço não encontrado"}), 404

    # Atualiza os campos básicos do serviço
    servico.Nome_servico = data.get('Nome_servico', servico.Nome_servico)
    servico.Descricao = data.get('Descricao', servico.Descricao)
    servico.Valor = data.get('Valor', servico.Valor)
    
    # Atualiza o tipo de serviço
    servico.tipo_servico = tipo
    
    # Se for o tipo Pilates, verifica e atualiza os planos
    if tipo == 'pilates':
        planos = data.get('Planos')
        if not planos or not isinstance(planos, list):
            return jsonify({"error": "Planos são obrigatórios e devem ser uma lista para serviços de Pilates"}), 400
        
        # Atualiza os planos
        for plano in planos:
            if 'Nome_plano' not in plano or 'Valor' not in plano:
                return jsonify({"error": "Cada plano deve conter 'Nome_plano' e 'Valor'"}), 400
        servico.planos = planos
    else:
        # Se o tipo não for Pilates, limpa os planos
        servico.planos = None

    try:
        db.session.commit()
        return jsonify({"message": "Serviço atualizado com sucesso!", "servico": servico.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        # Log do erro no console para depuração
        print(f"Erro ao atualizar serviço: {e}")
        return jsonify({"error": f"Erro ao atualizar serviço: {str(e)}"}), 500
    
@servicos.route('/adicionar_colaboradores', methods=['POST'])
def adicionar_colaboradores():
    data = request.get_json()
    servico_id = data.get('servico_id')
    colaboradores_ids = data.get('colaboradores_ids')

    if not servico_id or not colaboradores_ids:
        return jsonify({"error": "Servico ID e Colaboradores IDs são necessários"}), 400

    # Buscar o serviço pelo ID
    servico = Servicos.query.get(servico_id)
    if not servico:
        return jsonify({"error": "Serviço não encontrado"}), 404

    # Buscar os colaboradores pelo ID
    colaboradores = Colaboradores.query.filter(Colaboradores.ID_Colaborador.in_(colaboradores_ids)).all()
    if len(colaboradores) != len(colaboradores_ids):
        return jsonify({"error": "Alguns colaboradores não foram encontrados"}), 404

    # Adicionar os colaboradores ao serviço
    for colaborador in colaboradores:
        # Verifica se o relacionamento já existe para evitar duplicação
        if colaborador not in servico.colaboradores:
            servico.colaboradores.append(colaborador)

    try:
        db.session.commit()
        return jsonify({"message": "Colaboradores adicionados ao serviço com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao adicionar colaboradores: {str(e)}"}), 500
    
@servicos.route('/remover_colaboradores', methods=['POST'])
def remover_colaboradores():
    data = request.get_json()
    servico_id = data.get('servico_id')
    colaboradores_ids = data.get('colaboradores_ids')

    if not servico_id or not colaboradores_ids:
        return jsonify({"error": "Servico ID e Colaboradores IDs são necessários"}), 400

    # Buscar o serviço pelo ID
    servico = Servicos.query.get(servico_id)
    if not servico:
        return jsonify({"error": "Serviço não encontrado"}), 404

    # Buscar os colaboradores pelo ID
    colaboradores = Colaboradores.query.filter(Colaboradores.ID_Colaborador.in_(colaboradores_ids)).all()
    if len(colaboradores) != len(colaboradores_ids):
        return jsonify({"error": "Alguns colaboradores não foram encontrados"}), 404

    # Remover os colaboradores do serviço
    for colaborador in colaboradores:
        if colaborador in servico.colaboradores:
            servico.colaboradores.remove(colaborador)

    try:
        db.session.commit()
        return jsonify({"message": "Colaboradores removidos do serviço com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao remover colaboradores: {str(e)}"}), 500


@servicos.route('/remover_plano/<int:servico_id>/<int:plano_id>', methods=['DELETE'])
def remover_plano(servico_id, plano_id):
    try:
        # Encontra o serviço pelo ID
        servico = Servicos.query.get(servico_id)
        if not servico:
            return jsonify({"error": "Serviço não encontrado"}), 404

        # Filtra os planos associados ao serviço
        planos = servico.planos or []
        planos_restantes = [plano for plano in planos if plano.get('ID_Plano') != plano_id]

        if len(planos) == len(planos_restantes):
            return jsonify({"error": "Plano não encontrado"}), 404

        # Atualiza os planos do serviço
        servico.planos = planos_restantes
        db.session.commit()
        return jsonify({"message": "Plano removido com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500