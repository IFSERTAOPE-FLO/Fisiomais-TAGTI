from flask import Blueprint, jsonify, request
from app.models import Colaboradores, Servicos, ColaboradoresServicos, Planos, db,TipoServico,  ServicosTipoServico  
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload

servicos= Blueprint('servicos', __name__)

"""
Rotas relacionadas aos serviços no sistema:

# Rotas GET:
1. '/listar_servicos' - Lista os serviços associados ao colaborador logado, incluindo informações sobre planos e tipos de serviço (pilates ou fisioterapia). Se o colaborador não for administrador, os serviços são filtrados pelos colaboradores atribuídos a ele.
2. '/listar_todos_servicos' - Lista todos os serviços do sistema, incluindo planos e tipos de serviço. O acesso é restrito a colaboradores autenticados.

# Rotas PUT:
1. '/editar_servico/<int:id_servico>' - Atualiza os dados de um serviço existente, incluindo nome, descrição e tipo. Caso o tipo de serviço seja alterado, a associação ao tipo de serviço anterior é removida e a nova associação é criada. Permite também atualizar os planos no caso de serviços do tipo 'pilates'.
    
# Rotas POST:
1. '/add_servico' - Cria um novo serviço, incluindo dados como nome, descrição, tipo de serviço, colaboradores e planos (se aplicável). Valida se todos os campos obrigatórios foram fornecidos antes de adicionar o serviço à base de dados.
2. '/adicionar_colaboradores' - Adiciona colaboradores a um serviço específico. Verifica se os colaboradores e o serviço existem, e garante que não haja duplicação na associação.
3. '/remover_colaboradores' - Remove colaboradores de um serviço específico, com validação dos IDs de serviço e colaboradores antes de proceder com a remoção.

# Rotas DELETE:
1. '/deletar_servico/<int:id>' - Deleta um serviço do sistema, removendo também as associações com colaboradores e excluindo os registros correspondentes.

Essas rotas utilizam autenticação JWT para garantir a segurança e implementam verificações rigorosas para garantir que as operações de criação, atualização, exclusão e associação sejam realizadas corretamente.
"""


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
                            "Valor": str(plano.valor),
                            "Quantidade_Aulas_Por_Semana": plano.quantidade_aulas_por_semana  # Novo campo
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

@servicos.route('/listar_todos_servicos', methods=['GET'])
@jwt_required()
def listar_todos_servicos():
    try:
        email = get_jwt_identity()
        colaborador = Colaboradores.query.filter_by(email=email).first()

        # Verifica se o usuário é um colaborador
        if not colaborador:
            return jsonify({"message": "Usuário não autorizado"}), 403

        # Carregar todos os serviços com planos e tipos de serviço
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
                            "Valor": str(plano.valor),
                            "Quantidade_Aulas_Por_Semana": plano.quantidade_aulas_por_semana  # Novo campo
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
                colaborador_servico = ColaboradoresServicos.query.filter_by(colaborador_id=colaborador.id_colaborador, servico_id=servico.id_servico).first()
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

        # Adicionar o serviço à sessão
        db.session.add(novo_servico)
        db.session.commit()  # Commit para gerar o id_servico

        # Buscar o tipo de serviço
        tipo_servico_obj = TipoServico.query.filter_by(tipo=tipo_servico).first()
        if not tipo_servico_obj:
            return jsonify({"error": f"Tipo de serviço '{tipo_servico}' não encontrado."}), 404

        # Associar o tipo de serviço ao novo serviço
        servico_tipo = ServicosTipoServico(servico_id=novo_servico.id_servico, tipo_servico_id=tipo_servico_obj.id_tipo_servico)
        db.session.add(servico_tipo)

        # Se o serviço for do tipo 'pilates', associar planos
        if tipo_servico == 'pilates' and planos:
            for plano_data in planos:
                novo_plano = Planos(
                    nome=plano_data.get('nome_plano'),
                    descricao=plano_data.get('descricao', ''),
                    valor=plano_data.get('valor'),
                    servico=novo_servico,  # Associando o plano ao serviço
                    quantidade_aulas_por_semana=plano_data.get('quantidade_aulas_por_semana', 1)  # Novo campo
                )
                db.session.add(novo_plano)

        # Associa colaboradores ao serviço, se existir
        if colaboradores_ids:
            colaboradores = Colaboradores.query.filter(Colaboradores.id_colaborador.in_(colaboradores_ids)).all()
            if len(colaboradores) != len(colaboradores_ids):
                return jsonify({"error": "Um ou mais colaboradores não encontrados."}), 404
            novo_servico.colaboradores = colaboradores

        db.session.commit()

        return jsonify({"message": "Serviço adicionado com sucesso!", "servico": novo_servico.id_servico}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao adicionar serviço: {str(e)}"}), 500


 
@servicos.route('/editar_servico/<int:id_servico>', methods=['PUT'])
@jwt_required()
def editar_servico(id_servico):
    try:
        email = get_jwt_identity()
        colaborador = Colaboradores.query.filter_by(email=email).first()

        # Verifica se o serviço existe
        servico = Servicos.query.get(id_servico)
        if not servico:
            return jsonify({"message": "Serviço não encontrado"}), 404

        # Atualiza os dados do serviço
        data = request.get_json()
        servico.nome = data.get('Nome_servico', servico.nome)
        servico.descricao = data.get('Descricao', servico.descricao)

        # Verifica o tipo de serviço
        tipo_servico = data.get('Tipo', servico.tipo_servicos[0].tipo if servico.tipo_servicos else None)

        # Verifica se está tentando alterar o tipo de fisioterapia para pilates ou vice-versa
        if tipo_servico != (servico.tipo_servicos[0].tipo if servico.tipo_servicos else None):
            if (servico.tipo_servicos[0].tipo == 'fisioterapia' and tipo_servico == 'pilates') or (servico.tipo_servicos[0].tipo == 'pilates' and tipo_servico == 'fisioterapia'):
                return jsonify({"message": "Não é possível alterar o tipo de serviço de Fisioterapia para Pilates ou de Pilates para Fisioterapia."}), 400

            # Remove a associação atual se o tipo foi alterado
            servico.tipo_servicos.clear()

            # Adiciona o novo tipo
            novo_tipo = TipoServico.query.filter_by(tipo=tipo_servico).first()
            if novo_tipo:
                servico.tipo_servicos.append(novo_tipo)

        # Atualiza o valor com base no tipo
        if tipo_servico == 'fisioterapia':
            servico.valor = data.get('Valor', servico.valor)  # Permite alterar o valor de fisioterapia
        elif tipo_servico == 'pilates':
            servico.valor = None  # O valor de pilates é controlado pelos planos

        # Atualiza os planos para o tipo pilates, caso seja o caso
        if tipo_servico == 'pilates' and 'Planos' in data:
            # Limpar planos antigos associados ao serviço
            planos_existentes = Planos.query.filter_by(servico_id=servico.id_servico).all()
            for plano in planos_existentes:
                db.session.delete(plano)
            
            # Adiciona os novos planos
            for plano_data in data['Planos']:
                novo_plano = Planos(
                    nome=plano_data['Nome_plano'],
                    valor=plano_data['Valor'],
                    servico_id=servico.id_servico,
                    descricao=plano_data.get('Descricao', ''),
                    quantidade_aulas_por_semana=plano_data.get('quantidade_aulas_por_semana', 1)  # Novo campo
                )
                db.session.add(novo_plano)

        # Salva as alterações no banco
        db.session.commit()
        return jsonify({"message": "Serviço atualizado com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao atualizar o serviço: {str(e)}"}), 500

   
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
    colaboradores = Colaboradores.query.filter(Colaboradores.id_colaborador.in_(colaboradores_ids)).all()
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
    colaboradores = Colaboradores.query.filter(Colaboradores.id_colaborador.in_(colaboradores_ids)).all()
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