#python -m venv venv
#.\venv\Scripts\activate
#pip install -r requirements.txt
#admin@teste.com  12345
from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from apscheduler.schedulers.background import BackgroundScheduler
import os

# Instâncias do SQLAlchemy, Mail e JWTManager
db = SQLAlchemy()
mail = Mail()
migrate = Migrate()
def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')  # Carrega as configurações do arquivo config.py
    
    # Inicializa a aplicação com as extensões
    db.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)
    jwt = JWTManager(app)

    # Criar e iniciar o agendador
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=agendar_notificacao, trigger='interval', hours=24, args=[app])  # Passa app como argumento para a função
    scheduler.start()

    # Garantir que a pasta de uploads exista
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    # Importar e registrar o Blueprint
    from app.routes import main
    app.register_blueprint(main, url_prefix='/')

    # Habilitar CORS
    CORS(app)

    # Registrar os modelos e criar tabelas
    with app.app_context():
        from app.models import Colaboradores, Clientes, Agendamentos, Servicos, populate_database
        db.create_all()  # Cria as tabelas no banco de dados
        populate_database()  # Popular o banco com dados iniciais, se necessário

    return app

# Função para agendar a notificação
def agendar_notificacao(app):  # Agora recebe o app como argumento
    from app.routes import notificar_atendimentos  # Importar a função diretamente aqui

    # Usando o contexto da aplicação para garantir que o acesso ao banco de dados seja feito corretamente
    with app.app_context():
        notificar_atendimentos()  # Chama a função que envia notificações


