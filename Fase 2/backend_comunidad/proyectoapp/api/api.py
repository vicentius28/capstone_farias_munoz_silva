from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from proyectoapp.serializers import UserSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from proyectoapp.models import User
from django.shortcuts import get_object_or_404

class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]  # Usar JWT Authentication
    permission_classes = [IsAuthenticated]  # Solo usuarios autenticados pueden acceder

    def get(self, request):
        user = request.user  # Obtiene el usuario autenticado
        serializer = UserSerializer(user)
        return Response(serializer.data)
    


class UserAllView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Parámetro de búsqueda
        search_query = request.GET.get('search', '').strip()
        
        # Filtro base
        users = User.objects.filter(
            empresa__id__in=[ 1, 2], 
            is_active=True,
            group__id__in=[4,5,7,14,18,21]
        )
        
        # Aplicar búsqueda si existe
        if search_query:
            from django.db.models import Q
            users = users.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(rut__icontains=search_query) |
                Q(email__icontains=search_query) |
                # Búsqueda en títulos - CORREGIDO: sin _set y campo correcto
                Q(usuariotitulo__titulo__titulo__icontains=search_query) |
                Q(usuariotitulo__institucion__universidad__icontains=search_query) |
                # Búsqueda en magísteres - CORREGIDO: sin _set y campo correcto
                Q(usuariomagister__magister__magister__icontains=search_query) |
                Q(usuariomagister__institucion__universidad__icontains=search_query) |
                # Búsqueda en diplomados - CORREGIDO: sin _set y campo correcto
                Q(usuariodiplomado__diplomado__diplomado__icontains=search_query) |
                Q(usuariodiplomado__institucion__universidad__icontains=search_query)
            ).distinct()
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class UserDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        # Obtener el usuario por ID
        user = get_object_or_404(User, id=user_id)
        
        # Serializar los datos del usuario
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)
