from django.db import models
from django.contrib.auth.models import Group
from institucion.models import Empresa

class TemplateAccess(models.Model):
    # Usar la ruta (href) como identificador único del permiso
    name = models.CharField(
        max_length=200,
        unique=True,
        help_text="Ruta protegida (ej: '/solicitar', '/directivo/usuarios')"
    )

    def __str__(self):
        return self.name
    class Meta:
       verbose_name = "plantilla de acceso"  # Nombre en singular
       verbose_name_plural = "plantillas de accesos"  # Nombre en plural

class AccessPermission(models.Model):
    titulo = models.CharField(max_length=200, null=True, blank=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    empresa = models.ManyToManyField(Empresa, blank=True)
    templates = models.ManyToManyField(TemplateAccess, related_name='permissions')

    def __str__(self):
        empresas = ", ".join(e.name for e in self.empresa.all()) if self.empresa.exists() else "Todas"
        return f"Permisos: {self.group.name} - {empresas}"

    class Meta:
        verbose_name = "Permiso"  # Nombre en singular
        verbose_name_plural = "Permisos"  # Nombre en plural