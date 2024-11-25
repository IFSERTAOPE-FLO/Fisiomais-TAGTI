#python -m venv venv
#.\venv\Scripts\activate
#pip install flask
#admin@teste.com  12345

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os



# Instância do SQLAlchemy
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    db.init_app(app)
    # Inicialize o JWTManager
    app.config['JWT_SECRET_KEY'] = 'Senha123'  # Use uma chave secreta segura
    jwt = JWTManager(app) 

    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    # Importar e registrar o Blueprint
    from app.routes import main
    app.register_blueprint(main, url_prefix='/')

    # Habilitar CORS
    CORS(app)

    # Registrar os modelos e criar tabelas
    with app.app_context():
        from app.models import Colaboradores, Clientes, Agendamentos, Servicos, Pagamentos, populate_database
        db.create_all()
        populate_database()

    return app
