// utils/validacionEvaluacion.ts
import useEvaluacionStore from "@/stores/evaluacion/plantilla/useEvaluacionStore";

export function validarEvaluacion() {
  const { nombreTipoEvaluacion, areas } = useEvaluacionStore.getState();

  if (!nombreTipoEvaluacion || nombreTipoEvaluacion.trim() === "") {
    return {
      valido: false,
      mensaje: "Debe ingresar el nombre de la evaluación",
      scrollId: "nombre-evaluacion",
    };
  }

  for (let aIdx = 0; aIdx < areas.length; aIdx++) {
    const area = areas[aIdx];

    if (!area.n_area || area.n_area.trim() === "") {
      return {
        valido: false,
        mensaje: `El nombre del Área ${aIdx + 1} está vacío`,
        scrollId: `area-${aIdx}-n_area`,
      };
    }
    if (!area.ponderacion || area.ponderacion <= 0) {
      return {
        valido: false,
        mensaje: `La ponderación del Área ${aIdx + 1} no es válida`,
        scrollId: `area-${aIdx}-ponderacion`,
      };
    }

    for (let cIdx = 0; cIdx < area.competencias.length; cIdx++) {
      const comp = area.competencias[cIdx];

      if (!comp.name || comp.name.trim() === "") {
        return {
          valido: false,
          mensaje: `La competencia ${cIdx + 1} en el área ${aIdx + 1} está vacía`,
          scrollId: `competencia-${cIdx}-name`,
        };
      }

      for (let iIdx = 0; iIdx < comp.indicadores.length; iIdx++) {
        const ind = comp.indicadores[iIdx];

        if (!ind.indicador || ind.indicador.trim() === "") {
          return {
            valido: false,
            mensaje: `Falta el texto del indicador ${iIdx + 1} en competencia ${cIdx + 1}, área ${aIdx + 1}`,
            scrollId: `indicador-${iIdx}-texto`,
          };
        }
        if (!ind.definicion || ind.definicion.trim() === "") {
          return {
            valido: false,
            mensaje: `Falta la definición del indicador ${iIdx + 1} en competencia ${cIdx + 1}, área ${aIdx + 1}`,
            scrollId: `indicador-${iIdx}-definicion`,
          };
        }
      }
    }
  }

  return { valido: true };
}
