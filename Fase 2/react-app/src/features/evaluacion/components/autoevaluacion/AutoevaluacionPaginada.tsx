import Pagination from "../common/Pagination";

import AutoevaluacionBloque from "./AutoevaluacionBloque";

import {
  TipoEvaluacion,
  AreaEvaluacion,
} from "@/features/evaluacion/types/evaluacion";
import { Respuesta } from "@/features/evaluacion/types/asignar/evaluacion";

interface AutoevaluacionPaginadaProps {
  estructura: TipoEvaluacion;
  respuestas: Respuesta[];
  actualizarPuntaje: (indicadorId: number, puntaje: number) => void;
  autoevaluacionId: number;
}

export default function AutoevaluacionPaginada({
  estructura,
  respuestas,
  actualizarPuntaje,
  autoevaluacionId,
}: AutoevaluacionPaginadaProps) {
  return (
    <Pagination
      estructura={estructura}
      renderBloque={(areaActual: AreaEvaluacion) => (
        <AutoevaluacionBloque
          actualizarPuntaje={actualizarPuntaje}
          area={areaActual}
          autoevaluacionId={autoevaluacionId}
          estructura={estructura}
          respuestas={respuestas}
        />
      )}
      titulo="Autoevaluación"
    />
  );
}
