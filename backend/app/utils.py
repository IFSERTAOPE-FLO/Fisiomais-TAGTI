
from flask_mail import Message
from flask import current_app
from app import mail

def is_cpf_valid(cpf):
    cpf = cpf.replace('.', '').replace('-', '').strip()
    if len(cpf) != 11 or not cpf.isdigit() or cpf == cpf[0] * len(cpf):
        return False
    for i in range(9, 11):
        value = sum((int(cpf[num]) * ((i + 1) - num) for num in range(0, i)))
        digit = ((value * 10) % 11) % 10
        if digit != int(cpf[i]):
            return False
    return True


def send_email(subject, recipients, body, sender=None):
    """
    Envia um email usando a configuração do Flask-Mail.
    
    Args:
        subject (str): Assunto do email.
        recipients (list): Lista de destinatários.
        body (str): Conteúdo do email.
        sender (str, optional): Remetente do email. Se não fornecido, usa o MAIL_DEFAULT_SENDER.
    
    Returns:
        None
    """
    try:
        sender = sender or current_app.config.get('MAIL_DEFAULT_SENDER')
        if not sender:
            raise ValueError("MAIL_DEFAULT_SENDER não configurado")

        msg = Message(subject=subject, recipients=recipients, body=body, sender=sender)
        mail.send(msg)
    except Exception as e:
        raise RuntimeError(f"Erro ao enviar email: {str(e)}")
