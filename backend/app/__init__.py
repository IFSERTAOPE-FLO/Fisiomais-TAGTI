#cd backend
#python -m venv venv(a primeira vez)
#.\venv\scripts\activate

#pip install -r requirements.txt

#pip freeze > requirements.txt (Apenas caso adicionem uma nova importação do flask)
#flask run
#email: fisiomaispilatesefisioterapia@gmail.com  senha: 12345

#DBeaver baixar para trabalhar com o sqlite
#atualização de mudanças no banco de dados
#flask db init
#flask db migrate -m "descreva aqui a mudança que voce fez"
#flask db upgrade

#abra um novo cmd
#cd frontend
#npm install (a primeira vez)
#npm start


from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask import request, current_app
from datetime import datetime

import logging
from logging.handlers import RotatingFileHandler
import os

# Instâncias do SQLAlchemy, Mail e JWTManager
db = SQLAlchemy()
mail = Mail()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')  # Carrega as configurações do arquivo config.py
    # Configurar logging centralizado
    # Definir o diretório de logs
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)  # Cria o diretório se não existir

    # Definir o caminho completo para o arquivo de log
    log_file = os.path.join(log_dir, "app.log")

    # Mantenha a configuração do logger independentemente do modo de depuração
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)  # Cria o diretório se não existir

    log_file = os.path.join(log_dir, "app.log")
    max_size = 10 * 1024 * 1024  # Tamanho máximo do arquivo (10 MB)
    backup_count = 5  # Número máximo de backups 

    file_handler = RotatingFileHandler(log_file, maxBytes=max_size, backupCount=backup_count)
    file_handler.setLevel(logging.DEBUG) if app.debug else file_handler.setLevel(logging.INFO)

    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    file_handler.setFormatter(formatter)

    app.logger.addHandler(file_handler)
    
    from flask_jwt_extended import get_jwt_identity, jwt_required
    from flask import request, current_app
    from datetime import datetime

    from flask_jwt_extended import verify_jwt_in_request  # Adicione este import

    @app.before_request    
    def log_request_info():
        
        if request.method == 'GET':
            return

        log_data = request.get_json(silent=True) or {}
        email_logado = "Não logado"

        try:
            # Verifica primeiro se há um token válido na requisição
            verify_jwt_in_request(optional=True)  # Verificação explícita
            email_logado = get_jwt_identity() or "Não logado"  # Agora seguro para usar
        except Exception as e:
            current_app.logger.error(f"Erro JWT na requisição: {str(e)}")
            email_logado = "Erro no token"

        # Guardar a senha para posterior log, sem alterar a requisição
        senha = log_data.get('senha', None)

        # Criar uma cópia da requisição sem a senha
        log_data_for_logging = log_data.copy()

        # Substituir a senha no log por asteriscos
        if senha:
            log_data_for_logging['senha'] = "***"
        
        # Registrar o log com o email do usuário logado
        current_app.logger.info(
            f"[{datetime.now()}] Requisição recebida: {request.method} {request.path} | "
            f"IP: {request.remote_addr} | Email Logado: {email_logado} | Dados: {log_data_for_logging}"
        )

    # Inicializa a aplicação com as extensões
    db.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)
    CORS(app) # Habilita CORS conexão com frontend em react
    jwt = JWTManager(app)
    # Chama a função para registrar o painel admin
    from app.admin import init_admin
    init_admin(app)

    with app.app_context():
        # Importar modelos e rotas aqui dentro para evitar importação circular
        from app.services import populate_database, populate_database_extra
        from app.rotas.routes import main
        from app.rotas.routesClientes import clientes
        from app.rotas.routesColaboradores import colaboradores
        from app.rotas.routesAgendamentos import agendamentos       
        from app.rotas.routesUsers import usuarios
        from app.rotas.routesServicos import servicos
        from app.rotas.routesClinicas import clinicas
        from app.rotas.routesDashboards import dashboards
        from app.rotas.routesPagamentos import pagamentos_faturas
        from app.rotas.routesPilates import pilates
        from app.rotas.routesPlanosTratamentos import planos_de_tratamento
        from app.rotas.routesHistorico import historico_sessoes
       

        app.register_blueprint(main, url_prefix='/')
        app.register_blueprint(usuarios, url_prefix='/usuarios')
        app.register_blueprint(colaboradores, url_prefix='/colaboradores', name='colaboradores_blueprint')
        app.register_blueprint(clientes, url_prefix='/clientes', name='clientes_blueprint')
        app.register_blueprint(servicos, url_prefix='/servicos', name='servicos_blueprint')
        app.register_blueprint(agendamentos, url_prefix='/agendamentos', name='agendamentos_blueprint')
        app.register_blueprint(clinicas, url_prefix='/clinicas', name='clinicas_blueprint')
        app.register_blueprint(dashboards, url_prefix='/dashboards', name='dashboards_blueprint')
        app.register_blueprint(pagamentos_faturas, url_prefix='/pagamentos', name='pagamentos_blueprint')
        app.register_blueprint(pilates, url_prefix='/pilates', name='pilates')
        app.register_blueprint(planos_de_tratamento, url_prefix='/planos_de_tratamento', name='planos_de_tratamento_blueprint')
        app.register_blueprint(historico_sessoes, url_prefix='/historico_sessoes', name='historico_sessoes_blueprint')

        # Garantir que a pasta de uploads exista
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])

        # Registrar os modelos e criar tabelas
        db.create_all()  # Cria as tabelas no banco de dados
        populate_database()  # Popular o banco com dados iniciais, se necessário
        populate_database_extra()

    return app



