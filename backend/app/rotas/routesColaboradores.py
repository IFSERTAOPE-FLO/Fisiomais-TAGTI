from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from app.models import Horarios, Colaboradores, Clinicas, Enderecos, Clientes, db
from app.utils import is_cpf_valid
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

colaboradores = Blueprint('colaboradores', __name__)

"""
Rotas relacionadas a colaboradores no sistema:

# Rotas GET:
1. '/listar' - Retorna uma lista de colaboradores disponíveis para o serviço solicitado, com a possibilidade de filtrar por clínica, se fornecido.
2. '/colaboradoresdisponiveis' - Retorna a lista de colaboradores alocados e disponíveis para o serviço solicitado, levando em consideração o tipo de usuário (admin ou colaborador comum).
3. '/horarios/listar/<int:colaborador_id>' - Retorna os horários cadastrados para o colaborador especificado, incluindo o dia da semana e o intervalo de horas.

# Rotas PUT:
1. '/alterar_clinica' - Permite a alteração da clínica associada a um colaborador, atualizando o campo `clinica_id`.
2. '/configurar_horarios' - Configura os horários de trabalho para um colaborador, permitindo definir múltiplos horários, e remove conflitos de horários existentes.
   
Essas rotas utilizam autenticação JWT para garantir a segurança, incluem validações de entrada para garantir que as informações sejam consistentes, e interagem com o banco de dados para realizar as operações nos colaboradores e seus horários.
"""


from datetime import datetime

@colaboradores.route('/register', methods=['POST'])
@jwt_required()
def register_or_update_colaborador():
    try:
        data = request.get_json()

        colaborador_id = data.get('colaborador_id')  # Para distinguir registro e atualização
        clinica_id = data.get('clinica_id')  # ID da clínica associado

        # Dados do colaborador
        nome = data.get('nome')
        email = data.get('email')
        senha = data.get('senha')
        telefone = data.get('telefone')
        cpf = data.get('cpf')
        referencias = data.get('referencias', '')
        cargo = data.get('cargo', '')
        dt_nasc = data.get('dt_nasc')  # A data de nascimento
        sexo = data.get('sexo')  # Novo campo
        is_admin = data.get('is_admin', False)

        # Verificar se dt_nasc é uma string e convertê-la para um objeto date
        if dt_nasc:
            try:
                dt_nasc = datetime.strptime(dt_nasc, "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"error": "Formato de data inválido para 'dt_nasc'. Utilize o formato YYYY-MM-DD."}), 400

        # Dados de endereço
        endereco_data = data.get('endereco', {})
        rua = endereco_data.get('rua', '')
        numero = endereco_data.get('numero', '')
        bairro = endereco_data.get('bairro', '')
        cidade = endereco_data.get('cidade', '')
        estado = endereco_data.get('estado', '')

        # Verificar se é uma atualização
        if colaborador_id:
            colaborador = Colaboradores.query.get(colaborador_id)

            if not colaborador:
                return jsonify({"error": "Colaborador não encontrado."}), 404

            if cpf and not is_cpf_valid(cpf):
                return jsonify({"error": "CPF inválido."}), 400

            # Atualizar os campos fornecidos
            colaborador.nome = nome or colaborador.nome
            colaborador.email = email or colaborador.email
            colaborador.telefone = telefone or colaborador.telefone
            colaborador.cpf = cpf or colaborador.cpf
            colaborador.referencias = referencias or colaborador.referencias
            colaborador.cargo = cargo or colaborador.cargo
            colaborador.dt_nasc = dt_nasc or colaborador.dt_nasc
            colaborador.sexo = sexo or colaborador.sexo  # Atualizando sexo
            colaborador.is_admin = is_admin

            if senha:
                colaborador.senha = generate_password_hash(senha)

            if clinica_id:
                clinica = Clinicas.query.get(clinica_id)
                if not clinica:
                    return jsonify({"error": "Clínica não encontrada."}), 404
                colaborador.clinica_id = clinica_id

            # Atualizar endereço
            if any([rua, numero, bairro, cidade, estado]):
                if not colaborador.endereco:
                    colaborador.endereco = Enderecos()
                colaborador.endereco.rua = rua or colaborador.endereco.rua
                colaborador.endereco.numero = numero or colaborador.endereco.numero
                colaborador.endereco.bairro = bairro or colaborador.endereco.bairro
                colaborador.endereco.cidade = cidade or colaborador.endereco.cidade
                colaborador.endereco.estado = estado or colaborador.endereco.estado

            db.session.commit()
            return jsonify({"message": "Colaborador atualizado com sucesso!"}), 200

        # Registro de um novo colaborador
        if not all([nome, email, senha, cpf]):
            return jsonify({"error": "Os campos nome, email, senha e CPF são obrigatórios."}), 400

        if not is_cpf_valid(cpf):
            return jsonify({"error": "CPF inválido."}), 400

       # Verificar se o email, telefone ou CPF já estão cadastrados como cliente ou colaborador
        if (Clientes.query.filter(
                (Clientes.email == email) | 
                (Clientes.telefone == telefone) | 
                (Clientes.cpf == cpf)
            ).first()) or (Colaboradores.query.filter(
                (Colaboradores.email == email) | 
                (Colaboradores.telefone == telefone) | 
                (Colaboradores.cpf == cpf)
            ).first()):
            return jsonify({"error": "Email, telefone ou CPF já cadastrado."}), 400

        hashed_password = generate_password_hash(senha)

        endereco = None
        if any([rua, numero, bairro, cidade, estado]):
            endereco = Enderecos(rua=rua, numero=numero, bairro=bairro, cidade=cidade, estado=estado)
            db.session.add(endereco)
            db.session.commit()

        new_colaborador = Colaboradores(
            nome=nome,
            email=email,
            telefone=telefone,
            senha=hashed_password,
            cpf=cpf,
            referencias=referencias,
            cargo=cargo,
            dt_nasc=dt_nasc,
            sexo=sexo,  # Novo campo
            endereco=endereco,
            is_admin=is_admin
        )
        # Dados de photo e admin_nivel
        photo = data.get('photo', None)  # Ou algum valor padrão se desejado
        admin_nivel = data.get('admin_nivel', None)  # Definir o nível, caso não enviado

        # No caso de atualização, você pode deixar esses valores como None se não forem fornecidos:
        if colaborador_id:
            # Atualizar os campos fornecidos
            colaborador.photo = photo or colaborador.photo  # Atualiza se fornecido, senão mantém o valor antigo
            colaborador.admin_nivel = admin_nivel or colaborador.admin_nivel  # O mesmo para admin_nivel


        if clinica_id:
            clinica = Clinicas.query.get(clinica_id)
            if not clinica:
                return jsonify({"error": "Clínica não encontrada."}), 404
            new_colaborador.clinica_id = clinica_id

        db.session.add(new_colaborador)
        db.session.commit()
        return jsonify({"message": "Colaborador registrado com sucesso!"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao processar solicitação: {str(e)}"}), 500



@colaboradores.route('/listar', methods=['GET'])
def get_colaboradores():
    servico_id = request.args.get('servico_id')
    clinica_id = request.args.get('clinica_id')  # Novo parâmetro para filtrar pela clínica
    if not servico_id:
        return jsonify({"error": "Servico ID é necessário"}), 400
    
    query = Colaboradores.query.filter(
        Colaboradores.servicos.any(id_servico=servico_id),
        Colaboradores.is_admin == False
    )
    
    # Se uma clínica foi fornecida, filtra também pelos colaboradores dessa clínica
    if clinica_id:
        query = query.filter(Colaboradores.clinica_id == clinica_id)
    
    colaboradores = query.all()
    
    if not colaboradores:
        return jsonify({"message": "Nenhum colaborador encontrado para o serviço solicitado"}), 404
    
    colaboradores_list = [{"id_colaborador": c.id_colaborador, "nome": c.nome} for c in colaboradores]
    return jsonify(colaboradores_list)




@colaboradores.route('/colaboradoresdisponiveis', methods=['GET'])  # Aceitando apenas 'GET'
@jwt_required()
def get_colaboradoresdisponiveis():
    try:
        # Obtendo o parâmetro 'servico_id' da query string
        servico_id = request.args.get("servico_id")

        if not servico_id:
            return jsonify({"error": "Servico ID é necessário"}), 400

        # Obtendo a identidade do usuário autenticado
        current_user_id = get_jwt_identity()
        current_user = Colaboradores.query.filter_by(email=current_user_id).first()  # Verificação por email

        if not current_user:
            return jsonify({"error": "Usuário não encontrado."}), 404

        if current_user.is_admin:
            # Administrador pode acessar todos os colaboradores
            colaboradores_alocados = Colaboradores.query.filter(
                Colaboradores.servicos.any(id_servico=servico_id)
            ).all()
            colaboradores_disponiveis = Colaboradores.query.filter(
                ~Colaboradores.servicos.any(id_servico=servico_id)
            ).all()
        else:
            # Colaborador comum vê apenas a si mesmo
            colaboradores_alocados = Colaboradores.query.filter(
                Colaboradores.servicos.any(id_servico=servico_id),
                Colaboradores.id_colaborador == current_user.id_colaborador
            ).all()
            colaboradores_disponiveis = Colaboradores.query.filter(
                ~Colaboradores.servicos.any(id_servico=servico_id),
                Colaboradores.id_colaborador == current_user.id_colaborador  # Exibindo apenas o próprio colaborador
            ).all()

        # Formatando os resultados
        colaboradores_alocados_list = [
            {"id_colaborador": c.id_colaborador, "nome": c.nome} for c in colaboradores_alocados
        ]
        colaboradores_disponiveis_list = [
            {"id_colaborador": c.id_colaborador, "nome": c.nome} for c in colaboradores_disponiveis
        ]

        return jsonify({
            "alocados": colaboradores_alocados_list,
            "disponiveis": colaboradores_disponiveis_list
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500







    




@colaboradores.route('/horarios/configurar', methods=['POST'])
@jwt_required()
def configurar_horarios():
    try:
        data = request.get_json()
        colaborador_id = data.get('colaborador_id')
        horarios_data = data.get('horarios')

        for horario in horarios_data:
            dia_semana = horario['dia_semana']
            hora_inicio_str = horario['hora_inicio']
            hora_fim_str = horario['hora_fim']

            # Converter as strings de hora para objetos de time
            hora_inicio = datetime.strptime(hora_inicio_str, '%H:%M').time()
            hora_fim = datetime.strptime(hora_fim_str, '%H:%M').time()

            # Verificar se já existe um horário para o colaborador no mesmo dia
            horarios_existentes = Horarios.query.filter_by(id_colaborador=colaborador_id, dia_semana=dia_semana).all()

            for horario_existente in horarios_existentes:
                # Verificar se há conflito de horários
                if (hora_inicio < horario_existente.hora_fim and hora_fim > horario_existente.hora_inicio):
                    # Se houver conflito, apagar o horário existente
                    db.session.delete(horario_existente)

            # Criar e salvar o novo horário
            novo_horario = Horarios(
                id_colaborador=colaborador_id,
                dia_semana=dia_semana,
                hora_inicio=hora_inicio,
                hora_fim=hora_fim
            )
            db.session.add(novo_horario)

        db.session.commit()
        return jsonify({"message": "Horário configurado com sucesso!"}), 200

    except Exception as e:
        return jsonify({"message": f"Erro ao configurar horário: {str(e)}"}), 500






@colaboradores.route('/horarios/listar/<int:colaborador_id>', methods=['GET'])
@jwt_required()
def listar_horarios(colaborador_id):
    try:
        # Buscar horários do colaborador
        horarios = Horarios.query.filter_by(id_colaborador=colaborador_id).all()
        if not horarios:
            return jsonify({"message": "Nenhum horário encontrado para o colaborador."}), 404

        # Converter para JSON
        horarios_list = [
            {
                "dia_semana": horario.dia_semana,
                "hora_inicio": horario.hora_inicio.strftime('%H:%M'),
                "hora_fim": horario.hora_fim.strftime('%H:%M')
            }
            for horario in horarios
        ]
        return jsonify({"horarios": horarios_list}), 200

    except Exception as e:
        return jsonify({"message": f"Erro ao listar horários: {str(e)}"}), 500

@colaboradores.route('/alterar_clinica', methods=['PUT'])
@jwt_required()
def alterar_clinica():
    data = request.get_json()

    colaborador_id = data.get('colaborador_id')
    clinica_id = data.get('clinica_id')

    # Verificar se os parâmetros necessários foram fornecidos
    if not colaborador_id or not clinica_id:
        return jsonify({"error": "Os parâmetros colaborador_id e clinica_id são necessários."}), 400

    # Buscar o colaborador pelo ID
    colaborador = Colaboradores.query.get(colaborador_id)

    if not colaborador:
        return jsonify({"error": "Colaborador não encontrado."}), 404

    # Verificar se a clínica existe
    clinica = Clinicas.query.get(clinica_id)

    if not clinica:
        return jsonify({"error": "Clínica não encontrada."}), 404

    # Alterar a clínica do colaborador
    colaborador.clinica_id = clinica_id

    try:
        # Commit as alterações no banco de dados
        db.session.commit()
        return jsonify({"message": "Clínica alterada com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erro ao alterar clínica: {str(e)}"}), 500


#rota para exibir todos os colaboradores
@colaboradores.route('/todos', methods=['GET'])
def listar_todos_colaboradores():
    try:
        # Buscar todos os colaboradores no banco de dados
        colaboradores = Colaboradores.query.all()

        if not colaboradores:
            return jsonify({"message": "Nenhum colaborador encontrado."}), 404

        # Converter os dados em uma lista de dicionários
        colaboradores_list = [
            {
                "id_colaborador": colaborador.id_colaborador,
                "nome": colaborador.nome,
                "email": colaborador.email,
                "telefone": colaborador.telefone,
                "cpf": colaborador.cpf,
                "cargo": colaborador.cargo,
                "clinica_id": colaborador.clinica_id,
                "dt_nasc": colaborador.dt_nasc.strftime('%Y-%m-%d') if colaborador.dt_nasc else None,
                "sexo": colaborador.sexo,
                "is_admin": colaborador.is_admin,
                "endereco": {
                    "rua": colaborador.endereco.rua if colaborador.endereco else None,
                    "numero": colaborador.endereco.numero if colaborador.endereco else None,
                    "bairro": colaborador.endereco.bairro if colaborador.endereco else None,
                    "cidade": colaborador.endereco.cidade if colaborador.endereco else None,
                    "estado": colaborador.endereco.estado if colaborador.endereco else None,
                },
            }
            for colaborador in colaboradores
        ]

        # Retornar a lista de colaboradores
        return jsonify(colaboradores_list), 200

    except Exception as e:
        return jsonify({"error": f"Erro ao listar colaboradores: {str(e)}"}), 500
