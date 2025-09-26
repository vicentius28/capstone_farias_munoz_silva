# proyectoapp/models/__init__.py

# Importaciones principales
from .user_base import User
from .evaluacion import Evaluacion

# Importaciones de otros módulos
from .estructura import Cargo, Codigo, Ciclo, Genero
from .formacion import UsuarioTitulo, UsuarioMagister, UsuarioDiplomado
from .bienios import Bienios, Tramos
from .capacitacion import Capacitacion, ParticipacionCapacitacion, TituloCapacitacion
from .contacto_emergencia import ContactoEmergencia

# Importaciones de choices y mixins para uso externo si es necesario
from .user_choices import TipoContrato
from .user_mixins import ContractMixin, AssignmentMixin

# Mantener compatibilidad con importaciones existentes
__all__ = [
    'User',
    'Evaluacion',
    'Cargo',
    'Codigo', 
    'Ciclo',
    'Genero',
    'UsuarioTitulo',
    'UsuarioMagister', 
    'UsuarioDiplomado',
    'Bienios',
    'Tramos',
    'Capacitacion',
    'ParticipacionCapacitacion',
    'TituloCapacitacion',
    'ContactoEmergencia',
    'TipoContrato',
    'ContractMixin',
    'AssignmentMixin',
]