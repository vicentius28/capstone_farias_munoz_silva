# __init__.py
from .user_serializers import UserSerializer,DiasUsuarioSerializer,UserEvaSerializer

from .formacion_serializers import (
    UsuarioTituloSerializer,
    UsuarioMagisterSerializer,
    UsuarioDiplomadoSerializer,
)
from .empresa_serializers import EmpresaSerializer
from .bienios_serializers import BieniosSerializer
from .evaluacion_serializers import EvaluacionSerializer
from .capacitación import (
    UsuarioSerializer,
    ParticipacionExportSerializer,
)
from .ciclo import CicloSerializer


from .contacto_emergencia import ContactoEmergenciaSerializer