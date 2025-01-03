from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from flask import url_for


# Modelo: Colaboradores
class Colaboradores(db.Model):
    __tablename__ = 'colaboradores'
    ID_Colaborador = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    telefone = db.Column(db.String(20), unique=True)  # Apenas um telefone
    email = db.Column(db.String(255), unique=True, nullable=False)  # Campo de email único
    senha = db.Column(db.String(255), nullable=False)  # Campo de senha obrigatório
    is_admin = db.Column(db.Boolean, default=False)  # Determina se é administrador
    referencias = db.Column(db.Text)
    cargo = db.Column(db.String(100), nullable=False)  # Fisioterapeuta, Instrutor, etc.
    endereco = db.Column(db.String(255))    
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    estado = db.Column(db.String(50))
    cidade = db.Column(db.String(100))
    bairro = db.Column(db.String(100))
    photo = db.Column(db.String(255), nullable=True)

    # Relacionamentos
    servicos = db.relationship('Servicos', secondary='colaboradores_servicos', back_populates='colaboradores')
    horarios = db.relationship('Horarios', back_populates='colaborador')

    # Métodos de senha
    def set_password(self, password):
        self.senha = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.senha, password)

    def __repr__(self):
        return f'<Colaborador {self.nome}>'

    def get_photo_url(self):
        """Retorna o URL público da foto."""
        if self.photo:
            return url_for('main.serve_photo', filename=self.photo, _external=True)
        return None  # Caso não tenha foto

    def to_dict(self):
        return {
            'ID_Colaborador': self.ID_Colaborador,
            'nome': self.nome,
            'cargo': self.cargo
        }


# Modelo: Horários
class Horarios(db.Model):
    __tablename__ = 'horarios'
    ID_Horario = db.Column(db.Integer, primary_key=True)
    ID_Colaborador = db.Column(db.Integer, db.ForeignKey('colaboradores.ID_Colaborador'), nullable=False)
    dia_semana = db.Column(db.String(50), nullable=False)  # Segunda, Terça, etc.
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fim = db.Column(db.Time, nullable=False)

    colaborador = db.relationship('Colaboradores', back_populates='horarios')

    def __repr__(self):
        return f'<Horário {self.dia_semana} - {self.hora_inicio} até {self.hora_fim}>'


# Modelo: Clientes
class Clientes(db.Model):
    __tablename__ = 'clientes'
    ID_Cliente = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    telefone = db.Column(db.String(20), unique=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    referencias = db.Column(db.Text)
    dt_nasc = db.Column(db.Date)
    endereco = db.Column(db.String(255))
    estado = db.Column(db.String(50))
    cidade = db.Column(db.String(100))
    bairro = db.Column(db.String(100))
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    photo = db.Column(db.String(255), nullable=True)

    def set_password(self, password):
        self.senha = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.senha, password)

    def get_photo_url(self):
        """Retorna o URL público da foto."""
        if self.photo:
            return url_for('main.serve_photo', filename=self.photo, _external=True)
        return None


# Modelo: Serviços
class Servicos(db.Model):
    __tablename__ = 'servicos'
    ID_Servico = db.Column(db.Integer, primary_key=True)
    Nome_servico = db.Column(db.String(255), nullable=False)
    Descricao = db.Column(db.Text)
    Valor = db.Column(db.Numeric(10, 2))  # Para serviços com valor fixo
    tipo_servico = db.Column(db.String(50), nullable=False)  # Tipo: fisioterapia ou pilates
    planos = db.Column(db.JSON, nullable=True)  # Planos para serviços de Pilates (armazenados como JSON)

    # Relacionamentos
    colaboradores = db.relationship('Colaboradores', secondary='colaboradores_servicos', back_populates='servicos')

    def __repr__(self):
        return f'<Servico {self.Nome_servico} - {self.tipo_servico}>'

    def to_dict(self):
        return {
            'ID_Servico': self.ID_Servico,
            'Nome_servico': self.Nome_servico,
            'Descricao': self.Descricao,
            'Valor': str(self.Valor) if self.Valor is not None else None,
            'Tipo': self.tipo_servico,
            'Planos': self.planos
        }




# Tabela associativa para colaboradores e serviços
class ColaboradoresServicos(db.Model):
    __tablename__ = 'colaboradores_servicos'
    ID_Colaborador = db.Column(db.Integer, db.ForeignKey('colaboradores.ID_Colaborador'), primary_key=True)
    ID_Servico = db.Column(db.Integer, db.ForeignKey('servicos.ID_Servico'), primary_key=True)

    colaborador = db.relationship('Colaboradores', backref=db.backref('colaboradores_servicos', lazy=True))
    servico = db.relationship('Servicos', backref=db.backref('colaboradores_servicos', lazy=True), overlaps="colaboradores,servicos")


class Agendamentos(db.Model):
    __tablename__ = 'agendamentos'

    ID_Agendamento = db.Column(db.Integer, primary_key=True)
    data_e_hora = db.Column(db.DateTime, nullable=False)
    ID_Cliente = db.Column(db.Integer, db.ForeignKey('clientes.ID_Cliente'), nullable=False)
    ID_Colaborador = db.Column(db.Integer, db.ForeignKey('colaboradores.ID_Colaborador'), nullable=False)
    ID_Servico = db.Column(db.Integer, db.ForeignKey('servicos.ID_Servico'), nullable=False)
    ID_Plano = db.Column(db.Integer, nullable=True)  # Opcional para serviços como fisioterapia
    status = db.Column(db.String(20), default="pendente")  # Adicionado o campo status

    cliente = db.relationship('Clientes', backref='agendamentos')
    colaborador = db.relationship('Colaboradores', backref='agendamentos')
    servico = db.relationship('Servicos', backref='agendamentos')

    def __repr__(self):
        return f'<Agendamento {self.ID_Agendamento} - Status: {self.status}>'
class BlacklistedToken(db.Model):
    __tablename__ = 'blacklisted_tokens'

    id = db.Column(db.Integer, primary_key=True)  # ID auto-incremental
    jti = db.Column(db.String(255), unique=True, nullable=False)  # O JTI é único para cada token

    def __repr__(self):
        return f'<BlacklistedToken {self.jti}>'


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
                is_admin=True
            )
            admin.set_password('12345')  # Certifique-se de que o método de criptografia funciona corretamente
            db.session.add(admin)

   # Definir os serviços
    servicos = [
        {
            "Nome_servico": "Fisioterapia Clássica",
            "Descricao": "Tratamento de lesões e dores musculares e articulares usando técnicas como termoterapia, eletroterapia, laser e crioterapia.",
            "Valor": 120.00,
            "tipo_servico": "fisioterapia",
        },
        {
            "Nome_servico": "Reabilitação Pós-Cirúrgica",
            "Descricao": "Tratamentos específicos para ajudar na recuperação após cirurgias, focando na restauração da função e força muscular.",
            "Valor": 130.00,
            "tipo_servico": "fisioterapia",
        },
        {
            "Nome_servico": "Neurológica para Adultos",
            "Descricao": "Exercícios para melhorar funções motoras em pacientes com doenças neurodegenerativas.",
            "Valor": 150.00,
            "tipo_servico": "fisioterapia",
        },
        {
            "Nome_servico": "Ortopédica",
            "Descricao": "Prevenção e tratamento de disfunções musculoesqueléticas, incluindo lesões por esforço repetitivo.",
            "Valor": 110.00,
            "tipo_servico": "fisioterapia",
        },
        {
            "Nome_servico": "Reeducação Postural Global (RPG)",
            "Descricao": "Técnicas para melhorar a postura e alinhar corretamente as articulações.",
            "Valor": 140.00,
            "tipo_servico": "fisioterapia",
        },
        {
            "Nome_servico": "Pilates Clínico",
            "Descricao": "Focado no controle da respiração, fortalecimento do core e melhoria da postura.",
            "Valor": None,  # Valor não aplicável diretamente, definido pelos planos
            "tipo_servico": "pilates",
            "planos": [
                {"ID_Plano": 1, "Nome_plano": "Plano Mensal", "Valor": 300.00},
                {"ID_Plano": 2, "Nome_plano": "2 dias por semana", "Valor": 250.00},
                {"ID_Plano": 3, "Nome_plano": "1 dia por semana", "Valor": 200.00},
            ],
        },
        {
            "Nome_servico": "Pilates Tradicional",
            "Descricao": "Aulas de Pilates para aumentar flexibilidade e força.",
            "Valor": None,  # Valor não aplicável diretamente, definido pelos planos
            "tipo_servico": "pilates",
            "planos": [
                {"ID_Plano": 4, "Nome_plano": "Plano Anual", "Valor": 2000.00},
                {"ID_Plano": 5, "Nome_plano": "Plano Mensal", "Valor": 300.00},
                {"ID_Plano": 6, "Nome_plano": "3 dias por semana", "Valor": 349.99},
                {"ID_Plano": 7, "Nome_plano": "2 dias por semana", "Valor": 299.00},
                {"ID_Plano": 8, "Nome_plano": "1 dia por semana", "Valor": 200.00},
            ],
        },
    ]


    # Inserir os serviços no banco de dados
    for servico in servicos:
        exists = Servicos.query.filter_by(Nome_servico=servico["Nome_servico"]).first()
        if not exists:
            new_servico = Servicos(
                Nome_servico=servico["Nome_servico"],
                Descricao=servico["Descricao"],
                Valor=servico.get("Valor"),
                tipo_servico=servico["tipo_servico"],
                planos=servico.get("planos") if servico["tipo_servico"] == "pilates" else None,  # Somente serviços de Pilates terão planos
            )
            db.session.add(new_servico)

    # Salvar os serviços no banco de dados
    db.session.commit()

    # Criar colaboradores
    colaboradores = [
        {"nome": "João Victor Ramos de Souza", "email": "joao.ramos.souza@gmail.com", "telefone": "999988888", "cargo": "Fisioterapeuta", "cpf": "11111111111"},
        {"nome": "Lucas Alves", "email": "lucas@teste.com", "telefone": "999977777", "cargo": "Fisioterapeuta", "cpf": "22222222222"},
        {"nome": "Manases", "email": "manases@teste.com", "telefone": "999966666", "cargo": "Fisioterapeuta", "cpf": "33333333333"},
        {"nome": "Aline Rayane", "email": "aline@teste.com", "telefone": "999955555", "cargo": "Fisioterapeuta", "cpf": "44444444444"},
        {"nome": "Eveline Santos", "email": "eveline@teste.com", "telefone": "999944444", "cargo": "Fisioterapeuta", "cpf": "55555555555"},
    ]

    for colaborador in colaboradores:
        exists = Colaboradores.query.filter_by(email=colaborador["email"]).first()
        if not exists:
            new_colaborador = Colaboradores(
                nome=colaborador["nome"],
                email=colaborador["email"],
                telefone=colaborador["telefone"],
                cargo=colaborador["cargo"],
                cpf=colaborador["cpf"]
            )
            new_colaborador.set_password("123")  # Criptografando a senha
            db.session.add(new_colaborador)

    # Salvar colaboradores no banco de dados
    db.session.commit()
    

    # Associar colaboradores aos serviços
    for colaborador in Colaboradores.query.all():
        # Exemplo de atribuição de serviços aos colaboradores
        if colaborador.nome == "João Victor Ramos de Souza":
            servico = Servicos.query.filter_by(Nome_servico="Fisioterapia Clássica").first()
            if servico and servico not in colaborador.servicos:  # Verifica se o serviço já está associado
                colaborador.servicos.append(servico)
            servico2 = Servicos.query.filter_by(Nome_servico="Pilates Clínico").first()
            if servico2 and servico2 not in colaborador.servicos:  # Verifica se o serviço já está associado
                colaborador.servicos.append(servico2)
        if colaborador.nome == "Lucas Alves":
            servico = Servicos.query.filter_by(Nome_servico="Reabilitação Pós-Cirúrgica").first()
            if servico and servico not in colaborador.servicos:
                colaborador.servicos.append(servico)
        if colaborador.nome == "Manases":
            servico = Servicos.query.filter_by(Nome_servico="Neurológica para Adultos").first()
            if servico and servico not in colaborador.servicos:
                colaborador.servicos.append(servico)
        if colaborador.nome == "Aline Rayane":
            servico = Servicos.query.filter_by(Nome_servico="Ortopédica").first()
            if servico and servico not in colaborador.servicos:
                colaborador.servicos.append(servico)
            servico2 = Servicos.query.filter_by(Nome_servico="Reeducação Postural Global (RPG)").first()
            if servico2 and servico2 not in colaborador.servicos:
                colaborador.servicos.append(servico2)
        if colaborador.nome == "Eveline Santos":
            servico = Servicos.query.filter_by(Nome_servico="Reeducação Postural Global (RPG)").first()
            if servico and servico not in colaborador.servicos:
                colaborador.servicos.append(servico)
            servico2 = Servicos.query.filter_by(Nome_servico="Pilates Tradicional").first()
            if servico2 and servico2 not in colaborador.servicos:
                colaborador.servicos.append(servico2)

    db.session.commit()

    # Criar horários para colaboradores (garantir pelo menos um para cada)
    default_horarios = [
        {"dia_semana": "Segunda-feira", "hora_inicio": "08:00:00", "hora_fim": "12:00:00"},
        {"dia_semana": "Quarta-feira", "hora_inicio": "14:00:00", "hora_fim": "18:00:00"},
    ]

    colaboradores_registrados = Colaboradores.query.all()
    for idx, colaborador in enumerate(colaboradores_registrados):
        horario_existe = Horarios.query.filter_by(ID_Colaborador=colaborador.ID_Colaborador).first()
        if not horario_existe:
            horario = default_horarios[idx % len(default_horarios)]
            new_horario = Horarios(
                ID_Colaborador=colaborador.ID_Colaborador,
                dia_semana=horario["dia_semana"],
                hora_inicio=datetime.strptime(horario["hora_inicio"], "%H:%M:%S").time(),
                hora_fim=datetime.strptime(horario["hora_fim"], "%H:%M:%S").time()
            )
            db.session.add(new_horario)

    db.session.commit()
    print("Banco de dados populado com horários para todos os colaboradores.")



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

    # Salvar todas as alterações no banco de dados
    db.session.commit()
    print("Banco de dados populado com sucesso!")