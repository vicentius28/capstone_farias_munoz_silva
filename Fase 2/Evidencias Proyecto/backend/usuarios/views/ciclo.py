from rest_framework import viewsets
from usuarios.models import Ciclo
from usuarios.serializers import CicloSerializer

class CicloViewSet(viewsets.ModelViewSet):
    queryset = Ciclo.objects.all()
    serializer_class = CicloSerializer