from rest_framework import viewsets
from evaluacion.models import TipoEvaluacion, EvaluacionAsignada
from evaluacion.models.autoevaluacion import Autoevaluacion
from evaluacion.serializers import TipoEvaluacionSerializer, AutoEvaluacionAsignadaSerializer ,TipoEvaluacionListSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from evaluacion.serializers import UsuarioSerializer
from evaluacion.serializers.tipo_evaluacion_read import TipoEvaluacionParaAutoevaluacionSerializer
from django.db import IntegrityError
from evaluacion.utils.assignment_notifications import enviar_notificaciones_masivas_autoevaluacion

User = get_user_model()

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('ciclo', 'empresa').filter(
        empresa__id__in=[1, 2, 3],
        is_active=True
    )
    serializer_class = UsuarioSerializer



class TipoEvaluacionViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = TipoEvaluacion.objects.all()
    
    def get_serializer_class(self):
        """
        Usa el serializador ligero para listas (carga instantánea)
        y el pesado para detalles/edición.
        """
        if self.action == 'list':
            return TipoEvaluacionListSerializer
        return TipoEvaluacionSerializer

    def get_queryset(self):
        """
        Optimización de base de datos:
        Solo hacemos JOINs/Prefetch de la estructura profunda cuando
        realmente necesitamos el detalle (retrieve, update).
        Esto evita el problema N+1 en el listado.
        """
        if self.action in ['retrieve', 'update', 'partial_update']:
            return TipoEvaluacion.objects.prefetch_related(
                'areas__competencias__indicadores__nvlindicadores'
            )
        
        # Para 'list', devolvemos el queryset base (rápido)
        return super().get_queryset().order_by('n_tipo_evaluacion')
class EvaluacionAsignadaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    queryset = EvaluacionAsignada.objects.all()
    serializer_class = AutoEvaluacionAsignadaSerializer
    
    def perform_create(self, serializer):
        evaluacion_asignada = serializer.save()
        tipo = evaluacion_asignada.tipo_evaluacion
        fecha = evaluacion_asignada.fecha_evaluacion

        print("✅ Evaluación asignada creada:", evaluacion_asignada)
        
        autoevaluaciones_creadas = []
        personas_ya_asignadas = []

        for persona in evaluacion_asignada.personas_asignadas.all():
            try:
                mes, anio = map(int, fecha.split("-"))
            except ValueError:
                print("⚠️ Error al interpretar la fecha:", fecha)
                continue

            try:
                nueva = Autoevaluacion.objects.create(
                    persona=persona,
                    fecha_evaluacion=fecha,
                    tipo_evaluacion=tipo,
                    completado=False,
                    estructura_json=TipoEvaluacionParaAutoevaluacionSerializer(tipo).data
                )
                autoevaluaciones_creadas.append(nueva)
                print(f"✅ Autoevaluación creada para {persona}: {nueva.id}")
                
            except IntegrityError:
                print(f"ℹ️ Ya existe autoevaluación para {persona} en {fecha}")
                personas_ya_asignadas.append(persona)
                continue
        
        # Enviar notificaciones solo a personas con nuevas autoevaluaciones
        if autoevaluaciones_creadas:
            try:
                enviadas, fallidas = enviar_notificaciones_masivas_autoevaluacion(evaluacion_asignada)
                print(f"📧 Notificaciones enviadas: {enviadas}, fallidas: {fallidas}")
            except Exception as e:
                print(f"⚠️ Error enviando notificaciones: {str(e)}")


