from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from apscheduler.schedulers.background import BackgroundScheduler
import os

# Instâncias do SQLAlchemy, Mail e JWTManager
db = SQLAlchemy()
mail = Mail()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')  # Carrega as configurações do arquivo config.py
    
    # Inicializa a aplicação com as extensões
    db.init_app(app)
    mail.init_app(app)
    jwt = JWTManager(app)

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

    # Configuração do agendador para notificações
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=agendar_notificacao, trigger='interval', hours=24)  # Executar a cada 24 horas
    scheduler.start()

    return app

# Função de notificação agendada
def agendar_notificacao():
    with app.app_context():
        from app.routes import main
        # Aqui você chama o método que vai enviar as notificações
        main.notificar_atendimentos()
