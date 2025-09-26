from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from evaluacion.models import Autoevaluacion
from evaluacion.serializers import AutoevaluacionSerializer
import logging

logger = logging.getLogger(__name__)

class AutoevaluacionViewSet(viewsets.ModelViewSet):
    serializer_class = AutoevaluacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Autoevaluacion.objects.filter(persona=self.request.user).order_by('-fecha_inicio')
        completado = self.request.query_params.get('completado')

        if completado is not None:
            if completado.lower() in ['true', '1']:
                queryset = queryset.filter(completado=True)
            elif completado.lower() in ['false', '0']:
                queryset = queryset.filter(completado=False)

        return queryset

    def perform_create(self, serializer):
        serializer.save(persona=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = get_object_or_404(self.get_queryset(), pk=kwargs['pk'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = get_object_or_404(self.get_queryset(), pk=kwargs['pk'])

        # ✅ LOGGING DETALLADO PARA CAPTURAR ERRORES
        try:
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            # Agregar contexto para validación de snapshot
            serializer.context['autoevaluacion'] = instance
            
            if not serializer.is_valid():
                logger.error(f"Error de validación en autoevaluación {instance.id}: {serializer.errors}")
                return Response({
                    'error': 'Datos inválidos',
                    'details': serializer.errors,
                    'debug_info': {
                        'autoevaluacion_id': instance.id,
                        'tiene_snapshot': bool(instance.estructura_json),
                        'version_plantilla': instance.version_plantilla
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_update(serializer)
            
            # ✅ USAR MÉTODO DEL MODELO QUE USA SNAPSHOT
            instance.calcular_logro()
            
            # Actualizar campos de texto
            instance.text_mejorar = request.data.get('text_mejorar', '')
            instance.text_destacar = request.data.get('text_destacar', '')
            instance.save()
            
            return Response(self.get_serializer(instance).data)
            
        except Exception as e:
            logger.error(f"Error inesperado en autoevaluación {instance.id}: {str(e)}")
            return Response({
                'error': 'Error interno del servidor',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
