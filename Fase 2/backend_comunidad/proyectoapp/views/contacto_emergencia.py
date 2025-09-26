from rest_framework import viewsets
from proyectoapp.models import ContactoEmergencia
from proyectoapp.serializers import ContactoEmergenciaSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

class ContactoEmergenciaViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]  # 👈 solo usuarios logueados
    queryset = ContactoEmergencia.objects.all()
    serializer_class = ContactoEmergenciaSerializer

    def get_queryset(self):
        # Obtener el parámetro 'usuario' de la query string
        usuario_id = self.request.query_params.get('usuario')
        
        if usuario_id:
            # Si se especifica un usuario, filtrar por ese usuario
            return ContactoEmergencia.objects.filter(usuario_id=usuario_id)
        else:
            # Si no se especifica, usar el usuario autenticado (comportamiento actual)
            return ContactoEmergencia.objects.filter(usuario=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)  # usa el usuario autenticado
