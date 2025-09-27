from django.db import models
from django.conf import settings
from titulo.models import Titulo, Magister, Diplomado, Institucion


class UsuarioTitulo(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Relación con el usuario
    titulo = models.ForeignKey(Titulo, on_delete=models.CASCADE)  # Relación con el título
    institucion = models.ForeignKey(
        Institucion, on_delete=models.SET_NULL, null=True, blank=True)
    anio = models.PositiveIntegerField(verbose_name=('año'))  # Año en que obtuvo el título

    class Meta:
        unique_together = ('usuario', 'titulo')  # Un usuario no puede repetir el mismo título
        verbose_name = "Titulo"  # Nombre en singular
        verbose_name_plural = "Titulos"  # Nombre en plural
    def __str__(self):
        return f"{self.usuario.username} - {self.titulo.titulo} ({self.anio})"


class UsuarioMagister(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Relación con el usuario
    magister = models.ForeignKey(Magister, on_delete=models.CASCADE)  # Relación con el magíster
    institucion = models.ForeignKey(
        Institucion, on_delete=models.SET_NULL, null=True, blank=True)
    anio = models.PositiveIntegerField(verbose_name=('año'))  # Año en que obtuvo el magíster

    class Meta:
        unique_together = ('usuario', 'magister')  # Un usuario no puede repetir el mismo magíster
        verbose_name = "Magister"  # Nombre en singular
        verbose_name_plural = "Magister"  # Nombre en plural

    def __str__(self):
        return f"{self.usuario.username} - {self.magister.magister} ({self.anio})"

class UsuarioDiplomado(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Relación con el usuario
    diplomado = models.ForeignKey(Diplomado, on_delete=models.CASCADE)  # Relación con el magíster
    institucion = models.ForeignKey(
        Institucion, on_delete=models.SET_NULL, null=True, blank=True)
    anio = models.PositiveIntegerField(verbose_name=('año'))  # Año en que obtuvo el magíster

    class Meta:
        unique_together = ('usuario', 'diplomado')  # Un usuario no puede repetir el mismo magíster
        verbose_name = "Diplomado"  # Nombre en singular
        verbose_name_plural = "Diplomado"  # Nombre en plural

    def __str__(self):
        return f"{self.usuario.username} - {self.diplomado.diplomado} ({self.anio})"