from django.shortcuts import render, redirect
from django.contrib import messages
from formulario.models import Formulario
import logging
logger = logging.getLogger(__name__)


GROUP_IDS_WITH_ACCESS = {4, 10, 11}


def listado(request):
    usuario_logeado = request.user.email
    usuario = request.user
    group_id = usuario.group.id

    formlistados = Formulario.objects.filter(
        user__jefe__email=usuario_logeado, estado="pendiente"
    ).order_by('created_at')

    if group_id in GROUP_IDS_WITH_ACCESS:
        return render(request, "proyectoapp/ListadoFormulario.html", {"formularios": formlistados})
    else:
        messages.error(request, "No tiene permisos para acceder a Listado")
        return redirect('index')

def milistado(request):
    usuario = request.user
    formlistados = Formulario.objects.filter(
        user__email=usuario.email, user__empresa__id=usuario.empresa.id
    ).order_by('created_at')
    return render(request, "proyectoapp/MiListado.html", {"formularios": formlistados})

GROUP_IDS_WITH_LIMITED_ACCESS = {10, 4}
GROUP_IDS_WITH_FULL_ACCESS = {11}

def historial(request):
    usuario = request.user
    group_id = usuario.group.id

    if group_id in GROUP_IDS_WITH_LIMITED_ACCESS:
        formlistados = Formulario.objects.filter(
            user__group__id=group_id, user__empresa__id__in=[usuario.empresa.id, 3]).order_by('created_at')
    elif group_id in GROUP_IDS_WITH_FULL_ACCESS:
        formlistados = Formulario.objects.filter(
            user__empresa__id__in=[usuario.empresa.id, 3]).order_by('created_at')
    else:
        messages.error(request, "No tiene permisos para acceder al historial")
        return redirect('index')

    return render(request, "proyectoapp/historial.html", {"formularios": formlistados})



