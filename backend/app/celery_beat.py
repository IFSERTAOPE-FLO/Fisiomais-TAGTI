from celery import Celery
import schedule
import time

def enviar_notificacoes_diarias():
    enviar_notificacoes.apply_async()

schedule.every().day.at("08:00").do(enviar_notificacoes_diarias)

while True:
    schedule.run_pending()
    time.sleep(60)
