import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///fisiomais.db'  # Substitua pelo URI do seu banco
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'Senha123'
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')  # Caminho relativo à pasta backend
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}  # Extensões permitidas
