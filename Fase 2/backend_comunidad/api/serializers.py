from proyectoapp.models import User
from rest_framework import serializers
from proyectoapp.serializers.empresa_serializers import EmpresaSerializer
class UserSerializers(serializers.ModelSerializer):
    empresa = EmpresaSerializer()
    class Meta:
        model = User
        fields = '__all__'
        some_field  = {'password':{'write_only':True}}
        
        
