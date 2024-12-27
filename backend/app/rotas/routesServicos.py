from flask import Blueprint, jsonify, request
from app.models import Colaboradores, Servicos, ColaboradoresServicos, db  # ColaboradoresServicos importado
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload

servicos= Blueprint('servicos', __name__)



@servicos.route('/listar_servicos', methods=['GET'])
@jwt_required()
def get_list_servicos():
    try:
        email = get_jwt_identity()
        colaborador = Colaboradores.query.filter_by(email=email).first()

        # Carregar os serviços com planos e tipos de serviço
        if colaborador:
            if not colaborador.is_admin:
                servicos = Servicos.query.filter(
                    Servicos.colaboradores.any(Colaboradores.id_colaborador == colaborador.id_colaborador)
                ).options(joinedload(Servicos.planos), joinedload(Servicos.tipo_servicos)).all()
            else:
                servicos = Servicos.query.options(joinedload(Servicos.planos), joinedload(Servicos.tipo_servicos)).all()
        else:
            servicos = Servicos.query.options(joinedload(Servicos.planos), joinedload(Servicos.tipo_servicos)).all()

        if not servicos:
            return jsonify({"message": "Nenhum serviço encontrado"}), 404

        servicos_list = []
        for s in servicos:
            colaboradores = [colaborador.nome for colaborador in s.colaboradores]
            planos = []
            for tipo in s.tipo_servicos:
                if tipo.tipo == 'pilates':
                    for plano in s.planos:
                        planos.append({
                            "ID_Plano": plano.id_plano,
                            "Nome_plano": plano.nome,
                            "Descricao": plano.descricao,
                            "Valor": str(plano.valor)
                        })
            
            servico_data = {
                "ID_Servico": s.id_servico,
                "Nome_servico": s.nome,
                "Descricao": s.descricao,
                "Valor": str(s.valor) if any(tipo.tipo == 'fisioterapia' for tipo in s.tipo_servicos) else None,
                "Planos": planos if any(tipo.tipo == 'pilates' for tipo in s.tipo_servicos) else None,
                "Tipos": [tipo.tipo for tipo in s.tipo_servicos],
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

        # Criar o novo serviço
        novo_servico = Servicos(
            nome=nome_servico,
            descricao=descricao,
            valor=valor if tipo_servico == 'fisioterapia' else None,
        )

        # Se o serviço for do tipo 'pilates', associar planos
        if tipo_servico == 'pilates' and planos:
            for plano_data in planos:
                novo_plano = Planos(
                    nome=plano_data.get('nome_plano'),
                    descricao=plano_data.get('descricao', ''),
                    valor=plano_data.get('valor'),
                    servico=novo_servico
                )
                db.session.add(novo_plano)

        # Associa colaboradores ao serviço, se existir
        if colaboradores_ids:
            colaboradores = Colaboradores.query.filter(Colaboradores.id_colaborador.in_(colaboradores_ids)).all()
            if len(colaboradores) != len(colaboradores_ids):
                return jsonify({"error": "Um ou mais colaboradores não encontrados."}), 404
            novo_servico.colaboradores = colaboradores

        db.session.add(novo_servico)
        db.session.commit()

        return jsonify({"message": "Serviço adicionado com sucesso!", "servico": novo_servico.id_servico}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao adicionar serviço: {str(e)}"}), 500



   
    
@servicos.route('/editar_servico/<tipo>/<int:id>', methods=['PUT'])
@jwt_required()
def editar_servico(tipo, id):
    try:
        data = request.get_json()
        
        # Verifica se o tipo de serviço é válido
        if tipo not in ['fisioterapia', 'pilates']:
            return jsonify({"error": "Tipo de serviço inválido"}), 400
        
        # Busca o serviço no banco de dados
        servico = Servicos.query.get(id)
        if not servico:
            return jsonify({"error": "Serviço não encontrado"}), 404

        # Atualiza os campos básicos do serviço
        servico.nome = data.get('nome_servico', servico.nome)
        servico.descricao = data.get('descricao', servico.descricao)

        # Se o tipo for fisioterapia, atualiza o valor
        if tipo == 'fisioterapia':
            servico.valor = data.get('valor', servico.valor)
            servico.planos = None  # Fisioterapia não tem planos
        else:
            # Se o tipo for Pilates, associar ou atualizar planos
            planos = data.get('planos', [])
            servico.valor = None  # Pilates não tem valor fixo, o valor vem dos planos

            if planos:
                # Limpa os planos atuais e adiciona os novos
                servico.planos = []
                for plano_data in planos:
                    novo_plano = Planos(
                        nome=plano_data.get('nome_plano'),
                        descricao=plano_data.get('descricao', ''),
                        valor=plano_data.get('valor'),
                        servico=servico
                    )
                    db.session.add(novo_plano)

        # Atualiza colaboradores se necessário
        colaboradores_ids = data.get('colaboradores_ids')
        if colaboradores_ids:
            colaboradores = Colaboradores.query.filter(Colaboradores.id_colaborador.in_(colaboradores_ids)).all()
            if len(colaboradores) != len(colaboradores_ids):
                return jsonify({"error": "Um ou mais colaboradores não encontrados."}), 404
            servico.colaboradores = colaboradores

        db.session.commit()
        return jsonify({"message": "Serviço atualizado com sucesso!", "servico": servico.id_servico}), 200

    except Exception as e:
        db.session.rollback()
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