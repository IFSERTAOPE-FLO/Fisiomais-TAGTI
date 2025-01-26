from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from flask import url_for

# Modelo: Endereços
class Enderecos(db.Model):
    __tablename__ = 'enderecos'
    id_endereco = db.Column(db.Integer, primary_key=True)  # Padronizado
    rua = db.Column(db.String(255), nullable=True)  # Tornado opcional
    numero = db.Column(db.String(20), nullable=True) 
    complemento = db.Column(db.String(255), nullable=True)
    bairro = db.Column(db.String(100), nullable=True)  
    cidade = db.Column(db.String(100), nullable=True)  
    estado = db.Column(db.String(50), nullable=True)  

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
    telefone = db.Column(db.String(20), unique=True)

    # Relacionamentos
    endereco = db.relationship('Enderecos', back_populates='clinicas')
    colaboradores = db.relationship('Colaboradores', back_populates='clinica')  # Relacionamento com Colaboradores


# Modelo: Colaboradores
class Colaboradores(db.Model):
    __tablename__ = 'colaboradores'
    id_colaborador = db.Column(db.Integer, primary_key=True)  # Padronizado
    nome = db.Column(db.String(255), nullable=False)
    telefone = db.Column(db.String(20), unique=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    sexo = db.Column(db.String(20), nullable=True)  # Campo opcional
    dt_nasc = db.Column(db.Date, nullable=True) 
    is_admin = db.Column(db.Boolean, default=False)  # Determina se é administrador
    admin_nivel = db.Column(db.String(50), nullable=True)  # 'geral' ou 'restrito'
    referencias = db.Column(db.Text)
    cargo = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    photo = db.Column(db.String(255), nullable=True)
    endereco_id = db.Column(db.Integer, db.ForeignKey('enderecos.id_endereco'), nullable=True)
    clinica_id = db.Column(db.Integer, db.ForeignKey('clinicas.id_clinica'), nullable=True)  # Relacionamento com Clínica

    # Relacionamentos
    endereco = db.relationship('Enderecos', back_populates='colaboradores')
    clinica = db.relationship('Clinicas', back_populates='colaboradores')  # Relacionamento com Clínica
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
            'id_colaborador': self.id_colaborador,
            'nome': self.nome,
            'cargo': self.cargo,
            'sexo': self.sexo,  # Incluindo opcionalmente no dict
            'dt_nasc': self.dt_nasc  # Incluindo opcionalmente no dict
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
    dt_nasc = db.Column(db.Date, nullable=True)  # Campo opcional
    sexo = db.Column(db.String(20), nullable=True)  # Campo opcional
    cpf = db.Column(db.String(11), unique=True, nullable=False)
    photo = db.Column(db.String(255), nullable=True)
    endereco_id = db.Column(db.Integer, db.ForeignKey('enderecos.id_endereco'), nullable=True)

    # Novos campos para verificação de email
    email_confirmado = db.Column(db.Boolean, default=False, nullable=False)
    token_confirmacao = db.Column(db.String(128), nullable=True)

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
    data_e_hora = db.Column(db.DateTime, nullable=True)
    id_cliente = db.Column(db.Integer, db.ForeignKey('clientes.id_cliente'), nullable=False)
    id_colaborador = db.Column(db.Integer, db.ForeignKey('colaboradores.id_colaborador'), nullable=False)
    id_servico = db.Column(db.Integer, db.ForeignKey('servicos.id_servico'), nullable=False)
    status = db.Column(db.String(20), default="pendente")
    id_clinica = db.Column(db.Integer, db.ForeignKey('clinicas.id_clinica'), nullable=False)  # Novo campo para a clínica

    cliente = db.relationship('Clientes', backref='agendamentos')
    colaborador = db.relationship('Colaboradores', backref='agendamentos')
    servico = db.relationship('Servicos', backref='agendamentos')
    clinica = db.relationship('Clinicas', backref='agendamentos')  # Relacionamento com clínica

class Pagamentos(db.Model):
    __tablename__ = 'pagamentos'
    id_pagamento = db.Column(db.Integer, primary_key=True)  # ID único
    id_agendamento = db.Column(db.Integer, db.ForeignKey('agendamentos.id_agendamento'), nullable=False)  # Relacionamento com o agendamento
    valor = db.Column(db.Numeric(10, 2), nullable=False)  # Valor pago
    metodo_pagamento = db.Column(db.String(50), nullable=False)  # Ex: 'cartão', 'boleto', 'pix'
    status = db.Column(db.String(20), nullable=False, default='pendente')  # 'pendente', 'pago', 'cancelado'
    data_pagamento = db.Column(db.DateTime, nullable=True)  # Data de conclusão do pagamento
    referencia_pagamento = db.Column(db.String(255), nullable=True)  # Referência de terceiros (ex: ID de pagamento externo)

    agendamento = db.relationship('Agendamentos', backref='pagamento')

class Faturas(db.Model):
    __tablename__ = 'faturas'
    id_fatura = db.Column(db.Integer, primary_key=True)  # ID único
    id_cliente = db.Column(db.Integer, db.ForeignKey('clientes.id_cliente'), nullable=False)  # Relacionamento com cliente
    id_pagamento = db.Column(db.Integer, db.ForeignKey('pagamentos.id_pagamento'), nullable=False)  # Relacionamento com pagamento
    data_emissao = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)  # Data de emissão da fatura
    vencimento = db.Column(db.DateTime, nullable=False)  # Data de vencimento
    valor_total = db.Column(db.Numeric(10, 2), nullable=False)  # Valor total da fatura
    status = db.Column(db.String(20), default='pendente')  # 'pendente', 'paga', 'atrasada'

    cliente = db.relationship('Clientes', backref='faturas')
    pagamento = db.relationship('Pagamentos', backref='faturas')

class PlanosTratamento(db.Model):
    __tablename__ = 'planos_tratamento'
    id_plano_tratamento = db.Column(db.Integer, primary_key=True)  # ID único do plano de tratamento
    id_cliente = db.Column(db.Integer, db.ForeignKey('clientes.id_cliente'), nullable=False)  # Relacionamento com Cliente
    id_colaborador = db.Column(db.Integer, db.ForeignKey('colaboradores.id_colaborador'), nullable=False)  # Relacionamento com Colaborador
    id_servico = db.Column(db.Integer, db.ForeignKey('servicos.id_servico'), nullable=False)  # Relacionamento com Serviço
    diagnostico = db.Column(db.Text, nullable=False)  # Diagnóstico inicial do paciente
    objetivos = db.Column(db.Text, nullable=False)  # Objetivos do plano de tratamento
    metodologia = db.Column(db.Text, nullable=True)  # Métodos propostos para o tratamento
    duracao_prevista = db.Column(db.Integer, nullable=False)  # Duração prevista em semanas
    data_inicio = db.Column(db.Date, nullable=False, default=datetime.utcnow)  # Data de início do plano
    data_fim = db.Column(db.Date, nullable=True)  # Data de término do plano (opcional)

    # Relacionamentos
    cliente = db.relationship('Clientes', backref='planos_tratamento')
    colaborador = db.relationship('Colaboradores', backref='planos_tratamento')
    servico = db.relationship('Servicos', backref='planos_tratamento')

class HistoricoSessao(db.Model):
    __tablename__ = 'historico_sessao'
    id_sessao = db.Column(db.Integer, primary_key=True)  # ID único da sessão
    id_plano_tratamento = db.Column(db.Integer, db.ForeignKey('planos_tratamento.id_plano_tratamento'), nullable=False)  # Relacionamento com PlanoTratamento
    data_sessao = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)  # Data e hora da sessão
    detalhes = db.Column(db.Text, nullable=True)  # Detalhes das atividades da sessão
    observacoes = db.Column(db.Text, nullable=True)  # Observações feitas pelo colaborador
    avaliacao_cliente = db.Column(db.Text, nullable=True)  # Avaliação ou feedback do cliente
    ficha_anamnese = db.Column(db.String(255), nullable=True)  # Caminho ou nome do arquivo da ficha de anamnese

    # Relacionamento
    plano_tratamento = db.relationship('PlanosTratamento', backref='historico_sessao')


class BlacklistedToken(db.Model):
    __tablename__ = 'blacklisted_tokens'

    id = db.Column(db.Integer, primary_key=True)  # ID auto-incremental
    jti = db.Column(db.String(255), unique=True, nullable=False)  # O JTI é único para cada token

    def __repr__(self):
        return f'<BlacklistedToken {self.jti}>'


