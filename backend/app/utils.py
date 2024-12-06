# utils.py
from backend.app.celery_beat import Celery
from backend.app.routes import notificar_atendimentos  # Importando a função

celery = Celery('tasks', broker='redis://localhost:6379/0')

@celery.task
def enviar_notificacoes_diarias():
    notificar_atendimentos()