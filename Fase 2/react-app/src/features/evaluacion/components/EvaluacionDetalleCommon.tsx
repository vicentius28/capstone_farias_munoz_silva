import { Card, CardHeader, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import {
  ChartBarIcon,
  UserIcon,
  CalendarIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { KeyBlock } from "@/features/evaluacion/components/autoevaluacion/PageInicio/Resumen/KeyBlock";
import { EvaluationUtils } from "@/features/evaluacion/constants/defaults";
import { TimelineEstado } from "@/features/evaluacion/components/flow";
import type { EvaluacionJefe } from "@/features/evaluacion/types/evaluacion";

type IndicadorDetalle = {
  id: number;
  nombre: string;
  puntaje: number;
  puntaje_maximo: number;
  porcentaje: number;
};

type CompetenciaDetalle = {
  id: number;
  nombre: string;
  indicadores: IndicadorDetalle[];
};

type AreaDetalle = {
  id: number;
  nombre: string;
  competencias: CompetenciaDetalle[];
  obtenido: number;
  maximo: number;
  porcentaje: number;
};

type EvaluacionDetalleProps = {
  titulo: string;
  periodo: string;
  usuario: string;
  areas: AreaDetalle[];
  puntajeTotal: number;
  puntajeMaximo: number;
  porcentajeTotal: number;
  onBack: () => void;
  tipo: 'autoevaluacion' | 'evaluacion_jefatura';
  text_destacar?: string | null;
  text_mejorar?: string | null;
  text_retroalimentacion?: string | null;
  estadoEvaluacion?: string | null; // Nuevo prop para el estado
  // Nuevas props para el TimelineEstado
  evaluacionData?: EvaluacionJefe | null;
  showTimelineEstado?: boolean;
};

// Utilidades centralizadas para eliminar redundancia
const EVALUATION_UTILS = {
  getScoreColor: (percentage: number): 'success' | 'warning' | 'danger' | 'primary' => {
    return EvaluationUtils.getColor(percentage);
  },

  getScoreLevel: (percentage: number): string => {
    // Usar directamente los textos de defaults.ts
    return EvaluationUtils.getText(percentage);
  },

  getScoreLevelIcon: (level: string) => {
    // Mapear según el nivel específico
    if (level === 'Destacado') return <CheckCircleIcon className="w-6 h-6" />;
    if (level === 'Competente') return <CheckCircleIcon className="w-6 h-6" />;
    if (level === 'Inicial') return <CheckCircleIcon className="w-6 h-6" />;
    return <ExclamationTriangleIcon className="w-6 h-6" />;
  }
};



export default function EvaluacionDetalleCommon({
  titulo,
  periodo,
  usuario,
  areas,
  puntajeTotal,
  puntajeMaximo,
  porcentajeTotal,
  text_destacar,
  text_mejorar,
  text_retroalimentacion,
  evaluacionData,
  showTimelineEstado = false,
}: EvaluacionDetalleProps) {
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
  const selectedArea = areas[selectedAreaIndex];

  const logroLevel = EVALUATION_UTILS.getScoreLevel(porcentajeTotal);
  const logroColor = EVALUATION_UTILS.getScoreColor(porcentajeTotal);

  const handleAreaChange = (index: number) => {
    setSelectedAreaIndex(index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/50 rounded-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <HeaderSection
          title={titulo}
          periodo={periodo}
          usuario={usuario}
        />

        {/* Resultado Principal */}
        <ResultadoPrincipalCard
          puntajeTotal={puntajeTotal}
          puntajeMaximo={puntajeMaximo}
          porcentajeTotal={porcentajeTotal}
          logroLevel={logroLevel}
          logroColor={logroColor}
        />

        {/* Timeline de Estado - Mostrar si está habilitado y hay datos */}
        {showTimelineEstado && evaluacionData && (
          <div className="mb-8">
            <TimelineEstado evaluacion={evaluacionData} />
          </div>
        )}

        {/* ÚNICA NAVEGACIÓN: Resumen por áreas */}
        <AreasProgressOverview
          areas={areas}
          selectedAreaIndex={selectedAreaIndex}
          onAreaSelect={handleAreaChange}
        />

        {/* Área seleccionada SIN navegación */}
        <SimpleAreaCard
          area={selectedArea}
          areaIndex={selectedAreaIndex}
          totalAreas={areas.length}
        />

        {/* Sección de comentarios */}
        {(text_destacar || text_mejorar || text_retroalimentacion) && (
          <div className="mt-8">
            <CommentsSection
              destacar={text_destacar}
              mejorar={text_mejorar}
              retroalimentacion={text_retroalimentacion}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderSection({ title, periodo, usuario }: {
  title: string;
  periodo: string;
  usuario: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            {title}
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-default-600">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{periodo}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>{usuario}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultadoPrincipalCard({
  puntajeTotal,
  puntajeMaximo,
  porcentajeTotal,
  logroLevel,
  logroColor
}: {
  puntajeTotal: number;
  puntajeMaximo: number;
  porcentajeTotal: number;
  logroLevel: string;  // Cambiar de 'excelente' | 'bueno' | 'insuficiente' a string
  logroColor: 'success' | 'warning' | 'danger' | 'primary';
}) {
  // Convertir porcentajeTotal a número de forma segura
  const porcentajeSeguro = (() => {
    // Si ya es un número válido
    if (typeof porcentajeTotal === 'number' && !isNaN(porcentajeTotal)) {
      return porcentajeTotal;
    }

    // Si es string, intentar convertir
    if (typeof porcentajeTotal === 'string') {
      const converted = parseFloat(porcentajeTotal);
      return !isNaN(converted) ? converted : 0;
    }

    // Valor por defecto
    return 0;
  })();

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Resultado Final</h2>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">
              {puntajeTotal} / {puntajeMaximo}
            </div>
            <div className="text-sm text-default-600">Puntaje Total</div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-2">
              {porcentajeSeguro.toFixed(1)}%
            </div>
            <div className="text-sm text-default-600">Porcentaje</div>
            <Progress
              value={porcentajeSeguro}
              color={logroColor}
              className="mt-2"
              size="sm"
            />
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Chip
                color={logroColor}
                variant="flat"
                startContent={EVALUATION_UTILS.getScoreLevelIcon(logroLevel)}
                size="lg"
              >
                {logroLevel}
              </Chip>
            </div>
            <div className="text-sm text-default-600">Nivel de Logro</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function AreasProgressOverview({ areas, selectedAreaIndex, onAreaSelect }: {
  areas: AreaDetalle[];
  selectedAreaIndex: number;
  onAreaSelect: (index: number) => void;
}) {
  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <h2 className="text-xl font-semibold">Resumen por Áreas</h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {areas.map((area, index) => (
            <Card
              key={area.id}
              isPressable
              isHoverable
              className={`cursor-pointer transition-all duration-200 ${index === selectedAreaIndex
                ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10'
                : 'hover:bg-default-50 dark:hover:bg-default-900/20'
                }`}
              onPress={() => onAreaSelect(index)}
            >
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">{index + 1}</span>
                  </div>
                  <h3 className="font-medium text-sm text-foreground truncate flex-1">
                    {area.nombre}
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-default-600">Puntaje</span>
                    <span className="font-medium">{area.obtenido}/{area.maximo}</span>
                  </div>

                  <Progress
                    value={area.porcentaje}
                    color={EVALUATION_UTILS.getScoreColor(area.porcentaje)}
                    size="sm"
                    className="w-full"
                  />

                  <div className="text-center">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={EVALUATION_UTILS.getScoreColor(area.porcentaje)}
                    >
                      {area.porcentaje.toFixed(1)}%
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// Nuevo componente simplificado SIN botones de navegación
function SimpleAreaCard({ area, areaIndex, totalAreas }: {
  area: AreaDetalle;
  areaIndex: number;
  totalAreas: number;
}) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{areaIndex + 1}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{area.nombre}</h2>
            <p className="text-sm text-default-600">Área {areaIndex + 1} de {totalAreas}</p>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <AreaView area={area} />
      </CardBody>
    </Card>
  );
}

function AreaView({ area }: { area: AreaDetalle }) {
  return (
    <div className="space-y-6">
      {/* Resumen del área */}
      <Card className="bg-default-50 dark:bg-default-900/20">
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {area.obtenido} / {area.maximo}
              </div>
              <div className="text-sm text-default-600">Puntaje del Área</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {area.porcentaje.toFixed(1)}%
              </div>
              <div className="text-sm text-default-600">Porcentaje</div>
            </div>
            <div>
              <Progress
                value={area.porcentaje}
                color={EVALUATION_UTILS.getScoreColor(area.porcentaje)}
                size="lg"
                className="mt-2"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Competencias e Indicadores */}
      <div className="space-y-4">
        {area.competencias.map((competencia, compIndex) => (
          <CompetenciaCard key={competencia.id} competencia={competencia} index={compIndex} />
        ))}
      </div>
    </div>
  );
}

function CompetenciaCard({ competencia, index }: {
  competencia: CompetenciaDetalle;
  index: number;
}) {
  return (
    <Card className="border border-divider">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{index + 1}</span>
          </div>
          <h3 className="font-semibold text-foreground">{competencia.nombre}</h3>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-3">
          {/* Header para desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-4 text-sm font-medium text-default-600 border-b border-divider pb-2">
            <div className="col-span-8">Indicador</div>
            <div className="col-span-2 text-center">Puntaje</div>
            <div className="col-span-2 text-center">Máximo</div>
          </div>

          {/* Indicadores */}
          {competencia.indicadores.map((indicador) => (
            <IndicadorRow key={indicador.id} indicador={indicador} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function IndicadorRow({ indicador }: { indicador: IndicadorDetalle }) {
  // ✅ Calculate percentage dynamically
  const porcentaje = indicador.puntaje_maximo > 0 ? (indicador.puntaje / indicador.puntaje_maximo) * 100 : 0;

  const color = EVALUATION_UTILS.getScoreColor(porcentaje);

  return (
    <>
      {/* Vista móvil */}
      <div className="lg:hidden p-4 rounded-lg border border-divider bg-background/50 space-y-3">
        <div className="flex items-start gap-3">
          <Popover placement="top" showArrow>
            <PopoverTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="flex-shrink-0 mt-0.5"
              >
                <InformationCircleIcon className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-w-[320px] p-4">
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {indicador.nombre}
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-sm leading-snug">
              {indicador.nombre}
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-xs text-default-500 mb-1">Puntaje</p>
            <Chip size="sm" variant="flat" color={color}>
              {indicador.puntaje}
            </Chip>
          </div>
          <div className="text-center">
            <p className="text-xs text-default-500 mb-1">Máximo</p>
            <Chip size="sm" variant="flat" color="default">
              {indicador.puntaje_maximo}
            </Chip>
          </div>
        </div>
      </div>

      {/* Vista desktop */}
      <div className="hidden lg:grid grid-cols-12 gap-4 items-center p-4 rounded-lg hover:bg-default-50 dark:hover:bg-default-900/20 transition-colors">
        <div className="col-span-8 flex items-center gap-3">
          <Popover placement="right" showArrow>
            <PopoverTrigger>
              <span className="font-medium cursor-help text-foreground hover:text-primary transition-colors line-clamp-2">
                {indicador.nombre}
              </span>
            </PopoverTrigger>
            <PopoverContent className="max-w-[480px] p-4">
              <div className="text-sm text-foreground whitespace-pre-wrap">
                {indicador.nombre}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="col-span-2 text-center">
          <Chip variant="flat" color={color} size="sm">
            {indicador.puntaje}
          </Chip>
        </div>

        <div className="col-span-2 text-center">
          <Chip variant="flat" color="default" size="sm">
            {indicador.puntaje_maximo}
          </Chip>
        </div>
      </div>
    </>
  );
}

// Agregar el componente CommentsSection al final del archivo
const CommentsSection = ({ destacar, mejorar, retroalimentacion }: { destacar?: string | null; mejorar?: string | null; retroalimentacion?: string | null }) => {
  // Helper function to check if text has meaningful content
  const hasContent = (text?: string | null): boolean => {
    return text !== null && text !== undefined && text.trim() !== '';
  };

  const showDestacar = hasContent(destacar);
  const showMejorar = hasContent(mejorar);
  const showRetroalimentacion = hasContent(retroalimentacion);

  // If none of the sections have content, don't render anything
  if (!showDestacar && !showMejorar && !showRetroalimentacion) {
    return null;
  }

  return (
    <>
      {/* Only show the grid if at least one of destacar or mejorar has content */}
      {(showDestacar || showMejorar) && (
        <div className={`grid gap-6 mb-6 ${showDestacar && showMejorar ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
          {/* Fortalezas Destacadas - Only show if destacar has content */}
          {showDestacar && (
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                    <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-medium">Fortalezas Destacadas</h3>
                </div>
              </CardHeader>
              <CardBody>
                <KeyBlock title="" text={destacar} />
              </CardBody>
            </Card>
          )}

          {/* Oportunidades de Mejora - Only show if mejorar has content */}
          {showMejorar && (
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                    <svg className="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="font-medium">Oportunidades de Mejora</h3>
                </div>
              </CardHeader>
              <CardBody>
                <KeyBlock title="" text={mejorar} />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Retroalimentación - Only show if retroalimentacion has content */}
      {showRetroalimentacion && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <svg className="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-medium">Retroalimentación</h3>
            </div>
          </CardHeader>
          <CardBody>
            <KeyBlock title="" text={retroalimentacion} />
          </CardBody>
        </Card>
      )}
    </>
  );
};
