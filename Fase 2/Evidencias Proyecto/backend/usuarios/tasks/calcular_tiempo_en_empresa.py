# formulario/tasks.py
import threading
import time
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from usuarios.models import User
from django.contrib.auth.models import Group
import logging
import os

logger = logging.getLogger(__name__)


def calcular_tiempo(date_joined: date):
    hoy = date.today()
    delta_dias = (hoy - date_joined).days

    diff = relativedelta(hoy, date_joined)
    anios = diff.years
    meses = diff.months
    dias = diff.days

    tiempo_str = f"{anios} años, {meses} meses y {dias} días"
    return delta_dias, tiempo_str


def actualizar_tiempos():
    logger.info("🕒 Iniciando actualización de días en empresa...")
    for user in User.objects.exclude(date_joined__isnull=True):
        tiempo, tiempo_en = calcular_tiempo(user.date_joined)
        user.tiempo = tiempo
        user.tiempo_en = tiempo_en
        user.save(update_fields=['tiempo', 'tiempo_en'])
    logger.info("✅ Actualización completa de días en empresa.")


def actualizar_grupo_usuarios():
    try:
        grupo_1er_ingreso = Group.objects.get(name="1er ingreso")
        grupo_basico = Group.objects.get(name="Básico")
    except Group.DoesNotExist:
        logger.error("❌ Uno de los grupos no existe: '1er ingreso' o 'Básico'")
        return

    hoy = date.today()
    usuarios = User.objects.filter(group=grupo_1er_ingreso, is_active=True)

    for user in usuarios:
        if user.date_joined:
            dias = (hoy - user.date_joined).days
            if dias >= 183:
                user.group = grupo_basico
                user.save(update_fields=['group'])
                logger.info(f"🔁 Usuario {user.username} movido a grupo 'Básico' ({dias} días)")



def iniciar_actualizacion_diaria():
    # Prevenir múltiples hilos usando el PID como lock único
    if os.environ.get("DJANGO_UPDATE_STARTED") == "true":
        logger.info("⚠️ El hilo de actualización ya está marcado como iniciado. No se duplica.")
        return

    os.environ["DJANGO_UPDATE_STARTED"] = "true"
    logger.info("🚀 Hilo de actualización diaria iniciado correctamente.")

    def tarea():
        while True:
            ahora = datetime.now()
            hora_objetivo = ahora.replace(hour=3, minute=0, second=0, microsecond=0)
            if ahora > hora_objetivo:
                hora_objetivo += timedelta(days=1)

            segundos_espera = (hora_objetivo - ahora).total_seconds()
            logger.info(f"🕒 Esperando {segundos_espera / 60:.2f} minutos para la actualización diaria...")
            time.sleep(segundos_espera)

            from usuarios.tasks.calcular_tiempo_en_empresa import actualizar_tiempos, actualizar_grupo_usuarios
            actualizar_tiempos()
            actualizar_grupo_usuarios()

            time.sleep(86400)

    threading.Thread(target=tarea, daemon=True).start()