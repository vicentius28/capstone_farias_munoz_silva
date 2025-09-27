"""
Modelo de Evaluación de usuarios
"""
from django.db import models


class Evaluacion(models.Model):
    """Modelo para evaluaciones de desempeño de usuarios"""
    
    usuario = models.ForeignKey(
        'User', 
        on_delete=models.CASCADE, 
        related_name="evaluaciones",
        verbose_name="Usuario"
    )
    porcentaje = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        help_text="Porcentaje obtenido en la evaluación",
        verbose_name="Porcentaje"
    )
    drive_url = models.URLField(
        null=True, 
        blank=True,
        verbose_name="URL de Drive"
    )
    anio = models.CharField(
        max_length=6, 
        help_text="Año de evaluación, ej: 202407",
        verbose_name="Año"
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación"
    )

    class Meta:
        verbose_name = "Evaluación"
        verbose_name_plural = "Evaluaciones"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'anio']),
            models.Index(fields=['fecha_creacion']),
        ]

    def __str__(self):
        return f"{self.usuario} - {self.anio} ({self.porcentaje}%)"