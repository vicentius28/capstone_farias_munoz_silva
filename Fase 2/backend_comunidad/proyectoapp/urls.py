from django.urls import path, include
from proyectoapp.views import (
email_domain_error,solicitar_acceso,UsuarioActualAPIView
)
from rest_framework.routers import DefaultRouter
from proyectoapp.views.cron_views import ejecutar_recordatorios_pendientes



from .api.api import UserProfileView, UserAllView, UserDetailView
from rest_framework_simplejwt.views import TokenRefreshView
from proyectoapp.views import (ExportarParticipacionesExcel, 
     CapacitacionesAgrupadasAPIView, ExportarResumenPorUsuarioAPIView,ParticipantesAPIView, 
     CicloViewSet, ContactoEmergenciaViewSet, DiasUsuarioViewSet)

router = DefaultRouter()
router.register(r'ciclos', CicloViewSet)
router.register(r'contactos-emergencia', ContactoEmergenciaViewSet)
router.register(r'usuarios-dias', DiasUsuarioViewSet, basename='usuarios-dias')



urlpatterns = [

     path('proyecto/api/', include(router.urls)),

     path('email-domain-error/', email_domain_error, name='email_domain_error'),  # Error de dominio template

     path('solicitar-acceso/', solicitar_acceso, name='solicitar_acceso'),


     #api implementadas
     path('proyecto/api/user/', UserProfileView.as_view(), name='user-profile'),
     path('proyecto/api/user-all/', UserAllView.as_view(), name='user-all'),
     path('proyecto/api/user/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
     path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
     path("usuario/api/get/usuario/", UsuarioActualAPIView.as_view(), name="usuario-actual"),
     path("proyectoapp/api/exportar-participaciones/", ExportarParticipacionesExcel.as_view(), name="exportar-participaciones"),
     path("proyectoapp/api/capacitaciones-agrupadas/", CapacitacionesAgrupadasAPIView.as_view(), name="capacitaciones-agrupadas"),   
     path("proyectoapp/api/exportar-resumen-usuarios/", ExportarResumenPorUsuarioAPIView.as_view(), name="exportar-resumen-usuarios"),
     path("proyectoapp/api/participantes/", ParticipantesAPIView.as_view(), name="participantes"),
    path('cron/recordatorios-pendientes/', ejecutar_recordatorios_pendientes, name='cron_recordatorios'),
]
