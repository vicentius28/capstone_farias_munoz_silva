import { Button } from "@heroui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@heroui/input";

import CompetenciaTabs from "./CompetenciaTabs";

import { AreaEvaluacion } from "@/features/evaluacion/types/evaluacion";
import useEvaluacionStore from "@/stores/evaluacion/plantilla/useEvaluacionStore";
import {
  IndicadorHandlers,
  NivelHandlers,
  CompetenciaHandlers,
} from "@/features/evaluacion/types/plantilla/plantilla";

interface Props {
  isEditing: boolean;
  areas: AreaEvaluacion[];
  onAreaChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddArea: () => void;
  onRemoveArea: (index: number) => void;
  competenciaHandlers: CompetenciaHandlers;
  indicadorHandlers: IndicadorHandlers;
  nivelHandlers: NivelHandlers;
  updatePonderacion?: (index: number, value: number) => void;
}

export default function AreaTabs({
  isEditing,
  areas = [], // ✅ CORRECCIÓN 1: Valor por defecto en props
  onAreaChange,
  onAddArea,
  onRemoveArea,
  competenciaHandlers,
  indicadorHandlers,
  nivelHandlers,
  updatePonderacion,
}: Props) {
  const { activeAreaIndex, setActiveAreaIndex } = useEvaluacionStore();

  const handleAddArea = () => {
    onAddArea();
    setActiveAreaIndex(areas.length);
  };

  // ✅ CORRECCIÓN 2: Validación de seguridad. Si no hay áreas, no renderizamos nada o un placeholder.
  if (!areas) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-default-800 mt-8">
        Áreas de Evaluación
      </h2>

      {/* Grid de botones */}
      <div className="flex flex-wrap gap-3 mt-4">
        {/* ✅ CORRECCIÓN 3: Optional chaining por seguridad extra */}
        {areas?.map((area, areaIndex) => (
          <Button
            key={areaIndex}
            className={`px-4 py-2 rounded-md border text-sm font-medium transition-all
              ${
                activeAreaIndex === areaIndex
                  ? "bg-secondary text-white border-secondary"
                  : "text-default-800 border-default-300 hover:bg-default-100"
              }`}
            type="button"
            onPress={() => setActiveAreaIndex(areaIndex)}
          >
            📘 {area.n_area || `Área ${areaIndex + 1}`}
          </Button>
        ))}
      </div>

      {/* Contenido del área activa */}
      {/* ✅ CORRECCIÓN 4: Verificar que el área en el índice activo realmente existe */}
      {areas[activeAreaIndex] ? (
        <div className="space-y-4 mt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                required
                id={`area-${activeAreaIndex}-n_area`}
                isDisabled={!isEditing}
                label="Nombre del Área"
                labelPlacement="outside"
                name="n_area"
                placeholder="Ej: I.CUMPLIMIENTO"
                type="text"
                value={areas[activeAreaIndex].n_area || ""} // Evitar controlled/uncontrolled warning
                variant="faded"
                onChange={(e) => onAreaChange(activeAreaIndex, e)}
              />
            </div>

            <div className="w-40">
              <Input
                endContent={
                  <span className="text-default-500 text-sm pr-1">%</span>
                }
                id={`area-${activeAreaIndex}-ponderacion`}
                isDisabled={!isEditing}
                label="Ponderación (%)"
                labelPlacement="outside"
                max={100}
                min={0}
                name="ponderacion"
                placeholder="Ej: 25"
                type="number"
                value={(areas[activeAreaIndex].ponderacion ?? 0).toString()}
                variant="faded"
                onChange={(e) => {
                  const value = Math.min(
                    Math.max(parseInt(e.target.value || "0", 10), 0),
                    100,
                  );
                  updatePonderacion?.(activeAreaIndex, value);
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {isEditing && (
              <Button
                color="primary"
                startContent={<PlusCircle size={16} />}
                variant="shadow"
                onPress={handleAddArea}
              >
                Agregar Área
              </Button>
            )}

            {isEditing && areas.length > 1 && (
              <Button
                color="danger"
                startContent={<Trash2 size={16} />}
                variant="shadow"
                onPress={() => onRemoveArea(activeAreaIndex)}
              >
                Borrar Área
              </Button>
            )}
          </div>

          <CompetenciaTabs
            areaIndex={activeAreaIndex}
            competenciaHandlers={competenciaHandlers}
            competencias={areas[activeAreaIndex].competencias || []} // ✅ Seguridad extra
            indicadorHandlers={indicadorHandlers}
            isEditing={isEditing}
            nivelHandlers={nivelHandlers}
          />
        </div>
      ) : (
        // Estado vacío si estamos cargando o no hay áreas seleccionadas
        <div className="mt-8 p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400">
           {areas.length === 0 ? "No hay áreas definidas." : "Selecciona un área."}
        </div>
      )}
    </div>
  );
}