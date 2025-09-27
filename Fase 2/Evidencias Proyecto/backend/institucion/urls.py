from django.urls import path
from institucion.views import EmpresaUsuarioView
urlpatterns = [
    path('empresa/get/empresa/', EmpresaUsuarioView.as_view(), name='mi-empresa'),
]