import Pagination from "../common/Pagination";

import EvaluacionBloque from "./EvaluacionBloque";

interface EvaluacionPaginadaProps {
  estructura: any;
  respuestas: any[];
  actualizarPuntaje: (indicadorId: number, puntaje: number) => void;
  evaluacionId: number;
}

export default function EvaluacionPaginada({
  estructura,
  respuestas,
  actualizarPuntaje,
  evaluacionId,
}: EvaluacionPaginadaProps) {
  return (
    <Pagination
      estructura={estructura}
      renderBloque={(areaActual: any) => (
        <EvaluacionBloque
          actualizarPuntaje={actualizarPuntaje}
          area={areaActual}
          estructura={estructura}
          evaluacionId={evaluacionId}
          respuestas={respuestas}
        />
      )}
      titulo=""
    />
  );
}
