from django.urls import path
from acceso.api.permisos import UserPermissionsView

urlpatterns = [
    path('api/auth/user/access/', UserPermissionsView.as_view(), name='user-permisos'),
]
