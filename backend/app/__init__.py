#cd backend
#python -m venv venv(a primeira vez)
#.\venv\Scripts\activate
#pip freeze > requirements.txt (caso adicionem uma nova importação)
#pip install -r requirements.txt
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
    if not app.debug:  # Evita logs duplicados em modo debug
        log_file = "app.log"
        max_size = 10 * 1024 * 1024  # Tamanho máximo do arquivo (10 MB)
        backup_count = 5  # Número máximo de backups

        # Configura o handler para rotacionar os arquivos de log
        file_handler = RotatingFileHandler(log_file, maxBytes=max_size, backupCount=backup_count)
        file_handler.setLevel(logging.INFO)  # Nível de log

        # Formato das mensagens de log
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(formatter)

        # Adicionar o handler ao logger principal da aplicação
        app.logger.addHandler(file_handler)

    # Registrar o before_request para logging em todas as rotas
    @app.before_request
    def log_request_info():
        """Log de informações de cada requisição recebida."""
        current_app.logger.info(
            f"[{datetime.now()}] Requisição recebida: {request.method} {request.path} | "
            f"IP: {request.remote_addr} | Dados: {request.get_json(silent=True)}"
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
        from app.services import populate_database
        from app.rotas.routes import main
        from app.rotas.routesClientes import clientes
        from app.rotas.routesColaboradores import colaboradores
        from app.rotas.routesAgendamentos import agendamentos       
        from app.rotas.routesUsers import usuarios
        from app.rotas.routesServicos import servicos
        from app.rotas.routesClinicas import clinicas
        from app.rotas.routesDashboards import dashboards
        from app.rotas.routesPagamentos import pagamentos_faturas
       

        app.register_blueprint(main, url_prefix='/')
        app.register_blueprint(usuarios, url_prefix='/usuarios')
        app.register_blueprint(colaboradores, url_prefix='/colaboradores', name='colaboradores_blueprint')
        app.register_blueprint(clientes, url_prefix='/clientes', name='clientes_blueprint')
        app.register_blueprint(servicos, url_prefix='/servicos', name='servicos_blueprint')
        app.register_blueprint(agendamentos, url_prefix='/agendamentos', name='agendamentos_blueprint')
        app.register_blueprint(clinicas, url_prefix='/clinicas', name='clinicas_blueprint')
        app.register_blueprint(dashboards, url_prefix='/dashboards', name='dashboards_blueprint')
        app.register_blueprint(pagamentos_faturas, url_prefix='/pagamentos', name='pagamentos_blueprint')

        # Garantir que a pasta de uploads exista
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])

        # Registrar os modelos e criar tabelas
        db.create_all()  # Cria as tabelas no banco de dados
        populate_database()  # Popular o banco com dados iniciais, se necessário

    return app



