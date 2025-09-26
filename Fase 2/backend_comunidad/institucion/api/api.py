from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..serializers.serializers import EmpresaSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from institucion.models import Empresa
    

class EmpresaAllView(APIView):
    authentication_classes = [JWTAuthentication]  # Usar JWT Authentication
    permission_classes = [IsAuthenticated]  # Solo usuarios autenticados pueden acceder

    def get(self, request):
        # Obtener todos los usuarios
        empresas = Empresa.objects.filter(id__in=[1, 2])

        # Serializar los datos de todos los usuarios
        serializer = EmpresaSerializer(empresas, many=True)
        return Response(serializer.data)
        
