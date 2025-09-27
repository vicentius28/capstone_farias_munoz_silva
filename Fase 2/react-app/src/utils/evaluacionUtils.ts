import { TipoEvaluacion } from "@/features/evaluacion/types/evaluacion";
import { Respuesta } from "@/features/evaluacion/types/asignar/evaluacion";

export function calcularLogroFinal(
  estructura: TipoEvaluacion,
  respuestas: Respuesta[],
): number | null {
  let totalPonderado = 0;
  let sumaPonderaciones = 0;
  const mapRespuestas = Object.fromEntries(
    respuestas.map((r) => [r.indicador, r.puntaje]),
  );

  for (const area of estructura.areas) {
    const ponderacion = area.ponderacion ?? 0;

    if (ponderacion === 0) continue;

    let obtenido = 0;
    let maximo = 0;

    for (const comp of area.competencias) {
      for (const ind of comp.indicadores) {
        const maxPuntaje = Math.max(
          ...(ind.nvlindicadores?.map((n) => n.puntaje) || [0]),
        );

        maximo += maxPuntaje;
        const puntaje = mapRespuestas[ind.id];

        if (puntaje !== undefined) obtenido += puntaje;
      }
    }

    if (maximo > 0) {
      const porcentaje = (obtenido / maximo) * 100;

      totalPonderado += porcentaje * ponderacion;
      sumaPonderaciones += ponderacion;
    }
  }

  return sumaPonderaciones > 0
    ? parseFloat((totalPonderado / sumaPonderaciones).toFixed(2))
    : null;
}

export function esEvaluacionCualitativa(estructura: TipoEvaluacion): boolean {
  return estructura.areas.every((a) => (a.ponderacion ?? 0) === 0);
}
