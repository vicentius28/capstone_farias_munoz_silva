from django.db import models
from django.conf import settings


class ContactoEmergencia(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="contactos_emergencia",
        verbose_name="Usuario"
    )
    nombre = models.CharField(max_length=100, verbose_name="Nombre del contacto")
    telefono = models.CharField(max_length=120, verbose_name="Teléfono")
    parentezco = models.CharField(max_length=50, verbose_name="Parentesco")

    def __str__(self):
        return f"{self.nombre} ({self.parentezco}) - {self.usuario.get_full_name()}"

    class Meta:
        verbose_name = "Contacto de Emergencia"
        verbose_name_plural = "Contactos de Emergencia"
