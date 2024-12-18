from backend.app.celery_beat import Celery
from datetime import datetime, timedelta
from backend.app.rotas.routes import notificar_atendimentos  # Importando a função

celery = Celery('tasks', broker='redis://localhost:6379/0')

@celery.task
def enviar_notificacoes():
    notificar_atendimentos()