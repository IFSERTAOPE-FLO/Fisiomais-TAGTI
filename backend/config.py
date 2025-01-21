from dotenv import load_dotenv
import os
from datetime import timedelta

# Carregar o arquivo .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class Config:
    # Configurações do banco de dados
    SQLALCHEMY_DATABASE_URI = 'sqlite:///fisiomais.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configurações gerais
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')  # Valor padrão se não estiver no .env
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

    # Configurações de e-mail
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'default-sender@example.com')

    # Configurações de JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1) # Tempo do access token
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)    # Tempo do refresh token

    # Criar pasta de uploads se não existir
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
