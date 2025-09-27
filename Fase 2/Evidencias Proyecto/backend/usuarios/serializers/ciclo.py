from rest_framework import serializers
from usuarios.models import Ciclo

class CicloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ciclo
        fields = ['id', 'ciclo']