import os
from io import BytesIO
from django.template.loader import get_template
from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify
from xhtml2pdf import pisa
from datetime import datetime
from evaluacion.models import EvaluacionJefe
from evaluacion.models.autoevaluacion import Autoevaluacion
import logging

logger = logging.getLogger(__name__)

class EvaluacionPDFGenerator:
    """Generador de PDFs para evaluaciones - Versión optimizada para xhtml2pdf"""
    
    # Constantes para niveles de logro
    NIVEL_DESTACADO = {'texto': 'Destacado', 'color': '#10b981', 'min_porcentaje': 90}
    NIVEL_COMPETENTE = {'texto': 'Competente', 'color': '#2563eb', 'min_porcentaje': 80}
    NIVEL_EN_DESARROLLO = {'texto': 'Inicial', 'color': '#f59e0b', 'min_porcentaje': 70}
    NIVEL_INSUFICIENTE = {'texto': 'Insatisfactorio', 'color': '#ef4444', 'min_porcentaje': 0}
    
    
    NIVELES_LOGRO = [NIVEL_DESTACADO, NIVEL_COMPETENTE, NIVEL_EN_DESARROLLO, NIVEL_INSUFICIENTE]
    
    @staticmethod
    def generate_evaluacion_jefe_pdf(evaluacion_id):
        """Genera un PDF para una evaluación de jefe"""
        try:
            logger.info(f"Iniciando generación de PDF para evaluación {evaluacion_id}")
            
            evaluacion = EvaluacionJefe.objects.select_related(
                'persona', 'tipo_evaluacion', 'evaluador'
            ).prefetch_related('respuestas').get(id=evaluacion_id)
            
            context = EvaluacionPDFGenerator._prepare_context(evaluacion, 'evaluacion_jefe')
            return EvaluacionPDFGenerator._generate_pdf(context, 'evaluacion/pdf_evaluacion_jefe.html')
        except Exception as e:
            logger.error(f"Error en generate_evaluacion_jefe_pdf: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def generate_autoevaluacion_pdf(autoevaluacion_id):
        """Genera un PDF para una autoevaluación"""
        try:
            logger.info(f"Iniciando generación de PDF para autoevaluación {autoevaluacion_id}")
            
            autoevaluacion = Autoevaluacion.objects.select_related(
                'persona', 'tipo_evaluacion'
            ).prefetch_related('respuestas').get(id=autoevaluacion_id)
            
            context = EvaluacionPDFGenerator._prepare_context(autoevaluacion, 'autoevaluacion')
            return EvaluacionPDFGenerator._generate_pdf(context, 'evaluacion/pdf_autoevaluacion.html')
            
        except Exception as e:
            logger.error(f"Error en generate_autoevaluacion_pdf: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def _generate_pdf(context, template_path):
        """Método optimizado para generar PDFs con xhtml2pdf"""
        logger.info("Obteniendo template y renderizando HTML")
        template = get_template(template_path)
        html = template.render(context)
        
        logger.info("Creando PDF con configuración optimizada")
        result = BytesIO()
        
        # Configuración optimizada para xhtml2pdf
        pdf = pisa.pisaDocument(
            BytesIO(html.encode("UTF-8")), 
            result,
            encoding='UTF-8',
            show_error_as_pdf=True,
            # Configuraciones adicionales para mejor compatibilidad
            default_css_string="""
                @page {
                    size: A4;
                    margin: 2cm;
                    @frame content_frame {
                        left: 2cm;
                        width: 17cm;
                        top: 2cm;
                        height: 25cm;
                    }
                }
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                }
            """,
            link_callback=EvaluacionPDFGenerator._link_callback
        )
        
        if not pdf.err:
            logger.info("PDF creado exitosamente")
            return result.getvalue()
        else:
            logger.error(f"Error creando PDF: {pdf.err}")
            # Log más detallado de errores
            for error in pdf.log:
                logger.error(f"PDF Error: {error}")
            raise Exception(f"Error generando PDF: {pdf.err}")

    @staticmethod
    def _link_callback(uri, rel):
        """
        Callback para manejar recursos estáticos en el PDF
        Mejora la carga de CSS y otros recursos
        """
        # Convertir URIs relativos a absolutos
        if uri.startswith('http'):
            return uri
        
        # Para archivos estáticos locales
        if hasattr(settings, 'STATIC_ROOT') and settings.STATIC_ROOT:
            path = os.path.join(settings.STATIC_ROOT, uri.replace(settings.STATIC_URL, ""))
            if os.path.isfile(path):
                return path
        
        # Fallback para desarrollo
        if hasattr(settings, 'STATICFILES_DIRS'):
            for static_dir in settings.STATICFILES_DIRS:
                path = os.path.join(static_dir, uri.replace(settings.STATIC_URL, ""))
                if os.path.isfile(path):
                    return path
        
        return uri

    @staticmethod
    def _prepare_context(evaluacion, tipo_evaluacion):
        """Prepara el contexto común para ambos tipos de evaluación"""
        try:
            logger.info("Iniciando preparación de contexto")
            
            # Asegurar que logro_obtenido esté actualizado
            if hasattr(evaluacion, 'calcular_logro'):
                evaluacion.calcular_logro()
                evaluacion.refresh_from_db()
            
            porcentaje_total = float(evaluacion.logro_obtenido) if evaluacion.logro_obtenido else 0
            
            # Procesar áreas usando método unificado
            areas_procesadas, puntaje_total_obtenido, puntaje_total_maximo = (
                EvaluacionPDFGenerator._process_areas(evaluacion)
            )
            
            # Contexto base
            context = {
                'evaluacion': evaluacion,
                'tipo_evaluacion': EvaluacionPDFGenerator._get_tipo_evaluacion_nombre(evaluacion.tipo_evaluacion),
                'areas_data': areas_procesadas,
                'puntaje_total_obtenido': puntaje_total_obtenido,
                'puntaje_total_maximo': puntaje_total_maximo,
                'porcentaje_total': porcentaje_total,
                'nivel_logro': EvaluacionPDFGenerator._get_nivel_texto(porcentaje_total),
                'nivel_logro_info': EvaluacionPDFGenerator._get_nivel_logro(porcentaje_total),
                'estado_display': EvaluacionPDFGenerator._get_estado_display(evaluacion),
                'fecha_generacion': timezone.now(),
                'institucion': EvaluacionPDFGenerator._get_institucion_nombre(evaluacion.persona),
                'resumen_estadisticas': EvaluacionPDFGenerator._get_resumen_estadisticas(areas_procesadas),
            }
            
            # Agregar información específica del evaluador para evaluaciones de jefe
            if tipo_evaluacion == 'evaluacion_jefe':
                context['evaluador_info'] = EvaluacionPDFGenerator._get_evaluador_info(evaluacion)
            
            # Para autoevaluaciones, usar estructura diferente
            if tipo_evaluacion == 'autoevaluacion':
                context['areas'] = areas_procesadas
            
            logger.info("Contexto preparado exitosamente")
            return context
            
        except Exception as e:
            logger.error(f"Error preparando contexto: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def _process_areas(evaluacion):
        """Procesa las áreas de evaluación de manera unificada"""
        # Siempre usar el método de template ya que TipoEvaluacion no tiene template_data
        return EvaluacionPDFGenerator._process_areas_from_template(evaluacion)

    @staticmethod
    def _process_areas_from_json(evaluacion):
        """Procesa áreas desde template_data JSON"""
        try:
            template_data = evaluacion.tipo_evaluacion.template_data
            respuestas_dict = {r.indicador_id: r for r in evaluacion.respuestas.all()}
            
            areas_procesadas = []
            puntaje_total_obtenido = 0
            puntaje_total_maximo = 0
            
            for area_data in template_data.get('areas', []):
                area_procesada = EvaluacionPDFGenerator._process_area_from_json(area_data, respuestas_dict)
                areas_procesadas.append(area_procesada)
                puntaje_total_obtenido += area_procesada['puntaje_obtenido']
                puntaje_total_maximo += area_procesada['puntaje_maximo']
            
            return areas_procesadas, puntaje_total_obtenido, puntaje_total_maximo
            
        except Exception as e:
            logger.error(f"Error procesando áreas desde JSON: {str(e)}")
            raise

    @staticmethod
    def _process_area_from_json(area_data, respuestas_dict):
        """Procesa un área desde datos JSON"""
        competencias_procesadas = []
        puntaje_area_obtenido = 0
        puntaje_area_maximo = 0
        
        for competencia_data in area_data.get('competencias', []):
            competencia_procesada = EvaluacionPDFGenerator._process_competencia_from_json(
                competencia_data, respuestas_dict
            )
            competencias_procesadas.append(competencia_procesada)
            puntaje_area_obtenido += competencia_procesada['puntaje_obtenido']
            puntaje_area_maximo += competencia_procesada['puntaje_maximo']
        
        porcentaje_area = EvaluacionPDFGenerator._calculate_percentage(
            puntaje_area_obtenido, puntaje_area_maximo
        )
        
        return {
            'area': {
                'id': area_data.get('id'),
                'nombre': area_data.get('nombre', 'Área sin nombre')
            },
            'competencias': competencias_procesadas,
            'puntaje_obtenido': puntaje_area_obtenido,
            'puntaje_maximo': puntaje_area_maximo,
            'porcentaje': porcentaje_area
        }

    @staticmethod
    def _process_competencia_from_json(competencia_data, respuestas_dict):
        """Procesa una competencia desde datos JSON"""
        indicadores_procesados = []
        puntaje_competencia_obtenido = 0
        puntaje_competencia_maximo = 0
        
        for indicador_data in competencia_data.get('indicadores', []):
            indicador_procesado = EvaluacionPDFGenerator._process_indicador_from_json(
                indicador_data, respuestas_dict
            )
            indicadores_procesados.append(indicador_procesado)
            puntaje_competencia_obtenido += indicador_procesado['puntaje_obtenido']
            puntaje_competencia_maximo += indicador_procesado['puntaje_maximo']
        
        porcentaje_competencia = EvaluacionPDFGenerator._calculate_percentage(
            puntaje_competencia_obtenido, puntaje_competencia_maximo
        )
        
        return {
            'competencia': {
                'id': competencia_data.get('id'),
                'nombre': competencia_data.get('nombre', 'Competencia sin nombre')
            },
            'indicadores': indicadores_procesados,
            'puntaje_obtenido': puntaje_competencia_obtenido,
            'puntaje_maximo': puntaje_competencia_maximo,
            'porcentaje': puntaje_competencia,
            'nivel_logro': EvaluacionPDFGenerator._get_nivel_texto(porcentaje_competencia),
            'nivel_css': EvaluacionPDFGenerator._get_nivel_class(porcentaje_competencia)
        }

    @staticmethod
    def _process_indicador_from_json(indicador_data, respuestas_dict):
        """Procesa un indicador desde datos JSON"""
        indicador_id = indicador_data.get('id')
        respuesta = respuestas_dict.get(indicador_id)
        
        puntaje_obtenido = respuesta.puntaje if respuesta else 0
        puntaje_maximo = indicador_data.get('puntaje_maximo', 5)
        porcentaje = EvaluacionPDFGenerator._calculate_percentage(puntaje_obtenido, puntaje_maximo)
        
        return {
            'indicador': {
                'id': indicador_id,
                'descripcion': indicador_data.get('descripcion', 'Indicador sin descripción')
            },
            'puntaje_obtenido': puntaje_obtenido,
            'puntaje_maximo': puntaje_maximo,
            'porcentaje': puntaje,
            'nivel_logro': EvaluacionPDFGenerator._get_nivel_texto(porcentaje),
            'nivel_css': EvaluacionPDFGenerator._get_nivel_class(porcentaje)
        }

    @staticmethod
    def _process_areas_from_template(evaluacion):
        """Procesa áreas desde modelos de template tradicionales"""
        try:
            areas = evaluacion.tipo_evaluacion.areas.prefetch_related(
                'competencias__indicadores'
            ).all()
            
            respuestas_dict = {r.indicador: r for r in evaluacion.respuestas.all()}
            
            areas_procesadas = []
            puntaje_total_obtenido = 0
            puntaje_total_maximo = 0
            
            for area in areas:
                area_procesada = EvaluacionPDFGenerator._process_area_from_template(area, respuestas_dict)
                areas_procesadas.append(area_procesada)
                puntaje_total_obtenido += area_procesada['puntaje_obtenido']
                puntaje_total_maximo += area_procesada['puntaje_maximo']
            
            return areas_procesadas, puntaje_total_obtenido, puntaje_total_maximo
            
        except Exception as e:
            logger.error(f"Error procesando áreas desde template: {str(e)}")
            raise

    @staticmethod
    def _process_area_from_template(area, respuestas_dict):
        """Procesa un área desde modelo de template"""
        competencias_procesadas = []
        puntaje_area_obtenido = 0
        puntaje_area_maximo = 0
        
        for competencia in area.competencias.all():
            competencia_procesada = EvaluacionPDFGenerator._process_competencia_from_template(
                competencia, respuestas_dict
            )
            competencias_procesadas.append(competencia_procesada)
            puntaje_area_obtenido += competencia_procesada['puntaje_obtenido']
            puntaje_area_maximo += competencia_procesada['puntaje_maximo']
        
        porcentaje_area = EvaluacionPDFGenerator._calculate_percentage(
            puntaje_area_obtenido, puntaje_area_maximo
        )
        
        return {
            'area': area,
            'competencias': competencias_procesadas,
            'puntaje_obtenido': puntaje_area_obtenido,
            'puntaje_maximo': puntaje_area_maximo,
            'porcentaje': porcentaje_area
        }

    @staticmethod
    def _process_competencia_from_template(competencia, respuestas_dict):
        """Procesa una competencia desde modelo de template"""
        indicadores_procesados = []
        puntaje_competencia_obtenido = 0
        puntaje_competencia_maximo = 0
        
        for indicador in competencia.indicadores.all():
            indicador_procesado = EvaluacionPDFGenerator._process_indicador_from_template(
                indicador, respuestas_dict
            )
            indicadores_procesados.append(indicador_procesado)
            puntaje_competencia_obtenido += indicador_procesado['puntaje_obtenido']
            puntaje_competencia_maximo += indicador_procesado['puntaje_maximo']
        
        porcentaje_competencia = EvaluacionPDFGenerator._calculate_percentage(
            puntaje_competencia_obtenido, puntaje_competencia_maximo
        )
        
        return {
            'competencia': competencia,
            'indicadores': indicadores_procesados,
            'puntaje_obtenido': puntaje_competencia_obtenido,
            'puntaje_maximo': puntaje_competencia_maximo,
            'porcentaje': porcentaje_competencia,
            'nivel_logro': EvaluacionPDFGenerator._get_nivel_texto(porcentaje_competencia),
            'nivel_css': EvaluacionPDFGenerator._get_nivel_class(porcentaje_competencia)
        }

    @staticmethod
    def _process_indicador_from_template(indicador, respuestas_dict):
        """Procesa un indicador desde modelo de template"""
        respuesta = respuestas_dict.get(indicador.id)
        puntaje_obtenido = respuesta.puntaje if respuesta else 0
        
        # Obtener puntaje máximo desde los niveles de logro del indicador
        puntaje_maximo = indicador.aggregate_max_puntaje() if hasattr(indicador, 'aggregate_max_puntaje') else 5
        porcentaje = EvaluacionPDFGenerator._calculate_percentage(puntaje_obtenido, puntaje_maximo)
        
        return {
            'indicador': indicador,
            'puntaje_obtenido': puntaje_obtenido,
            'puntaje_maximo': puntaje_maximo,
            'porcentaje': porcentaje,
            'nivel_logro': EvaluacionPDFGenerator._get_nivel_texto(porcentaje),
            'nivel_css': EvaluacionPDFGenerator._get_nivel_class(porcentaje)
        }

    @staticmethod
    def _calculate_percentage(obtenido, maximo):
        """Calcula el porcentaje de manera segura"""
        return (obtenido / maximo * 100) if maximo > 0 else 0

    @staticmethod
    def _get_nivel_texto(porcentaje):
        """Obtiene el texto del nivel basado en el porcentaje"""
        for nivel in EvaluacionPDFGenerator.NIVELES_LOGRO:
            if porcentaje >= nivel['min_porcentaje']:
                return nivel['texto']
        return 'Insuficiente'

    @staticmethod
    def _get_nivel_class(porcentaje):
        """Obtiene la clase CSS del nivel basado en el porcentaje"""
        if porcentaje >= 90:
            return 'excelente'
        elif porcentaje >= 70:
            return 'bueno'
        elif porcentaje >= 50:
            return 'satisfactorio'
        else:
            return 'insatisfactorio'

    @staticmethod
    def _get_nivel_logro(porcentaje):
        """Obtiene información completa del nivel de logro"""
        for nivel in EvaluacionPDFGenerator.NIVELES_LOGRO:
            if porcentaje >= nivel['min_porcentaje']:
                return {
                    'texto': nivel['texto'],
                    'clase': EvaluacionPDFGenerator._get_nivel_class(porcentaje),
                    'descripcion': f"Desempeño {nivel['texto'].lower()} con {porcentaje:.1f}% de logro"
                }
        return {
            'texto': 'Insuficiente',
            'clase': 'insatisfactorio',
            'descripcion': f"Desempeño insuficiente con {porcentaje:.1f}% de logro"
        }

    @staticmethod
    def _get_evaluador_info(evaluacion):
        """Obtiene información del evaluador"""
        if hasattr(evaluacion, 'evaluador') and evaluacion.evaluador:
            return {
                'nombre': evaluacion.evaluador.get_full_name(),
                'email': evaluacion.evaluador.email
            }
        return None

    @staticmethod
    def _get_resumen_estadisticas(areas):
        """Calcula estadísticas resumidas"""
        if not areas:
            return {
                'total_areas': 0,
                'total_competencias': 0,
                'promedio_areas': 0
            }
        
        total_competencias = sum(len(area.get('competencias', [])) for area in areas)
        promedio_areas = sum(area.get('porcentaje', 0) for area in areas) / len(areas)
        
        return {
            'total_areas': len(areas),
            'total_competencias': total_competencias,
            'promedio_areas': promedio_areas
        }

    @staticmethod
    def _get_estado_display(evaluacion):
        """Obtiene el estado de la evaluación en formato legible"""
        estados = [
            ('firmado', 'Firmado y Completado'),
            ('firmado_obs', 'Firmado con Observaciones'),
            ('cerrado_para_firma', 'Cerrado para Firma'),
            ('retroalimentacion_completada', 'Retroalimentación Completada'),
            ('completado', 'Completado')
        ]
        
        for atributo, descripcion in estados:
            if getattr(evaluacion, atributo, False):
                return descripcion
        
        return "En Proceso"

    @staticmethod
    def _get_institucion_nombre(persona):
        """Obtiene el nombre de la institución"""
        try:
            if hasattr(persona, 'perfil') and persona.perfil:
                if hasattr(persona.perfil, 'institucion') and persona.perfil.institucion:
                    return persona.perfil.institucion.nombre
                elif hasattr(persona.perfil, 'departamento') and persona.perfil.departamento:
                    if hasattr(persona.perfil.departamento, 'institucion'):
                        return persona.perfil.departamento.institucion.nombre
            return "Institución No Especificada"
        except Exception as e:
            logger.warning(f"Error obteniendo institución: {str(e)}")
            return "Institución No Disponible"

    @staticmethod
    def _get_tipo_evaluacion_nombre(tipo_evaluacion):
        """Obtiene el nombre del tipo de evaluación"""
        if tipo_evaluacion:
            return tipo_evaluacion.n_tipo_evaluacion
        return "Tipo de Evaluación No Especificado"

    @staticmethod
    def generate_pdf_filename(evaluacion):
        """Genera un nombre de archivo para el PDF"""
        try:
            fecha_str = timezone.now().strftime("%Y%m%d_%H%M%S")
            nombre_persona = slugify(evaluacion.persona.get_full_name())
            
            if hasattr(evaluacion, 'evaluador'):
                return f"evaluacion_jefe_{nombre_persona}_{fecha_str}_{evaluacion.id}.pdf"
            else:
                return f"autoevaluacion_{nombre_persona}_{fecha_str}_{evaluacion.id}.pdf"
        except Exception as e:
            logger.warning(f"Error generando nombre de archivo: {str(e)}")
            return f"evaluacion_{fecha_str}_{evaluacion.id}.pdf"