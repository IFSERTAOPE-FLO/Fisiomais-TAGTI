from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime


# Modelo: Colaboradores
class Colaboradores(db.Model):
    ID_Colaborador = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255))
    telefone = db.Column(db.String(20), unique=True)  # Modificado para apenas um telefone
    email = db.Column(db.String(255), unique=True, nullable=False)  # Campo de email único
    senha = db.Column(db.String(255), nullable=False)  # Campo de senha obrigatório
    is_admin = db.Column(db.Boolean, default=False)  # Novo campo para determinar se é administrador
    referencias = db.Column(db.Text)
    cargo = db.Column(db.String(100))
    endereco = db.Column(db.String(255))
    rua = db.Column(db.String(255))
    estado = db.Column(db.String(50))
    cidade = db.Column(db.String(100))
    bairro = db.Column(db.String(100))
    photo = db.Column(db.String(255), nullable=True)

    # Métodos para criptografar e verificar a senha
    def set_password(self, password):
        self.senha = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.senha, password)

    def __repr__(self):
        return f'<Colaborador {self.nome}>'

# Modelo: Clientes
class Clientes(db.Model):
    ID_Cliente = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255))
    telefone = db.Column(db.String(20), unique=True)  # Modificado para apenas um telefone
    email = db.Column(db.String(255), unique=True, nullable=False)  # Campo de email único
    senha = db.Column(db.String(255), nullable=False)  # Campo de senha obrigatório
    referencias = db.Column(db.Text)
    dt_nasc = db.Column(db.Date)
    endereco = db.Column(db.String(255))
    rua = db.Column(db.String(255))
    estado = db.Column(db.String(50))
    cidade = db.Column(db.String(100))
    bairro = db.Column(db.String(100))
    photo = db.Column(db.String(255), nullable=True)

    # Métodos para criptografar e verificar a senha
    def set_password(self, password):
        self.senha = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.senha, password)

# Modelo: Agendamentos
class Agendamentos(db.Model):
    ID_Agendamento = db.Column(db.Integer, primary_key=True)
    data_e_hora = db.Column(db.DateTime, nullable=False)
    ID_Cliente = db.Column(db.Integer, db.ForeignKey('clientes.ID_Cliente'), nullable=False)
    ID_Colaborador = db.Column(db.Integer, db.ForeignKey('colaboradores.ID_Colaborador'), nullable=False)
    ID_Servico = db.Column(db.Integer, db.ForeignKey('servicos.ID_Servico'), nullable=False)  # Novo relacionamento

    cliente = db.relationship('Clientes', backref=db.backref('agendamentos', lazy=True))
    colaborador = db.relationship('Colaboradores', backref=db.backref('agendamentos', lazy=True))
    servico = db.relationship('Servicos', backref=db.backref('agendamentos', lazy=True))  # Relacionamento com serviços

    def __init__(self, data_e_hora, ID_Cliente, ID_Colaborador, ID_Servico):
        self.data_e_hora = data_e_hora
        self.ID_Cliente = ID_Cliente
        self.ID_Colaborador = ID_Colaborador
        self.ID_Servico = ID_Servico  # Atribuindo o ID do serviço


# Modelo: Servicos
class Servicos(db.Model):
    ID_Servico = db.Column(db.Integer, primary_key=True)
    Nome_servico = db.Column(db.String(255))
    Descricao = db.Column(db.Text)
    Valor = db.Column(db.Numeric(10, 2))

# Modelo: Pagamentos
class Pagamentos(db.Model):
    ID_Pagamento = db.Column(db.Integer, primary_key=True)
    valor = db.Column(db.Numeric(10, 2))
    data_pagamento = db.Column(db.Date)
    ID_servico = db.Column(db.Integer, db.ForeignKey('servicos.ID_Servico'), nullable=False)
    ID_cliente = db.Column(db.Integer, db.ForeignKey('clientes.ID_Cliente'), nullable=False)

class BlacklistedToken(db.Model):
    __tablename__ = 'blacklisted_tokens'

    id = db.Column(db.Integer, primary_key=True)  # ID auto-incremental
    jti = db.Column(db.String(255), unique=True, nullable=False)  # O JTI é único para cada token

    def __repr__(self):
        return f'<BlacklistedToken {self.jti}>'

def populate_database():
    # Criar o administrador se não existir
    admin_exists = Colaboradores.query.filter_by(email='admin@teste.com').first()
    if not admin_exists:
        admin = Colaboradores(
            nome='Administrador',
            email='admin@teste.com',
            telefone='999999999',
            cargo='Administrador',
            is_admin=True
        )
        admin.set_password('12345')
        db.session.add(admin)

    # Verificar se os serviços de fisioterapia já existem
    servico_fisioterapia_cla = Servicos.query.filter_by(Nome_servico='Fisioterapia Clássica').first()
    if not servico_fisioterapia_cla:
        servico_fisioterapia_cla = Servicos(
            Nome_servico='Fisioterapia Clássica',
            Descricao='Tratamento de lesões e dores musculares e articulares usando técnicas como termoterapia, eletroterapia, laser e crioterapia.',
            Valor=120.00
        )
        db.session.add(servico_fisioterapia_cla)

    servico_reabilitacao = Servicos.query.filter_by(Nome_servico='Reabilitação Pós-Cirúrgica').first()
    if not servico_reabilitacao:
        servico_reabilitacao = Servicos(
            Nome_servico='Reabilitação Pós-Cirúrgica',
            Descricao='Tratamentos específicos para ajudar na recuperação após cirurgias, focando na restauração da função e força muscular.',
            Valor=130.00
        )
        db.session.add(servico_reabilitacao)

    servico_neurologica = Servicos.query.filter_by(Nome_servico='Neurológica para Adultos').first()
    if not servico_neurologica:
        servico_neurologica = Servicos(
            Nome_servico='Neurológica para Adultos',
            Descricao='Exercícios para melhorar funções motoras em pacientes com doenças neurodegenerativas.',
            Valor=150.00
        )
        db.session.add(servico_neurologica)

    servico_ortopedica = Servicos.query.filter_by(Nome_servico='Ortopédica').first()
    if not servico_ortopedica:
        servico_ortopedica = Servicos(
            Nome_servico='Ortopédica',
            Descricao='Prevenção e tratamento de disfunções musculoesqueléticas, incluindo lesões por esforço repetitivo.',
            Valor=110.00
        )
        db.session.add(servico_ortopedica)

    servico_rpg = Servicos.query.filter_by(Nome_servico='Reeducação Postural Global (RPG)').first()
    if not servico_rpg:
        servico_rpg = Servicos(
            Nome_servico='Reeducação Postural Global (RPG)',
            Descricao='Técnicas para melhorar a postura e alinhar corretamente as articulações.',
            Valor=140.00
        )
        db.session.add(servico_rpg)

    servico_pilates_clinico = Servicos.query.filter_by(Nome_servico='Pilates Clínico').first()
    if not servico_pilates_clinico:
        servico_pilates_clinico = Servicos(
            Nome_servico='Pilates Clínico',
            Descricao='Focado no controle da respiração, fortalecimento do core e melhoria da postura.',
            Valor=160.00
        )
        db.session.add(servico_pilates_clinico)

    servico_pilates_flexibilidade = Servicos.query.filter_by(Nome_servico='Pilates para Flexibilidade').first()
    if not servico_pilates_flexibilidade:
        servico_pilates_flexibilidade = Servicos(
            Nome_servico='Pilates para Flexibilidade',
            Descricao='Exercícios para aumentar a flexibilidade dos músculos e articulações.',
            Valor=150.00
        )
        db.session.add(servico_pilates_flexibilidade)

    servico_pilates_recuperacao = Servicos.query.filter_by(Nome_servico='Pilates para Recuperação').first()
    if not servico_pilates_recuperacao:
        servico_pilates_recuperacao = Servicos(
            Nome_servico='Pilates para Recuperação',
            Descricao='Programas personalizados para ajudar na recuperação de lesões e melhorar a mobilidade.',
            Valor=170.00
        )
        db.session.add(servico_pilates_recuperacao)

    servico_pilates_bemestar = Servicos.query.filter_by(Nome_servico='Pilates para Bem-Estar Geral').first()
    if not servico_pilates_bemestar:
        servico_pilates_bemestar = Servicos(
            Nome_servico='Pilates para Bem-Estar Geral',
            Descricao='Sessões para melhorar a concentração, coordenação motora e qualidade do sono.',
            Valor=140.00
        )
        db.session.add(servico_pilates_bemestar)

    # Criar colaboradores
    colaboradores = [
        {"nome": "João Victor Ramos de Souza", "email": "joao@teste.com", "telefone": "999988888", "cargo": "Fisioterapeuta"},
        {"nome": "Lucas Alves", "email": "lucas@teste.com", "telefone": "999977777", "cargo": "Fisioterapeuta"},
        {"nome": "Manases", "email": "manases@teste.com", "telefone": "999966666", "cargo": "Fisioterapeuta"},
        {"nome": "Aline Rayane", "email": "aline@teste.com", "telefone": "999955555", "cargo": "Fisioterapeuta"},
        {"nome": "Eveline Santos", "email": "eveline@teste.com", "telefone": "999944444", "cargo": "Fisioterapeuta"},
    ]

    for colaborador in colaboradores:
        exists = Colaboradores.query.filter_by(email=colaborador["email"]).first()
        if not exists:
            new_colaborador = Colaboradores(
                nome=colaborador["nome"],
                email=colaborador["email"],
                telefone=colaborador["telefone"],
                cargo=colaborador["cargo"]
            )
            new_colaborador.set_password("123")  # Criptografando a senha
            db.session.add(new_colaborador)

    # Criar clientes
    clientes = [
        {"nome": "Cliente 1", "email": "cliente1@teste.com", "telefone": "888877777"},
        {"nome": "Cliente 2", "email": "cliente2@teste.com", "telefone": "888866666"},
        {"nome": "Cliente 3", "email": "cliente3@teste.com", "telefone": "888855555"},
        {"nome": "Cliente 4", "email": "cliente4@teste.com", "telefone": "888844444"},
        {"nome": "Cliente 5", "email": "cliente5@teste.com", "telefone": "888833333"},
    ]

    for cliente in clientes:
        exists = Clientes.query.filter_by(email=cliente["email"]).first()
        if not exists:
            new_cliente = Clientes(
                nome=cliente["nome"],
                email=cliente["email"],
                telefone=cliente["telefone"]
            )
            new_cliente.set_password("123")  # Criptografando a senha
            db.session.add(new_cliente)

    db.session.commit()
    print("Banco de dados populado com sucesso!")
    
