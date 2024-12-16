import sys
import os
from flask_mail import Mail, Message
from flask import Flask

# Adicionar o diretório raiz ao sys.path para resolver o caminho do módulo backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Configurar a aplicação Flask
app = Flask(__name__)
app.config.from_object('backend.config.Config')  # Importa as configurações do arquivo config.py
mail = Mail(app)

with app.app_context():
    msg = Message(
        'Teste de e-mail',
        sender=app.config['MAIL_DEFAULT_SENDER'],
        recipients=['jvrs2009@gmail.com']
    )
    msg.body = "Este é um teste de envio de e-mail."
    try:
        mail.send(msg)
        print("E-mail enviado com sucesso.")
    except Exception as e:
        print(f"Erro ao enviar e-mail: {str(e)}")
