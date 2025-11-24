# evaluacion/views/mixto_views.py
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from evaluacion.models import (
    JefeEvaluacionAsignadaDetalle,
    EvaluacionAsignada,
    Autoevaluacion,
    EvaluacionJefe,
)
from evaluacion.serializers.mixto_serializers import EvaluacionMixtaSerializer


class EvaluacionMixtaViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, pk=None):
        # 1) Detalle (jefatura) - CORREGIDO: filtrar por evaluador
        detalle = get_object_or_404(
            JefeEvaluacionAsignadaDetalle.objects.select_related(
                "asignacion", "asignacion__tipo_evaluacion",
                "persona", "evaluador"
            ),
            pk=pk,
            evaluador=request.user  # ✅ FILTRO POR JEFE AGREGADO
        )
        asign_jefe = detalle.asignacion
        tipo_jefe = asign_jefe.tipo_evaluacion
        periodo = asign_jefe.fecha_evaluacion
        persona = detalle.persona

        # 2) Asignación AUTO (pareo por tipo + período + persona; con fallback)
        asign_auto = (
            EvaluacionAsignada.objects
            .filter(
                auto_tipo_evaluacion=tipo_jefe,
                fecha_evaluacion=periodo,
                personas_asignadas=persona
            )
            .select_related("tipo_evaluacion")
            .first()
        ) or (
            EvaluacionAsignada.objects
            .filter(
                fecha_evaluacion=periodo,
                personas_asignadas=persona
            )
            .select_related("tipo_evaluacion", "auto_tipo_evaluacion")
            .order_by("-id")
            .first()
        )

        # 3) Autoevaluación - CORREGIDO: usar campos correctos del modelo
        auto = None
        if asign_auto:
            auto = (
                Autoevaluacion.objects
                .filter(
                    persona=persona,
                    tipo_evaluacion=asign_auto.tipo_evaluacion,
                    fecha_evaluacion=periodo
                )
                .select_related("persona", "tipo_evaluacion")
                .prefetch_related("respuestas")
                .first()
            )
        if not auto and asign_auto and getattr(asign_auto, "tipo_evaluacion", None):
            auto = (
                Autoevaluacion.objects
                .filter(
                    persona=persona,
                    tipo_evaluacion=asign_auto.tipo_evaluacion,
                    fecha_evaluacion=periodo
                )
                .select_related("persona", "tipo_evaluacion")
                .prefetch_related("respuestas")
                .first()
            )

        # 4) Evaluación Jefatura
        jefe = (
            EvaluacionJefe.objects
            .filter(
                persona=persona,
                tipo_evaluacion=tipo_jefe,
                fecha_evaluacion=periodo,
                evaluador=detalle.evaluador,
            )
            .select_related("persona", "evaluador", "tipo_evaluacion")
            .prefetch_related("respuestas")
            .order_by("-id")
            .first()
        )

        # ---------- helpers ----------
        def _rel(obj, *names):
            for n in names:
                rel = getattr(obj, n, None)
                if rel is not None:
                    try:
                        return rel.all() if hasattr(rel, "all") else rel
                    except Exception:
                        return rel
            return []

        def _ordered(qs_or_iter, *by):
            try:
                for f in (by or ("orden", "posicion", "numero", "id")):
                    try:
                        return list(qs_or_iter.order_by(f))
                    except Exception:
                        continue
                return list(qs_or_iter)
            except Exception:
                return list(qs_or_iter)

        def _nombre(obj, *candidatos):
            if not obj:
                return None
            for c in candidatos:
                v = getattr(obj, c, None)
                if v:
                    return str(v)
            return None

        # 5) Plantilla AUTO (para recorrer en paralelo si existe)
        tipo_auto = (
            getattr(asign_auto, "tipo_evaluacion", None)
            or getattr(auto, "tipo_evaluacion", None)
        )

        # 6) Mapas por POSICIÓN - CORREGIDO: usar estructura_json si existe
        def mapear_por_posicion(evaluacion):
            if not evaluacion:
                return {}
            
            # ✅ USAR estructura_json si existe (para evaluaciones con snapshot)
            if hasattr(evaluacion, 'estructura_json') and evaluacion.estructura_json:
                pos = {}
                idx = 0
                for area in evaluacion.estructura_json.get('areas', []):
                    for comp in area.get('competencias', []):
                        for ind in comp.get('indicadores', []):
                            rid = ind['id']
                            r = evaluacion.respuestas.filter(indicador=rid).first()
                            pos[idx] = r.puntaje if r else None
                            idx += 1
                return pos
            
            # Fallback al método original si no hay estructura_json
            if not getattr(evaluacion, "tipo_evaluacion", None):
                return {}
            pos = {}
            idx = 0
            for area in _ordered(_rel(evaluacion.tipo_evaluacion, "areas", "areas_evaluacion", "area_set"), "orden", "id"):
                for comp in _ordered(_rel(area, "competencias", "competencias_evaluacion", "competencia_set"), "orden", "id"):
                    for ind in _ordered(_rel(comp, "indicadores", "indicadores_evaluacion", "indicador_set"), "orden", "numero", "id"):
                        rid = getattr(ind, "id", None)
                        r = evaluacion.respuestas.filter(indicador=rid).first() if rid is not None else None
                        pos[idx] = r.puntaje if r else None
                        idx += 1
            return pos

        pa_map = mapear_por_posicion(auto)  # Auto
        pj_map = mapear_por_posicion(jefe)  # Jefe

        # 7) Plantilla base (usamos jefatura como "oficial")
        tipo_base = tipo_jefe or tipo_auto
        if not tipo_base:
            return Response({"detail": "No se encontró una plantilla base (tipo_evaluacion)."}, status=404)

        # 8) Recorrido paralelo POR POSICIÓN y acumuladores de totales
        # ✅ USAR estructura_json si existe, sino usar plantilla actual
        if jefe and hasattr(jefe, 'estructura_json') and jefe.estructura_json:
            areas_j = jefe.estructura_json.get('areas', [])
        else:
            areas_j = _ordered(_rel(tipo_jefe, "areas", "areas_evaluacion", "area_set"), "orden", "id")
            
        if auto and hasattr(auto, 'estructura_json') and auto.estructura_json:
            areas_a = auto.estructura_json.get('areas', [])
        elif tipo_auto:
            areas_a = _ordered(_rel(tipo_auto, "areas", "areas_evaluacion", "area_set"), "orden", "id")
        else:
            areas_a = []
            
        n_areas = min(len(areas_j), len(areas_a)) if areas_a else len(areas_j)

        areas_data = []
        idx_pos = 0

        total_max_posible = 0.0
        auto_pts_sum = 0.0
        jefe_pts_sum = 0.0

        for i in range(n_areas):
            area_j = areas_j[i]
            area_a = areas_a[i] if areas_a else None
            
            # Manejar tanto dict (estructura_json) como objetos (plantilla)
            if isinstance(area_j, dict):
                nombre_area = area_j.get("n_area", "Área")
                comps_j = area_j.get("competencias", [])
            else:
                nombre_area = getattr(area_j, "n_area", None) or "Área"
                comps_j = _ordered(_rel(area_j, "competencias", "competencias_evaluacion", "competencia_set"), "orden", "id")
            
            if isinstance(area_a, dict):
                comps_a = area_a.get("competencias", [])
            elif area_a:
                comps_a = _ordered(_rel(area_a, "competencias", "competencias_evaluacion", "competencia_set"), "orden", "id")
            else:
                comps_a = []
                
            n_comps = min(len(comps_j), len(comps_a)) if comps_a else len(comps_j)

            comps_data = []
            for j in range(n_comps):
                comp_j = comps_j[j]
                comp_a = comps_a[j] if comps_a else None
                
                if isinstance(comp_j, dict):
                    nombre_comp = comp_j.get("name", "Competencia")
                    inds_j = comp_j.get("indicadores", [])
                else:
                    nombre_comp = getattr(comp_j, "name", None) or "Competencia"
                    inds_j = _ordered(_rel(comp_j, "indicadores", "indicadores_evaluacion", "indicador_set"), "orden", "numero", "id")
                
                if isinstance(comp_a, dict):
                    inds_a = comp_a.get("indicadores", [])
                elif comp_a:
                    inds_a = _ordered(_rel(comp_a, "indicadores", "indicadores_evaluacion", "indicador_set"), "orden", "numero", "id")
                else:
                    inds_a = []
                    
                n_inds = min(len(inds_j), len(inds_a)) if inds_a else len(inds_j)

                inds_data = []
                for k in range(n_inds):
                    ind_j = inds_j[k]
                    ind_a = inds_a[k] if inds_a else None

                    if isinstance(ind_j, dict):
                        numero = ind_j.get("numero")
                        ind_id = ind_j.get("id")
                        niveles_data = ind_j.get("nvlindicadores", [])
                    else:
                        numero = getattr(ind_j, "numero", None)
                        ind_id = getattr(ind_j, "id", None)
                        niveles = getattr(ind_j, "nvlindicadores", None)
                        niveles_data = niveles.all() if hasattr(niveles, "all") else (niveles or [])
                    
                    display = f"Indicador {numero}" if numero is not None else "Indicador"

                    pa = pa_map.get(idx_pos)
                    pj = pj_map.get(idx_pos)

                    # Máximo posible de este indicador
                    max_puntaje = 0.0
                    try:
                        if isinstance(niveles_data, list) and niveles_data:
                            if isinstance(niveles_data[0], dict):
                                vals = [float(n.get('puntaje', 0)) for n in niveles_data]
                            else:
                                vals = [float(n.puntaje) for n in niveles_data]
                            max_puntaje = min(max(vals), 4.0)  # tope 4
                        else:
                            max_puntaje = 4.0
                    except Exception:
                        max_puntaje = 4.0

                    total_max_posible += max_puntaje
                    if pa is not None:
                        auto_pts_sum += float(pa)
                    if pj is not None:
                        jefe_pts_sum += float(pj)

                    delta = (pj - pa) if (pa is not None and pj is not None) else None
                    idx_pos += 1

                    inds_data.append({
                        "id": ind_id,
                        "nombre": ind_j.get("indicador") if isinstance(ind_j, dict) else getattr(ind_j, "indicador", None),
                        "puntaje_auto": pa,
                        "puntaje_jefe": pj,
                        "delta": delta,
                    })

                comps_data.append({
                    "id": comp_j.get("id") if isinstance(comp_j, dict) else getattr(comp_j, "id", None),
                    "nombre": nombre_comp,
                    "indicadores": inds_data
                })

            areas_data.append({
                "id": area_j.get("id") if isinstance(area_j, dict) else getattr(area_j, "id", None),
                "nombre": nombre_area,
                "competencias": comps_data
            })

        # 9) Totales y porcentajes - USAR logro_obtenido directamente
        def _pct(part, total):
            if part is None or total is None or total <= 0:
                return None
            return round((part / total) * 100.0, 2)

        # Asegurar que logro_obtenido esté actualizado
        if auto and hasattr(auto, 'calcular_logro'):
            auto.calcular_logro()
            auto.refresh_from_db()
            
        if jefe and hasattr(jefe, 'calcular_logro'):
            jefe.calcular_logro()
            jefe.refresh_from_db()
            
        # Usar logro_obtenido de las evaluaciones en lugar de cálculo manual
        auto_pct = getattr(auto, 'logro_obtenido', None) if auto else None
        jefe_pct = getattr(jefe, 'logro_obtenido', None) if jefe else None
        
        # ✅ CORREGIDO: Usar suma real de puntajes en lugar de conversión artificial
        auto_pts = auto_pts_sum if auto_pts_sum > 0 else None
        jefe_pts = jefe_pts_sum if jefe_pts_sum > 0 else None
        max_pts = total_max_posible if total_max_posible > 0 else None

        # Calcular deltas usando los valores reales de puntos
        delta_pct = (float(jefe_pct) - float(auto_pct)) if (auto_pct is not None and jefe_pct is not None) else None
        delta_pts = (jefe_pts - auto_pts) if (auto_pts is not None and jefe_pts is not None) else None

        respondidos_auto = sum(1 for v in pa_map.values() if v is not None)
        respondidos_jefe = sum(1 for v in pj_map.values() if v is not None)

        # 10) Payload
        payload = {
            "tipo_evaluacion_id": tipo_base.id,
            "tipo_evaluacion": _nombre(tipo_base, "n_tipo_evaluacion", "nombre") or str(tipo_base.id),

            "persona_id": persona.id if persona else None,
            "persona_nombre": f"{getattr(persona, 'first_name', '')} {getattr(persona, 'last_name', '')}".strip() if persona else None,
            "evaluador_id": detalle.evaluador_id if jefe else None,
            "evaluador_nombre": f"{getattr(detalle.evaluador, 'first_name', '')} {getattr(detalle.evaluador, 'last_name', '')}".strip()
                                if (jefe and getattr(detalle, 'evaluador', None)) else None,

            "fecha_evaluacion": periodo,

            "evaluacion_auto_id": getattr(auto, "id", None),
            "evaluacion_auto_nombre": _nombre(getattr(asign_auto, "tipo_evaluacion", None) or getattr(auto, "tipo_evaluacion", None) or tipo_base,
                                              "n_tipo_evaluacion", "nombre"),
            "evaluacion_jefe_id": getattr(jefe, "id", None),
            "evaluacion_jefe_nombre": _nombre(tipo_jefe, "n_tipo_evaluacion", "nombre"),

            "areas": areas_data,
            "resumen": {
                # puntos calculados desde logro_obtenido
                "auto_pts": auto_pts,
                "jefe_pts": jefe_pts,
                "max_pts": max_pts,
                "delta_pts": delta_pts,
                # porcentajes desde logro_obtenido
                "auto_pct": float(auto_pct) if auto_pct is not None else None,
                "jefe_pct": float(jefe_pct) if jefe_pct is not None else None,
                "delta_pct": delta_pct,
                # conteo de ítems respondidos
                "respondidos_auto": respondidos_auto,
                "respondidos_jefe": respondidos_jefe,
            }
        }

        return Response(EvaluacionMixtaSerializer(payload).data)
