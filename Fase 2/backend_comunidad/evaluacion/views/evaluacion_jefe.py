from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from evaluacion.models import EvaluacionJefe
from evaluacion.serializers import JefeEvaluacionSerializer
import logging
from evaluacion.utils.email_notifications import enviar_notificacion_retroalimentacion_completada

logger = logging.getLogger(__name__)

class EvaluacionViewSet(viewsets.ModelViewSet):
    serializer_class = JefeEvaluacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Solo las que yo evalúo
        qs = (EvaluacionJefe.objects
              .filter(evaluador=self.request.user)
              .select_related(
                  "persona", "persona__cargo", "persona__empresa",
                  "tipo_evaluacion"
              )
              .prefetch_related("respuestas")
              .order_by("-fecha_inicio"))

        # ✅ FILTROS ACTUALIZADOS PARA NUEVO FLUJO
        completado = self.request.query_params.get("completado")
        if completado is not None:
            c = completado.lower()
            if c in ("true", "1"):
                qs = qs.filter(completado=True)
            elif c in ("false", "0"):
                qs = qs.filter(completado=False)
        
        # ✅ FILTROS ACTUALIZADOS PARA USAR estado_firma
        estado = self.request.query_params.get("estado")
        if estado:
            if estado == "en_progreso":
                qs = qs.filter(completado=False)
            elif estado == "completada":
                qs = qs.filter(completado=True, retroalimentacion_completada=False)
            elif estado == "retroalimentacion_completada":
                qs = qs.filter(retroalimentacion_completada=True, cerrado_para_firma=False)
            elif estado == "pendiente_firma":
                qs = qs.filter(cerrado_para_firma=True, estado_firma='pendiente')
            elif estado == "finalizada":
                qs = qs.filter(estado_firma='firmado')
            elif estado == "denegada":
                qs = qs.filter(estado_firma='firmado_obs')
                
        return qs

    def perform_create(self, serializer):
        # 👉 El evaluador es el usuario logeado.
        # La persona evaluada viene en el JSON como persona_id (write_only en el serializer).
        serializer.save(evaluador=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = get_object_or_404(self.get_queryset(), pk=kwargs["pk"])
        return Response(self.get_serializer(instance).data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = get_object_or_404(self.get_queryset(), pk=kwargs["pk"])

        # ✅ LOGGING DETALLADO PARA CAPTURAR ERRORES
        try:
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            # ✅ AGREGAR CONTEXTO PARA VALIDACIÓN DE SNAPSHOT
            serializer.context['evaluacion_jefe'] = instance
            
            if not serializer.is_valid():
                logger.error(f"Error de validación en evaluación jefe {instance.id}: {serializer.errors}")
                return Response({
                    'error': 'Datos inválidos',
                    'details': serializer.errors,
                    'debug_info': {
                        'evaluacion_id': instance.id,
                        'tiene_snapshot': bool(instance.estructura_json),
                        'version_plantilla': instance.version_plantilla
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

            # ✅ DEJA QUE EL SERIALIZER HAGA EL UPSERT DE RESPUESTAS
            serializer.save()
            
            # ✅ USAR MÉTODO DEL MODELO QUE USA SNAPSHOT
            instance.calcular_logro()
            
            # Actualizar campos de texto
            instance.text_mejorar = request.data.get('text_mejorar', '')
            instance.text_destacar = request.data.get('text_destacar', '')
            instance.retroalimentacion = request.data.get('retroalimentacion', '')
            instance.save(update_fields=['text_mejorar', 'text_destacar', 'retroalimentacion'])
            
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error inesperado en evaluación jefe {instance.id}: {str(e)}")
            return Response({
                'error': 'Error interno del servidor',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def completar_retroalimentacion(self, request, pk=None):
        """Completa la retroalimentación y permite cerrar para firma"""
        evaluacion = self.get_object()
        
        if not evaluacion.puede_completar_retroalimentacion():
            return Response({
                'error': 'No se puede completar retroalimentación',
                'estado_actual': evaluacion.get_estado_actual()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar retroalimentación si se proporciona
        retroalimentacion = request.data.get('retroalimentacion', '')
        if retroalimentacion:
            evaluacion.retroalimentacion = retroalimentacion
        
        evaluacion.retroalimentacion_completada = True
        evaluacion.fecha_reunion = timezone.now()
        evaluacion.save(update_fields=['retroalimentacion_completada', 'retroalimentacion', 'fecha_reunion'])
        
        # ✅ ENVIAR NOTIFICACIÓN DE RETROALIMENTACIÓN COMPLETADA
        try:
            enviar_notificacion_retroalimentacion_completada(evaluacion)
            logger.info(f"Notificación de retroalimentación completada enviada para evaluación {evaluacion.id}")
        except Exception as e:
            logger.error(f"Error enviando notificación de retroalimentación completada para evaluación {evaluacion.id}: {str(e)}")
            # No fallar la operación principal por un error de notificación
        
        return Response({
            'message': 'Retroalimentación completada',
            'estado_actual': evaluacion.get_estado_actual()
        })
    
    @action(detail=True, methods=['post'])
    def cerrar_para_firma(self, request, pk=None):
        """Cierra la evaluación para que el evaluado pueda firmar"""
        evaluacion = self.get_object()
        
        if not evaluacion.puede_cerrar_para_firma():
            return Response({
                'error': 'No se puede cerrar para firma',
                'estado_actual': evaluacion.get_estado_actual()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        evaluacion.cerrado_para_firma = True
        evaluacion.save(update_fields=['cerrado_para_firma'])
        
        return Response({
            'message': 'Evaluación cerrada para firma',
            'estado_actual': evaluacion.get_estado_actual()
        })


def parse_bool(val, default=None):
    if val is None:
        return default
    v = str(val).lower()
    if v in ("true", "1", "t", "yes", "y"):  return True
    if v in ("false", "0", "f", "no", "n"):  return False
    return default

class MisEvaluacionesJefaturaViewSet(viewsets.ModelViewSet):

    serializer_class = JefeEvaluacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'patch', 'post']  # ✅ AGREGAR POST PARA DENEGAR

    def get_queryset(self):
        qs = (
            EvaluacionJefe.objects
            .filter(persona=self.request.user)
            .select_related("persona", "persona__cargo", "persona__empresa", "tipo_evaluacion")
            .prefetch_related("respuestas")
            .order_by("-fecha_inicio")
        )

        # ✅ FILTROS ACTUALIZADOS PARA USAR estado_firma
        completado = parse_bool(self.request.query_params.get("completado"))
        if completado is not None:
            qs = qs.filter(completado=completado)

        # ✅ MANTENER COMPATIBILIDAD CON firmado PERO USAR estado_firma
        firmado = parse_bool(self.request.query_params.get("firmado"))
        if firmado is not None:
            if firmado:
                qs = qs.filter(estado_firma='firmado')
            else:
                qs = qs.exclude(estado_firma='firmado')
        
        # ✅ FILTRO POR ESTADO ACTUALIZADO
        estado = self.request.query_params.get("estado")
        if estado:
            if estado == "pendiente_firma":
                qs = qs.filter(cerrado_para_firma=True, estado_firma='pendiente')
            elif estado == "finalizada":
                qs = qs.filter(estado_firma='firmado')
            elif estado == "denegada":
                qs = qs.filter(estado_firma='firmado_obs')

        return qs
    
    def partial_update(self, request, *args, **kwargs):
        """
        Permite actualizar solo campos específicos como 'estado_firma'
        """
        instance = self.get_object()
        
        # ✅ LOGGING DETALLADO PARA DEBUGGING
        logger.info(f"PATCH request para evaluación {instance.id} por usuario {request.user.id}")
        logger.info(f"Datos recibidos: {request.data}")
        logger.info(f"Estado actual de la evaluación:")
        logger.info(f"  - completado: {instance.completado}")
        logger.info(f"  - retroalimentacion_completada: {instance.retroalimentacion_completada}")
        logger.info(f"  - cerrado_para_firma: {instance.cerrado_para_firma}")
        logger.info(f"  - estado_firma: {instance.estado_firma}")
        logger.info(f"  - puede_denegar(): {instance.puede_denegar()}")
        logger.info(f"  - puede_firmar(): {instance.puede_firmar()}")
        
        # ✅ CAMPOS PERMITIDOS ACTUALIZADOS
        allowed_fields = {'estado_firma', 'motivo_denegacion'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        # ✅ MANTENER COMPATIBILIDAD CON 'firmado' PARA EL FRONTEND
        if 'firmado' in request.data:
            if request.data['firmado']:
                data['estado_firma'] = 'firmado'
            # Si firmado=False, no cambiar el estado (podría estar firmado_obs)
        
        logger.info(f"Datos filtrados para actualizar: {data}")
        
        if not data:
            logger.warning(f"No se proporcionaron campos válidos. Datos originales: {request.data}")
            return Response({
                'error': 'No se proporcionaron campos válidos para actualizar',
                'allowed_fields': list(allowed_fields) + ['firmado'],  # Para compatibilidad
                'received_data': dict(request.data)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ VALIDACIONES ESPECÍFICAS
        if 'estado_firma' in data:
            if data['estado_firma'] == 'firmado' and not instance.puede_firmar():
                logger.warning(f"Intento de firmar evaluación {instance.id} que no puede ser firmada")
                return Response({
                    'error': 'No se puede firmar esta evaluación',
                    'estado_actual': instance.get_estado_actual(),
                    'puede_firmar': instance.puede_firmar(),
                    'debug_info': {
                        'cerrado_para_firma': instance.cerrado_para_firma,
                        'estado_firma': instance.estado_firma
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if data['estado_firma'] == 'firmado_obs' and not instance.puede_denegar():
                logger.warning(f"Intento de denegar evaluación {instance.id} que no puede ser denegada")
                return Response({
                    'error': 'No se puede denegar esta evaluación',
                    'estado_actual': instance.get_estado_actual(),
                    'puede_denegar': instance.puede_denegar(),
                    'debug_info': {
                        'cerrado_para_firma': instance.cerrado_para_firma,
                        'estado_firma': instance.estado_firma
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ VALIDACIÓN ADICIONAL PARA MOTIVO DE DENEGACIÓN
        if 'motivo_denegacion' in data and 'estado_firma' in data and data['estado_firma'] == 'firmado_obs':
            motivo = data.get('motivo_denegacion', '').strip()
            if not motivo:
                logger.warning(f"Intento de denegar evaluación {instance.id} sin motivo")
                return Response({
                    'error': 'El motivo de denegación es obligatorio'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(motivo) < 50:
                logger.warning(f"Intento de denegar evaluación {instance.id} con motivo muy corto: {len(motivo)} caracteres")
                return Response({
                    'error': 'El motivo de denegación debe tener al menos 50 caracteres',
                    'current_length': len(motivo)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer = self.get_serializer(instance, data=data, partial=True)
            if not serializer.is_valid():
                logger.error(f"Error de validación del serializer para evaluación {instance.id}: {serializer.errors}")
                return Response({
                    'error': 'Error de validación',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer.save()
            
            logger.info(f"Usuario {request.user.id} actualizó exitosamente evaluación {instance.id}: {data}")
            
            return Response(serializer.data)
            
        except ValueError as ve:
            logger.error(f"Error de validación del modelo para evaluación {instance.id}: {str(ve)}")
            return Response({
                'error': 'Error de validación del modelo',
                'message': str(ve)
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error inesperado al actualizar evaluación {instance.id}: {str(e)}")
            return Response({
                'error': 'Error interno del servidor',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def denegar(self, request, pk=None):
        """
        Endpoint específico para denegar una evaluación
        """
        evaluacion = self.get_object()
        
        if not evaluacion.puede_denegar():
            return Response({
                'error': 'No se puede denegar esta evaluación',
                'estado_actual': evaluacion.get_estado_actual()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        motivo = request.data.get('motivo_denegacion', '').strip()
        if not motivo:
            return Response({
                'error': 'El motivo de denegación es obligatorio'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(motivo) < 50:
            return Response({
                'error': 'El motivo de denegación debe tener al menos 50 caracteres'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            evaluacion.estado_firma = 'firmado_obs'
            evaluacion.motivo_denegacion = motivo
            evaluacion.save(update_fields=['estado_firma', 'motivo_denegacion'])
            
            logger.info(f"Usuario {request.user.id} denegó evaluación {evaluacion.id}")
            
            return Response({
                'message': 'Evaluación denegada exitosamente',
                'estado_actual': evaluacion.get_estado_actual(),
                'motivo_denegacion': motivo
            })
            
        except Exception as e:
            logger.error(f"Error al denegar evaluación {evaluacion.id}: {str(e)}")
            return Response({
                'error': 'Error interno del servidor',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        """
        Deshabilitar PUT completo, solo permitir PATCH
        """
        return Response({
            'error': 'Método no permitido. Use PATCH para actualizaciones parciales.'
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    def create(self, request, *args, **kwargs):
        """
        Deshabilitar creación
        """
        return Response({
            'error': 'No se permite crear evaluaciones desde este endpoint.'
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    def destroy(self, request, *args, **kwargs):
        """
        Deshabilitar eliminación
        """
        return Response({
            'error': 'No se permite eliminar evaluaciones desde este endpoint.'
        }, status=status.HTTP_405_METHOD_NOT_ALLOWED)