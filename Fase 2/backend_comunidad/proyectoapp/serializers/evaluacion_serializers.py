from rest_framework import serializers
from proyectoapp.models import Evaluacion


class EvaluacionSerializer(serializers.ModelSerializer):    
    class Meta:
        model = Evaluacion
        fields = ['porcentaje', 'drive_url', 'anio', 'fecha_creacion']

        