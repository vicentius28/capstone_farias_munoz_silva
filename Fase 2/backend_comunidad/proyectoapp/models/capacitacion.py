from django.db import models
from django.conf import settings

class TituloCapacitacion(models.Model):
    titulo = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.titulo
    class Meta:
        verbose_name = "Titulo Capacitación"  # Nombre en singular
        verbose_name_plural = "Titulos Capacitación"  # Nombre en plural

class Capacitacion(models.Model):
    titulo_general = models.ForeignKey(TituloCapacitacion, on_delete=models.CASCADE,     null=True,
    blank=True)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)


    def __str__(self):
        return f"{self.titulo_general} - {self.nombre}"
    class Meta:
        verbose_name = "Capacitación"  # Nombre en singular
        verbose_name_plural = "Capacitación"  # Nombre en plural

class ParticipacionCapacitacion(models.Model):
    capacitacion = models.ForeignKey(Capacitacion, on_delete=models.CASCADE, related_name="sesiones")
    fecha_realizacion = models.IntegerField()
    usuario = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="capacitaciones")

    def __str__(self):
        return f"{self.capacitacion} - {self.fecha_realizacion}"

    class Meta:
        verbose_name = "Participación Capacitación"  # Nombre en singular
        verbose_name_plural = "Participación Capacitación"  # Nombre en plural