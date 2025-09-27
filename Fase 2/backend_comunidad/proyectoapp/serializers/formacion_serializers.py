from rest_framework import serializers
from proyectoapp.models import UsuarioTitulo, UsuarioMagister,UsuarioDiplomado,ParticipacionCapacitacion,Capacitacion






class UsuarioTituloSerializer(serializers.ModelSerializer):
    titulo = serializers.StringRelatedField()  # Devuelve el nombre del título en lugar de un objeto
    institucion = serializers.StringRelatedField()
    anio = serializers.IntegerField
    class Meta:
        model = UsuarioTitulo
        fields = ['titulo', 'institucion', 'anio']

class UsuarioMagisterSerializer(serializers.ModelSerializer):
    magister = serializers.StringRelatedField()  # Muestra el nombre del magíster en lugar del ID
    institucion = serializers.StringRelatedField()  # Muestra el nombre de la institución
    anio = serializers.IntegerField
    class Meta:
        model = UsuarioMagister
        fields = ['magister', 'institucion', 'anio']

class UsuarioDiplomadoSerializer(serializers.ModelSerializer):
    diplomado = serializers.StringRelatedField()  # Muestra el nombre del magíster en lugar del ID
    institucion = serializers.StringRelatedField()  # Muestra el nombre de la institución


    class Meta:
        model = UsuarioDiplomado
        fields = ['diplomado', 'institucion', 'anio']


class CapacitacionSerializer(serializers.ModelSerializer):
    titulo_general = serializers.StringRelatedField() 
    class Meta:
        model = Capacitacion
        fields = ['id','titulo_general', 'nombre', 'descripcion']


class UsuarioCapacitacionSerializer(serializers.ModelSerializer):
    capacitacion = CapacitacionSerializer()  # Muestra el nombre del magíster en lugar del ID
    institucion = serializers.StringRelatedField()  # Muestra el nombre de la institución
    fecha_realizacion = serializers.IntegerField()  # Formato de fecha deseado

    class Meta:
        model = ParticipacionCapacitacion
        fields = ['capacitacion', 'institucion', 'fecha_realizacion']