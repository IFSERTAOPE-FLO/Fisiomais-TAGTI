from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from flask import url_for

# Modelo: Endereços
class Enderecos(db.Model):
    __tablename__ = 'enderecos'
    id_endereco = db.Column(db.Integer, primary_key=True)  # Padronizado
    rua = db.Column(db.String(255), nullable=False)
    numero = db.Column(db.String(20), nullable=False)
    complemento = db.Column(db.String(255), nullable=True)
    bairro = db.Column(db.String(100), nullable=False)
    cidade = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.String(50), nullable=False)

    # Relacionamentos
    clientes = db.relationship('Clientes', back_populates='endereco')
    colaboradores = db.relationship('Colaboradores', back_populates='endereco')
    clinicas = db.relationship('Clinicas', back_populates='endereco')

# Modelo: Clínicas
class Clinicas(db.Model):
    __tablename__ = 'clinicas'
    id_clinica = db.Column(db.Integer, primary_key=True)  # Padronizado
    cnpj = db.Column(db.String(18), unique=True, nullable=False)
    nome = db.Column(db.String(255), nullable=False)
    endereco_id = db.Column(db.Integer, db.ForeignKey('enderecos.id_endereco'), nullable=False)

    # Relacionamentos
    endereco = db.relationship('Enderecos', back_populates='clinicas')

# Modelo: Colaboradores
class Colaboradores(db.Model):
    __tablename__ = 'colaboradores'
    id_colaborador = db.Column(db.Integer, primary_key=True)  # Padronizado
    nome = db.Column(db.String(255), nullable=False)
    telefone = db.Column(db.String(20), unique=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)  # Determina se é administrador
    admin_nivel = db.Column(db.String(50), nullable=True)  # 'geral' ou 'restrito'
    referencias = db.Column(db.Text)
    cargo = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    photo = db.Column(db.String(255), nullable=True)
    endereco_id = db.Column(db.Integer, db.ForeignKey('enderecos.id_endereco'), nullable=True)

    # Relacionamentos
    endereco = db.relationship('Enderecos', back_populates='colaboradores')
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
            'id_Colaborador': self.id_Colaborador,
            'nome': self.nome,
            'cargo': self.cargo
        }

# Modelo: Clientes
class Clientes(db.Model):
    __tablename__ = 'clientes'
    id_cliente = db.Column(db.Integer, primary_key=True)  # Padronizado
    nome = db.Column(db.String(255), nullable=False)
    telefone = db.Column(db.String(20), unique=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    referencias = db.Column(db.Text)
    dt_nasc = db.Column(db.Date)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    photo = db.Column(db.String(255), nullable=True)
    endereco_id = db.Column(db.Integer, db.ForeignKey('enderecos.id_endereco'), nullable=True)

    # Relacionamentos
    endereco = db.relationship('Enderecos', back_populates='clientes')

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
    id_servico = db.Column(db.Integer, primary_key=True)  # Padronizado
    nome = db.Column(db.String(255), nullable=False)
    descricao = db.Column(db.Text)
    valor = db.Column(db.Numeric(10, 2), nullable=True)  # Valor pode ser None para Pilates

    # Relacionamentos
    tipo_servicos = db.relationship('TipoServico', secondary='servicos_tipo_servico', back_populates='servicos')
    colaboradores = db.relationship('Colaboradores', secondary='colaboradores_servicos', back_populates='servicos')

    def set_valor(self, tipo_servico):
        # Se o tipo for fisioterapia, o valor é fixo
        if tipo_servico == "fisioterapia":
            # Defina o valor fixo para fisioterapia
            self.valor = 120.00  # Exemplo de valor fixo para fisioterapia
        # Para pilates, o valor será atribuído pelos planos
        elif tipo_servico == "pilates":
            self.valor = None


# Modelo: Planos
class Planos(db.Model):
    __tablename__ = 'planos'
    id_plano = db.Column(db.Integer, primary_key=True)  # Padronizado
    nome = db.Column(db.String(255), nullable=False)
    descricao = db.Column(db.Text)
    valor = db.Column(db.Numeric(10, 2), nullable=False)  # Valor definido no plano
    servico_id = db.Column(db.Integer, db.ForeignKey('servicos.id_servico'), nullable=False)

    # Relacionamento com o serviço
    servico = db.relationship('Servicos', backref='planos')


# Modelo: TipoServico
class TipoServico(db.Model):
    __tablename__ = 'tipo_servico'
    id_tipo_servico = db.Column(db.Integer, primary_key=True)  # Padronizado
    tipo = db.Column(db.String(50), nullable=False)  # Ex: "fisioterapia" ou "pilates"

    # Relacionamentos
    servicos = db.relationship('Servicos', secondary='servicos_tipo_servico', back_populates='tipo_servicos')


# Tabelas Associativas
class ServicosTipoServico(db.Model):
    __tablename__ = 'servicos_tipo_servico'
    servico_id = db.Column(db.Integer, db.ForeignKey('servicos.id_servico'), primary_key=True)
    tipo_servico_id = db.Column(db.Integer, db.ForeignKey('tipo_servico.id_tipo_servico'), primary_key=True)

class ColaboradoresServicos(db.Model):
    __tablename__ = 'colaboradores_servicos'
    colaborador_id = db.Column(db.Integer, db.ForeignKey('colaboradores.id_colaborador'), primary_key=True)
    servico_id = db.Column(db.Integer, db.ForeignKey('servicos.id_servico'), primary_key=True)

# Modelo: Horários
class Horarios(db.Model):
    __tablename__ = 'horarios'
    id_horario = db.Column(db.Integer, primary_key=True)  # Padronizado
    id_colaborador = db.Column(db.Integer, db.ForeignKey('colaboradores.id_colaborador'), nullable=False)
    dia_semana = db.Column(db.String(50), nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fim = db.Column(db.Time, nullable=False)

    colaborador = db.relationship('Colaboradores', back_populates='horarios')
    def __repr__(self):
        return f'<Horário {self.dia_semana} - {self.hora_inicio} até {self.hora_fim}>'

# Modelo: Agendamentos
class Agendamentos(db.Model):
    __tablename__ = 'agendamentos'
    id_agendamento = db.Column(db.Integer, primary_key=True)
    data_e_hora = db.Column(db.DateTime, nullable=False)
    id_cliente = db.Column(db.Integer, db.ForeignKey('clientes.id_cliente'), nullable=False)
    id_colaborador = db.Column(db.Integer, db.ForeignKey('colaboradores.id_colaborador'), nullable=False)
    id_servico = db.Column(db.Integer, db.ForeignKey('servicos.id_servico'), nullable=False)
    status = db.Column(db.String(20), default="pendente")
    id_clinica = db.Column(db.Integer, db.ForeignKey('clinicas.id_clinica'), nullable=False)  # Novo campo para a clínica

    cliente = db.relationship('Clientes', backref='agendamentos')
    colaborador = db.relationship('Colaboradores', backref='agendamentos')
    servico = db.relationship('Servicos', backref='agendamentos')
    clinica = db.relationship('Clinicas', backref='agendamentos')  # Relacionamento com clínica


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
                is_admin=True,
                admin_nivel='geral'
            )
            admin.set_password('12345')  # Certifique-se de que o método de criptografia funciona corretamente
            db.session.add(admin)

    enderecos = [
    {"rua": "Rua A", "numero": "123", "bairro": "Centro", "cidade": "Cidade A", "estado": "SP"},
    {"rua": "Rua B", "numero": "456", "bairro": "Bairro B", "cidade": "Cidade B", "estado": "RJ"}
]

    # Adicionar endereços e clínicas ao banco de dados
    for endereco in enderecos:
        endereco_existente = Enderecos.query.filter_by(rua=endereco["rua"]).first()
        if not endereco_existente:
            novo_endereco = Enderecos(**endereco)
            db.session.add(novo_endereco)
            db.session.commit()
            endereco_existente = novo_endereco

        # Verificar se a clínica já existe pelo CNPJ
        clinica_existente = Clinicas.query.filter_by(cnpj="12.345.678/0001-90").first()
        if not clinica_existente:
            clinica = Clinicas(
                nome=f"Clínica {endereco['bairro']}",
                cnpj="12.345.678/0001-90",
                endereco_id=endereco_existente.id_endereco
            )
            db.session.add(clinica)
            db.session.commit()


   # Definir os serviços
    servicos = [
        {
            "nome": "Fisioterapia Clássica",  # Corrigido para "nome"
            "descricao": "Tratamento de lesões e dores musculares e articulares usando técnicas como termoterapia, eletroterapia, laser e crioterapia.",
            "valor": 120.00,
            "tipo_servico": "fisioterapia",
        },
        {
            "nome": "Reabilitação Pós-Cirúrgica",  # Corrigido para "nome"
            "descricao": "Tratamentos específicos para ajudar na recuperação após cirurgias, focando na restauração da função e força muscular.",
            "valor": 130.00,
            "tipo_servico": "fisioterapia",
        },
        # Serviços Pilates com planos separados
        {
            "nome": "Pilates Clínico",  # Corrigido para "nome"
            "descricao": "Focado no controle da respiração, fortalecimento do core e melhoria da postura.",
            "valor": None,  # Valor não aplicável diretamente, definido pelos planos
            "tipo_servico": "pilates",
        },
        {
            "nome": "Pilates Tradicional",  # Corrigido para "nome"
            "descricao": "Aulas de Pilates para aumentar flexibilidade e força.",
            "valor": None,  # Valor não aplicável diretamente, definido pelos planos
            "tipo_servico": "pilates",
        },
    ]

    # Inserir os serviços no banco de dados
    for servico in servicos:
        exists = Servicos.query.filter_by(nome=servico["nome"]).first()  # Corrigido para "nome"
        if not exists:
            new_servico = Servicos(
                nome=servico["nome"],
                descricao=servico["descricao"],
                valor=servico.get("valor"),
            )
            db.session.add(new_servico)

    db.session.commit()  # Não se esqueça de fazer o commit para persistir as alterações


    # Salvar os serviços no banco de dados
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

    # Criar colaboradores
    colaboradores = [
        {"nome": "João Victor Ramos de Souza", "email": "joao.ramos.souza@gmail.com", "telefone": "999988888", "cargo": "Fisioterapeuta", "cpf": "11111111111", "admin_nivel": "geral"},
        {"nome": "Lucas Alves", "email": "lucas@teste.com", "telefone": "999977677", "cargo": "Fisioterapeuta", "cpf": "22222222222", "admin_nivel": "restrito"},
        {"nome": "Eveline Almeida", "email": "lucas@teste.com", "telefone": "999970777", "cargo": "Fisioterapeuta", "cpf": "32222222222", "admin_nivel": "restrito"},
        {"nome": "Aline Rayane", "email": "Aline@teste.com", "telefone": "999977747", "cargo": "Fisioterapeuta", "cpf": "42222222222", "admin_nivel": "restrito"},
        {"nome": "Manases", "email": "Manases@teste.com", "telefone": "999977777", "cargo": "Fisioterapeuta", "cpf": "52222222222", "admin_nivel": "restrito"},
        
    ]

    for colaborador in colaboradores:
        exists = Colaboradores.query.filter_by(email=colaborador["email"]).first()
        if not exists:
            novo_colaborador = Colaboradores(
                nome=colaborador["nome"],
                email=colaborador["email"],
                telefone=colaborador["telefone"],
                cargo=colaborador["cargo"],
                cpf=colaborador["cpf"],
                admin_nivel=colaborador["admin_nivel"]
            )
            novo_colaborador.set_password("123")  # Criptografando a senha
            db.session.add(novo_colaborador)

    # Salvar colaboradores no banco de dados
    db.session.commit()

    # Associar colaboradores aos serviços
    for colaborador in Colaboradores.query.all():
        servico = Servicos.query.filter_by(nome="Fisioterapia Clássica").first()
        if servico and servico not in colaborador.servicos:
            colaborador.servicos.append(servico)

    db.session.commit()

    # Criar horários para colaboradores
    default_horarios = [
        {"dia_semana": "Segunda-feira", "hora_inicio": "08:00:00", "hora_fim": "12:00:00"},
        {"dia_semana": "Quarta-feira", "hora_inicio": "14:00:00", "hora_fim": "18:00:00"},
    ]

    colaboradores_registrados = Colaboradores.query.all()
    for idx, colaborador in enumerate(colaboradores_registrados):
        horario_existe = Horarios.query.filter_by(id_colaborador=colaborador.id_colaborador).first()
        if not horario_existe:
            horario = default_horarios[idx % len(default_horarios)]
            new_horario = Horarios(
                id_colaborador=colaborador.id_colaborador,
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
        # Adicionar mais clientes conforme necessário
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
