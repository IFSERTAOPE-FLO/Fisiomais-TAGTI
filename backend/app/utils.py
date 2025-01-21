
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
import re

def is_cnpj_valid(cnpj: str) -> bool:
    # Remover caracteres não numéricos
    cnpj = re.sub(r'\D', '', cnpj)

    # Verificar se o CNPJ possui 14 caracteres
    if len(cnpj) != 14:
        return False

    # Impedir CNPJs com números repetidos (exemplo: 11111111111111)
    if cnpj == cnpj[0] * 14:
        return False

    # Cálculo dos dois dígitos verificadores
    def calcular_dv(cnpj: str, pesos: list) -> int:
        soma = sum(int(cnpj[i]) * pesos[i] for i in range(len(pesos)))
        resto = soma % 11
        if resto < 2:
            return 0
        return 11 - resto

    # Pesos para o primeiro e segundo dígito verificador
    pesos_primeiro_dv = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos_segundo_dv = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    # Calcular o primeiro e o segundo dígito verificador
    primeiro_dv = calcular_dv(cnpj, pesos_primeiro_dv)
    segundo_dv = calcular_dv(cnpj, pesos_segundo_dv)

    # Verificar se os dígitos verificadores calculados são iguais aos do CNPJ
    return cnpj[-2:] == f"{primeiro_dv}{segundo_dv}"
