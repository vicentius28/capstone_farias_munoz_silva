from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q

from acceso.models import AccessPermission


class UserPermissionsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # ✅ Verifica que el usuario tenga grupo y empresa
        if not hasattr(user, 'group') or not user.group or not user.empresa:
            return Response({
                "grupo": None,
                "empresa": None,
                "permisos": []
            })

        # ✅ Filtra permisos por grupo y empresa (o empresa nula)
        permisos_qs = AccessPermission.objects.filter(
            group=user.group
        ).filter(
            Q(empresa__in=[user.empresa]) | Q(empresa__isnull=True)
        ).prefetch_related('templates')

        # ✅ Extrae los nombres de las plantillas permitidas
        template_names = set()
        for permiso in permisos_qs:
            template_names.update(permiso.templates.values_list('name', flat=True))

        return Response({
            "grupo": user.group.name,
            "empresa": user.empresa.name,
            "permisos": sorted(template_names)  # ejemplo: ['/solicitar', '/beneficios']
        })
