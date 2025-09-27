import os
import django
from datetime import datetime
import logging

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'colegio.settings')
django.setup()

from proyectoapp.models import User  # Después de setup()

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/verificaciones.log'),
        logging.StreamHandler()
    ]
)

def verificar_dias_cumpleanos():
    usuarios = User.objects.all()
    hoy = datetime.now()

    for usuario in usuarios:
        if not usuario.birthday:
            logger.warning(f"Usuario {usuario.username} no tiene cumpleanios registrado.")
            continue

        cumple_mes = usuario.birthday.month
        if 1 <= cumple_mes <= 6 and 7 <= hoy.month <= 12 and usuario.dias_cumpleanios == 1:
            usuario.dias_cumpleanios = 0
            usuario.save()
            logger.info(f"✅ Actualizado: {usuario.username} - días cumpleanios a 0.")
        else:
            logger.info(f"↪ No se actualizó: {usuario.username} - No cumple condiciones.")

if __name__ == '__main__':
    verificar_dias_cumpleanos()
