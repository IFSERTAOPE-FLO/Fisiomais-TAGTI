
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
    TipoServico,     # Importando a classe de relacionamento do tipo com servico
    ServicosTipoServico
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
        {"rua": "Rua A", "numero": "123", "bairro": "Centro", "cidade": "Floresta", "estado": "PE"},
        {"rua": "Rua B", "numero": "456", "bairro": "Bairro Novo", "cidade": "Serra Talhada", "estado": "PE"},
        {"rua": "Rua C", "numero": "789", "bairro": "Centro", "cidade": "Caruaru", "estado": "PE"},
        {"rua": "Rua D", "numero": "101", "bairro": "Jardins", "cidade": "Salgueiro", "estado": "PE"},
        {"rua": "Rua E", "numero": "202", "bairro": "Boa Vista", "cidade": "Recife", "estado": "PE"}
    ]

    clinicas = [
        {"cnpj": "11.111.111/0001-11", "nome": "Clínica Fisiomais Floresta", "telefone": "111112111"},
        {"cnpj": "22.222.222/0001-22", "nome": "Clínica Fisiomais Serra Talhada", "telefone": "222422222"},
        {"cnpj": "33.333.333/0001-33", "nome": "Clínica Fisiomais Caruaru", "telefone": "333533333"},
        {"cnpj": "44.444.444/0001-44", "nome": "Clínica Fisiomais Salgueiro", "telefone": "446444444"},
        {"cnpj": "55.555.555/0001-55", "nome": "Clínica Fisiomais Recife", "telefone": "555575555"}
    ]

    colaboradores = [
        {"nome": "João Victor Ramos de Souza", "email": "joao.ramos.souza@gmail.com", "telefone": "999988888", "cargo": "Fisioterapeuta", "cpf": "11111111111"},
        {"nome": "Lucas Alves", "email": "lucas@teste.com", "telefone": "999977777", "cargo": "Fisioterapeuta", "cpf": "22222222222"},
        {"nome": "Manases Silva", "email": "manases@teste.com", "telefone": "999966666", "cargo": "Instrutor", "cpf": "33333333333"},
        {"nome": "Aline Rayane", "email": "aline@teste.com", "telefone": "999955555", "cargo": "Instrutor", "cpf": "44444444444"},
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

        # Verificar se o endereço já existe
        existing_endereco = Enderecos.query.filter_by(
            rua=endereco_data["rua"],
            numero=endereco_data["numero"],
            bairro=endereco_data["bairro"],
            cidade=endereco_data["cidade"],
            estado=endereco_data["estado"]
        ).first()

        if not existing_endereco:
            # Se o endereço não existir, crie um novo
            endereco = Enderecos(**endereco_data)
            db.session.add(endereco)
            db.session.flush()  # Garante que o ID do endereço é gerado
        else:
            # Use o endereço existente
            endereco = existing_endereco

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
        # Associar instrutores de pilates a todas as clínicas
    instrutores_pilates = [
        {"nome": "Aline Rayane", "cargo": "Instrutor"},
        {"nome": "Manases Silva", "cargo": "Instrutor"}
    ]

    for clinica in Clinicas.query.all():
        # Verificar se já há instrutores de pilates na clínica
        for instrutor_data in instrutores_pilates:
            instrutor = Colaboradores.query.filter_by(nome=instrutor_data["nome"], cargo=instrutor_data["cargo"]).first()

            # Se o instrutor não existir, criar e associar à clínica
            if not instrutor:
                instrutor = Colaboradores(
                    nome=instrutor_data["nome"],
                    cargo=instrutor_data["cargo"],
                    clinica_id=clinica.id_clinica,
                    cpf="00000000000",  # CPF fictício ou valor correto
                    email=f"{instrutor_data['nome'].lower().replace(' ', '')}@teste.com",  # Email fictício
                    telefone="999999999"  # Telefone fictício
                )
                instrutor.set_password("123")
                db.session.add(instrutor)

            # Associar instrutor ao serviço de pilates
            servico_pilates_1 = Servicos.query.filter_by(nome="Pilates Clínico").first()
            servico_pilates_2 = Servicos.query.filter_by(nome="Pilates Tradicional").first()

            if servico_pilates_1 and servico_pilates_1 not in instrutor.servicos:
                instrutor.servicos.append(servico_pilates_1)

            if servico_pilates_2 and servico_pilates_2 not in instrutor.servicos:
                instrutor.servicos.append(servico_pilates_2)

        db.session.commit()


    db.session.commit()
    # Populando os tipos de serviços
    tipos_servicos = [
        {"tipo": "fisioterapia"},
        {"tipo": "pilates"}
    ]

    # Inserir tipos de serviço no banco de dados se não existirem
    for tipo in tipos_servicos:
        exists = TipoServico.query.filter_by(tipo=tipo["tipo"]).first()
        if not exists:
            novo_tipo = TipoServico(tipo=tipo["tipo"])
            db.session.add(novo_tipo)
        
    db.session.commit()


    # Criar serviços e associar aos tipos
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

    # Inserir serviços no banco de dados e associar tipos
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

            # Associa o tipo de serviço ao serviço diretamente na tabela associativa
            tipo_servico = TipoServico.query.filter_by(tipo=servico["tipo_servico"]).first()
            if tipo_servico:
                # Criar a associação na tabela associativa diretamente
                associacao = ServicosTipoServico(
                    servico_id=new_servico.id_servico,
                    tipo_servico_id=tipo_servico.id_tipo_servico
                )
                db.session.add(associacao)

    db.session.commit()


    # Criar planos para serviços de Pilates
    planos_pilates = [
        {"nome": "Plano Plates Clinico ", "valor": 450.00, "servico_nome": "Pilates Clínico", "quantidade_aulas_por_semana": 2},
        {"nome": "Plano Mensal ", "valor": 500.00, "servico_nome": "Pilates Clínico", "quantidade_aulas_por_semana": 3},
        {"nome": "Plano Mensal ", "valor": 500.00, "servico_nome": "Pilates Tradicional", "quantidade_aulas_por_semana": 3},
        {"nome": "Plano Anual ", "valor": 3000.00, "servico_nome": "Pilates Tradicional", "quantidade_aulas_por_semana": 2},
        {"nome": "Plano Trimestral ", "valor": 849.99, "servico_nome": "Pilates Tradicional", "quantidade_aulas_por_semana": 3},
        {"nome": "Plano Semestral ", "valor": 1549.99, "servico_nome": "Pilates Tradicional", "quantidade_aulas_por_semana": 3},
    ]


    # Criar planos para os serviços de pilates
    for plano in planos_pilates:
        exists = Planos.query.filter_by(nome=plano["nome"]).first()
        if not exists:
            servico = Servicos.query.filter_by(nome=plano["servico_nome"]).first()
            if servico:
                new_plano = Planos(
                    nome=plano["nome"],
                    descricao=f"Plano para {plano['servico_nome']}",
                    valor=plano["valor"],
                    servico_id=servico.id_servico,
                    quantidade_aulas_por_semana=plano["quantidade_aulas_por_semana"]
                )
                db.session.add(new_plano)

    db.session.commit()


    # Associar colaboradores aos serviços
    for colaborador in Colaboradores.query.all():
        # Associar fisioterapeutas aos serviços de fisioterapia
        if colaborador.cargo == "Fisioterapeuta":
            servico_fisioterapia_1 = Servicos.query.filter_by(nome="Fisioterapia Clássica").first()
            servico_fisioterapia_2 = Servicos.query.filter_by(nome="Reabilitação Pós-Cirúrgica").first()

            if servico_fisioterapia_1 and servico_fisioterapia_1 not in colaborador.servicos:
                colaborador.servicos.append(servico_fisioterapia_1)
            
            if servico_fisioterapia_2 and servico_fisioterapia_2 not in colaborador.servicos:
                colaborador.servicos.append(servico_fisioterapia_2)

        # Associar instrutores aos serviços de pilates
        if colaborador.cargo == "Instrutor":
            servico_pilates_1 = Servicos.query.filter_by(nome="Pilates Clínico").first()
            servico_pilates_2 = Servicos.query.filter_by(nome="Pilates Tradicional").first()

            if servico_pilates_1 and servico_pilates_1 not in colaborador.servicos:
                colaborador.servicos.append(servico_pilates_1)
            
            if servico_pilates_2 and servico_pilates_2 not in colaborador.servicos:
                colaborador.servicos.append(servico_pilates_2)

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
                cpf=cliente["cpf"],  # Senha padrão
                
            )
            new_cliente.set_password("123")  # Criptografando a senha
            db.session.add(new_cliente)

    
    db.session.commit()


from datetime import datetime, timedelta
from app import db
from app.models import (
    Colaboradores, Clinicas, Servicos, Clientes, 
    PlanosTratamento, PlanosTratamentoServicos, 
    HistoricoSessao, Agendamentos
)

def populate_database_extra():
    # Criar cliente se não existir
    cliente_existente = Clientes.query.filter_by(cpf='123.456.789-00').first()
    if not cliente_existente:
        cliente = Clientes(
            nome='Carlos Silva',
            email='carlos.silva@example.com',
            telefone='987654321',
            cpf='123.456.789-00',
            senha='123',  # Senha padrão
            plano_id=1
            
        )
        db.session.add(cliente)
        db.session.flush()
    else:
        cliente = cliente_existente
    
    # Criar plano de tratamento se não existir
    plano_existente = PlanosTratamento.query.filter_by(diagnostico='Dor lombar crônica').first()
    if not plano_existente:
        plano_tratamento = PlanosTratamento(
            diagnostico='Dor lombar crônica',
            objetivos='Redução da dor e melhora da mobilidade',
            metodologia='Exercícios terapêuticos e pilates, valor mensal',
            duracao_prevista=12,
            valor=350.00
        )
        db.session.add(plano_tratamento)
        db.session.flush()
    else:
        plano_tratamento = plano_existente
    
    # Buscar serviço de fisioterapia
    servico_existente = Servicos.query.filter_by(nome='Fisioterapia Clássica').first()
    
    if servico_existente:
        associacao_existente = PlanosTratamentoServicos.query.filter_by(
            id_plano_tratamento=plano_tratamento.id_plano_tratamento,
            id_servico=servico_existente.id_servico
        ).first()
        
        if not associacao_existente:
            plano_servico = PlanosTratamentoServicos(
                id_plano_tratamento=plano_tratamento.id_plano_tratamento,
                id_servico=servico_existente.id_servico,
                quantidade_sessoes=10
            )
            db.session.add(plano_servico)

    # Criar um agendamento fictício
    colaborador = Colaboradores.query.first()
    clinica = Clinicas.query.first()
    
    if colaborador and servico_existente and clinica:
        agendamento_existente = Agendamentos.query.filter_by(
            id_cliente=cliente.id_cliente,
            id_servico=servico_existente.id_servico
        ).first()

        if not agendamento_existente:
            novo_agendamento = Agendamentos(
                data_e_hora=datetime.utcnow() + timedelta(days=2),  # Sessão para daqui a 2 dias
                id_cliente=cliente.id_cliente,
                id_colaborador=colaborador.id_colaborador,
                id_servico=servico_existente.id_servico,
                status="confirmado",
                id_clinica=clinica.id_clinica,
                dias_e_horarios="Segunda-feira às 10h"
            )
            db.session.add(novo_agendamento)
            db.session.flush()  # Garante que temos o ID do agendamento

        else:
            novo_agendamento = agendamento_existente
    
        # Criar um histórico de sessão vinculado ao agendamento
        historico_existente = HistoricoSessao.query.filter_by(
            id_agendamento=novo_agendamento.id_agendamento
        ).first()

        if not historico_existente:
            historico_sessao = HistoricoSessao(
                id_cliente=cliente.id_cliente,
                id_colaborador=colaborador.id_colaborador,
                id_plano_tratamento=plano_tratamento.id_plano_tratamento,
                id_agendamento=novo_agendamento.id_agendamento,
                data_sessao=datetime.utcnow(),
                detalhes='Sessão inicial de avaliação e alongamento',
                observacoes='Paciente relatou alívio leve da dor',
                avaliacao_cliente='Muito satisfeito',
                sessoes_realizadas=1
            )
            db.session.add(historico_sessao)
    
    db.session.commit()
    print("Banco de dados populado com cliente, plano de tratamento, agendamento e histórico de sessão.")
