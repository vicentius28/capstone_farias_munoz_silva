from rest_framework import serializers
from proyectoapp.models import Bienios

class BieniosSerializer(serializers.ModelSerializer):
    tramo = serializers.StringRelatedField()
    class Meta:
        model = Bienios
        fields = ['bienios', 'tramo']