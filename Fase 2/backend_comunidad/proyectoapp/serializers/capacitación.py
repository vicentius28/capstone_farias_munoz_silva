# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from proyectoapp.models import ParticipacionCapacitacion

User = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]  # ajusta según tu modelo

class ParticipacionExportSerializer(serializers.ModelSerializer):
    usuarios = serializers.SerializerMethodField()
    titulo = serializers.CharField(source="capacitacion.titulo_general.titulo")
    nombre_capacitacion = serializers.CharField(source="capacitacion.nombre")

    class Meta:
        model = ParticipacionCapacitacion
        fields = ["titulo", "nombre_capacitacion", "fecha_realizacion", "usuarios"]

    def get_usuarios(self, obj):
        usuarios = obj.usuario.filter(empresa__id=2)  # Filtra solo usuarios de empresa 2
        return UsuarioSerializer(usuarios, many=True).data
