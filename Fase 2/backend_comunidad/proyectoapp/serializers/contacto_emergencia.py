from rest_framework import serializers
from proyectoapp.models import ContactoEmergencia

class ContactoEmergenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactoEmergencia
        fields = ['id', 'usuario', 'nombre', 'telefono', 'parentezco']
