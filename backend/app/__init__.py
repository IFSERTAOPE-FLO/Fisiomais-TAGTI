#python -m venv venv
#.\venv\Scripts\activate
#pip install -r requirements.txt
#fisiomaispilatesefisioterapia@gmail.com  12345

#DBeaver baixar para trabalhar com o sqlite
#flask db migrate -m "mensagem"
#flask db upgrade


from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
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
    CORS(app) # Habilita CORS
    jwt = JWTManager(app)

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

        app.register_blueprint(main, url_prefix='/')
        app.register_blueprint(usuarios, url_prefix='/usuarios')
        app.register_blueprint(colaboradores, url_prefix='/colaboradores')
        app.register_blueprint(clientes, url_prefix='/clientes')
        app.register_blueprint(servicos, url_prefix='/servicos')
        app.register_blueprint(agendamentos, url_prefix='/agendamentos')
        app.register_blueprint(clinicas, url_prefix='/clinicas')
        

        # Garantir que a pasta de uploads exista
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])

        # Registrar os modelos e criar tabelas
        db.create_all()  # Cria as tabelas no banco de dados
        populate_database()  # Popular o banco com dados iniciais, se necessário

    return app



