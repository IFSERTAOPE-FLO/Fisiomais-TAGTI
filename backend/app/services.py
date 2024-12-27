
from datetime import datetime
from app import db
from app.models import (
    Colaboradores,  # Importando a classe de colaboradores
    Enderecos,      # Importando a classe de endereços
    Clinicas,       # Importando a classe de clínicas
    Servicos,       # Importando a classe de serviços
    Planos,         # Importando a classe de planos
    Clientes,       # Importando a classe de clientes
    Horarios,       # Importando a classe de horários
    TipoServico     # Importando a classe de relacionamento do tipo com servico
)


def populate_database():
    # Criar o administrador se não existir
    with db.session.no_autoflush:
        admin_exists = Colaboradores.query.filter_by(cpf='000.000.000-00').first()
        if not admin_exists:
            admin = Colaboradores(
                nome='Administrador',
                email='fisiomaispilatesefisioterapia@gmail.com',
                telefone='999999999',
                cargo='Administrador',
                cpf='000.000.000-00',  
                is_admin=True,
                admin_nivel='geral'
            )
            admin.set_password('12345')
            db.session.add(admin)

    # Criar endereços para clínicas
    enderecos = [
        {"rua": "Rua A", "numero": "123", "bairro": "Centro", "cidade": "São Paulo", "estado": "SP"},
        {"rua": "Rua B", "numero": "456", "bairro": "Bairro Novo", "cidade": "Rio de Janeiro", "estado": "RJ"},
        {"rua": "Rua C", "numero": "789", "bairro": "Centro", "cidade": "Belo Horizonte", "estado": "MG"},
        {"rua": "Rua D", "numero": "101", "bairro": "Jardins", "cidade": "Salvador", "estado": "BA"},
        {"rua": "Rua E", "numero": "202", "bairro": "Boa Vista", "cidade": "Recife", "estado": "PE"}
    ]

    clinicas = [
        {"cnpj": "11.111.111/0001-11", "nome": "Clínica Saúde SP", "telefone": "111112111"},
        {"cnpj": "22.222.222/0001-22", "nome": "Clínica Rio", "telefone": "222422222"},
        {"cnpj": "33.333.333/0001-33", "nome": "Clínica BH", "telefone": "333533333"},
        {"cnpj": "44.444.444/0001-44", "nome": "Clínica Salvador", "telefone": "446444444"},
        {"cnpj": "55.555.555/0001-55", "nome": "Clínica Recife", "telefone": "555575555"}
    ]

    colaboradores = [
        {"nome": "João Victor Ramos de Souza", "email": "joao.ramos.souza@gmail.com", "telefone": "999988888", "cargo": "Fisioterapeuta", "cpf": "11111111111"},
        {"nome": "Lucas Alves", "email": "lucas@teste.com", "telefone": "999977777", "cargo": "Fisioterapeuta", "cpf": "22222222222"},
        {"nome": "Manases Silva", "email": "manases@teste.com", "telefone": "999966666", "cargo": "Fisioterapeuta", "cpf": "33333333333"},
        {"nome": "Aline Rayane", "email": "aline@teste.com", "telefone": "999955555", "cargo": "Fisioterapeuta", "cpf": "44444444444"},
        {"nome": "Eveline Santos", "email": "eveline@teste.com", "telefone": "999944444", "cargo": "Fisioterapeuta", "cpf": "55555555555"}
    ]

    horarios = [
        {"dia_semana": "segunda-feira", "hora_inicio": "08:00:00", "hora_fim": "12:00:00"},
        {"dia_semana": "terca-feira", "hora_inicio": "14:00:00", "hora_fim": "18:00:00"},
        {"dia_semana": "quarta-feira", "hora_inicio": "08:00:00", "hora_fim": "12:00:00"},
        {"dia_semana": "quinta-feira", "hora_inicio": "14:00:00", "hora_fim": "18:00:00"},
        {"dia_semana": "sexta-feira", "hora_inicio": "08:00:00", "hora_fim": "12:00:00"}
    ]

    # Criar endereços e clínicas
    for i, clinica in enumerate(clinicas):
        endereco_data = enderecos[i]
        endereco = Enderecos(**endereco_data)
        db.session.add(endereco)
        db.session.flush()  # Garante que o ID do endereço é gerado

        # Verificar se a clínica já existe pelo CNPJ
        existing_clinica = Clinicas.query.filter_by(cnpj=clinica["cnpj"]).first()
        if not existing_clinica:
            # Se não existir, insira a clínica
            clinica_instance = Clinicas(
                cnpj=clinica["cnpj"],
                nome=clinica["nome"],
                telefone=clinica["telefone"],
                endereco_id=endereco.id_endereco
            )
            db.session.add(clinica_instance)
            db.session.flush()  # Garante que o ID da clínica é gerado

            # Associar colaboradores às clínicas
            colaborador_data = colaboradores[i]
            colaborador = Colaboradores(
                nome=colaborador_data["nome"],
                email=colaborador_data["email"],
                telefone=colaborador_data["telefone"],
                cargo=colaborador_data["cargo"],
                cpf=colaborador_data["cpf"],
                clinica_id=clinica_instance.id_clinica
            )
            colaborador.set_password("123")
            db.session.add(colaborador)
            db.session.flush()  # Garante que o ID do colaborador é gerado

            # Adicionar horários ao colaborador
            horario_data = horarios[i]
            horario = Horarios(
                id_colaborador=colaborador.id_colaborador,
                dia_semana=horario_data["dia_semana"],
                hora_inicio=datetime.strptime(horario_data["hora_inicio"], "%H:%M:%S").time(),
                hora_fim=datetime.strptime(horario_data["hora_fim"], "%H:%M:%S").time()
            )
            db.session.add(horario)
        else:
            print(f"Clínica com CNPJ {clinica['cnpj']} já existe. Ignorando inserção.")

    db.session.commit()

    
    # Definir os serviços
    servicos = [
        {
            "nome": "Fisioterapia Clássica",
            "descricao": "Tratamento de lesões e dores musculares e articulares usando técnicas como termoterapia, eletroterapia, laser e crioterapia.",
            "valor": 120.00,
            "tipo_servico": "fisioterapia",
        },
        {
            "nome": "Reabilitação Pós-Cirúrgica",
            "descricao": "Tratamentos específicos para ajudar na recuperação após cirurgias, focando na restauração da função e força muscular.",
            "valor": 130.00,
            "tipo_servico": "fisioterapia",
        },
        {
            "nome": "Pilates Clínico",
            "descricao": "Focado no controle da respiração, fortalecimento do core e melhoria da postura.",
            "valor": None,
            "tipo_servico": "pilates",
        },
        {
            "nome": "Pilates Tradicional",
            "descricao": "Aulas de Pilates para aumentar flexibilidade e força.",
            "valor": None,
            "tipo_servico": "pilates",
        },
    ]

    # Inserir os serviços no banco de dados
    for servico in servicos:
        exists = Servicos.query.filter_by(nome=servico["nome"]).first()
        if not exists:
            # Criar o serviço
            new_servico = Servicos(
                nome=servico["nome"],
                descricao=servico["descricao"],
                valor=servico.get("valor"),
            )
            db.session.add(new_servico)

            # Associa o tipo de serviço ao serviço
            tipo_servico = TipoServico.query.filter_by(tipo=servico["tipo_servico"]).first()
            if tipo_servico:
                new_servico.tipo_servicos.append(tipo_servico)

    db.session.commit()


    # Criar planos para serviços de Pilates
    planos_pilates = [
        {"nome": "Plano Mensal", "valor": 300.00, "servico_nome": "Pilates Clínico"},
        {"nome": "2 dias por semana", "valor": 250.00, "servico_nome": "Pilates Clínico"},
        {"nome": "1 dia por semana", "valor": 200.00, "servico_nome": "Pilates Clínico"},
        {"nome": "Plano Anual", "valor": 2000.00, "servico_nome": "Pilates Tradicional"},
        {"nome": "Plano Mensal", "valor": 300.00, "servico_nome": "Pilates Tradicional"},
        {"nome": "3 dias por semana", "valor": 349.99, "servico_nome": "Pilates Tradicional"},
    ]

    for plano in planos_pilates:
        exists = Planos.query.filter_by(nome=plano["nome"]).first()  # Corrigido para acessar 'plano', não 'planos_pilates'
        if not exists:
            servico = Servicos.query.filter_by(nome=plano["servico_nome"]).first()
            if servico:
                new_plano = Planos(
                    nome=plano["nome"],
                    descricao=f"Plano para {plano['servico_nome']}",
                    valor=plano["valor"],
                    servico_id=servico.id_servico
                )
                db.session.add(new_plano)

    db.session.commit()


    # Associar colaboradores aos serviços
    for colaborador in Colaboradores.query.all():
        servico = Servicos.query.filter_by(nome="Fisioterapia Clássica").first()
        if servico and servico not in colaborador.servicos:
            colaborador.servicos.append(servico)

    db.session.commit()
    # Criar clientes
    clientes = [
        {"nome": "Cliente 1", "email": "cliente1@teste.com", "telefone": "888877777", "cpf": "66666666666"},
        {"nome": "Cliente 2", "email": "cliente2@teste.com", "telefone": "888866666", "cpf": "77777777777"},
        {"nome": "Cliente 3", "email": "cliente3@teste.com", "telefone": "888855555", "cpf": "88888888888"},
        {"nome": "Cliente 4", "email": "cliente4@teste.com", "telefone": "888844444", "cpf": "99999999999"},
        {"nome": "João Victor Ramos de Souza", "email": "jvrs2009@gmail.com", "telefone": "888833333", "cpf": "11111111112"},
    ]

    for cliente in clientes:
        exists = Clientes.query.filter_by(email=cliente["email"]).first()
        if not exists:
            new_cliente = Clientes(
                nome=cliente["nome"],
                email=cliente["email"],
                telefone=cliente["telefone"],
                cpf=cliente["cpf"]
            )
            new_cliente.set_password("123")  # Criptografando a senha
            db.session.add(new_cliente)

    # Criar horários para colaboradores
    default_horarios = [
        {"dia_semana": "segunda-feira", "hora_inicio": "08:00:00", "hora_fim": "12:00:00"},
        {"dia_semana": "quarta-feira", "hora_inicio": "14:00:00", "hora_fim": "18:00:00"},
    ]

    # Associar horários aos colaboradores
    for colaborador in Colaboradores.query.all():
        for horario in default_horarios:
            new_horario = Horarios(
                id_colaborador=colaborador.id_colaborador,
                dia_semana=horario["dia_semana"],
                hora_inicio=datetime.strptime(horario["hora_inicio"], "%H:%M:%S").time(),
                hora_fim=datetime.strptime(horario["hora_fim"], "%H:%M:%S").time()
            )
            db.session.add(new_horario)

    db.session.commit()
