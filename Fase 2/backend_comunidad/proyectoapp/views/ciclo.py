from rest_framework import viewsets
from proyectoapp.models import Ciclo
from proyectoapp.serializers import CicloSerializer

class CicloViewSet(viewsets.ModelViewSet):
    queryset = Ciclo.objects.all()
    serializer_class = CicloSerializer