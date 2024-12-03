import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///fisiomais.db'  # Substitua pelo URI do seu banco
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'Senha123'
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')  # Caminho relativo à pasta backend
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}  # Extensões permitidas
    MAIL_SERVER = 'smtp.gmail.com'  # Ou outro servidor de email
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'fisiomaispilatesefisioterapia@gmail.com'
    MAIL_PASSWORD = 'MaisFisio!'
    MAIL_DEFAULT_SENDER = 'fisiomaispilatesefisioterapia@gmail.com'