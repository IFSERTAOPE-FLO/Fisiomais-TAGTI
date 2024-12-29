from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from app.models import Horarios, Colaboradores,Clinicas, db
from app.utils import is_cpf_valid  # Função de validação de CPF, que pode ser movida para utils
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime

colaboradores = Blueprint('colaboradores', __name__)

@colaboradores.route('/register', methods=['POST'])
def register_colaborador():
    data = request.get_json()

    # Capturar os dados do colaborador
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')
    telefone = data.get('telefone')
    cpf = data.get('cpf')
    referencias = data.get('referencias', '')
    cargo = data.get('cargo', '')
    endereco = data.get('endereco', '')
    rua = data.get('rua', '')
    estado = data.get('estado', '')
    cidade = data.get('cidade', '')
    bairro = data.get('bairro', '')
    is_admin = data.get('is_admin', False)  # Booleano para determinar se é admin

    # Validar campos obrigatórios
    if not all([nome, email, senha, cpf]):
        return jsonify({"message": "Os campos nome, email, senha e CPF são obrigatórios."}), 400

    # Validar CPF
    if not is_cpf_valid(cpf):
        return jsonify({"message": "CPF inválido."}), 400

    # Verificar se o email, telefone ou CPF já existe
    if Colaboradores.query.filter(
        (Colaboradores.email == email) | 
        (Colaboradores.telefone == telefone) | 
        (Colaboradores.cpf == cpf)
    ).first():
        return jsonify({"message": "Email, telefone ou CPF já cadastrado."}), 400

    # Criptografar a senha
    hashed_password = generate_password_hash(senha)

    # Criar um novo colaborador
    new_colaborador = Colaboradores(
        nome=nome,
        email=email,
        telefone=telefone,
        senha=hashed_password,
        cpf=cpf,
        referencias=referencias,
        cargo=cargo,
        endereco=endereco,
        rua=rua,
        estado=estado,
        cidade=cidade,
        bairro=bairro,
        is_admin=is_admin
    )

    try:
        # Salvar no banco de dados
        db.session.add(new_colaborador)
        db.session.commit()
        return jsonify({"message": "Colaborador registrado com sucesso!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao registrar colaborador: {str(e)}"}), 500


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


@colaboradores.route('/colaboradoresdisponiveis', methods=['GET'])
def get_colaboradoresdisponiveis():
    servico_id = request.args.get('servico_id')
    if not servico_id:
        return jsonify({"error": "Servico ID é necessário"}), 400
    
    # Buscar colaboradores que já estão alocados nesse serviço
    colaboradores_alocados = Colaboradores.query.filter(
        Colaboradores.servicos.any(id_servico=servico_id),
        Colaboradores.is_admin == False
    ).all()
    
    # Buscar colaboradores disponíveis (aqueles que não estão alocados nesse serviço)
    colaboradores_disponiveis = Colaboradores.query.filter(
        ~Colaboradores.servicos.any(id_servico=servico_id),
        Colaboradores.is_admin == False
    ).all()

    # Formatar as respostas para as listas de colaboradores alocados e disponíveis
    colaboradores_alocados_list = [{"id_colaborador": c.id_colaborador, "Nome": c.nome} for c in colaboradores_alocados]
    colaboradores_disponiveis_list = [{"id_colaborador": c.id_colaborador, "Nome": c.nome} for c in colaboradores_disponiveis]

    return jsonify({
        "alocados": colaboradores_alocados_list,
        "disponiveis": colaboradores_disponiveis_list
    })
    




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
