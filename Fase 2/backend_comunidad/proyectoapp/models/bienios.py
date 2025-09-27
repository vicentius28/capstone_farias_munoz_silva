from django.db import models
from django.conf import settings
class Tramos(models.Model):
    tramo = models.CharField(max_length=30)

    class Meta:
        verbose_name = "Tramo"  # Nombre en singular
        verbose_name_plural = "Tramos"  # Nombre en plural
    
    def __str__(self):
        return self.tramo


class Bienios(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Relación con el usuario
    bienios = models.IntegerField()
    tramo = models.ForeignKey(Tramos, on_delete=models.CASCADE)
    

    class Meta:
        unique_together = ('usuario', 'bienios')  # Un usuario no puede repetir el mismo bienios
        verbose_name = "Bienios"  # Nombre en singular
        verbose_name_plural = "Bienios"  # Nombre en plural

    def __str__(self):
        return f"{self.bienios} - {self.tramo} - {self.usuario.username}"