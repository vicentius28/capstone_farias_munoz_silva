import { Button } from "@heroui/button";
import { useNavigate, useSearchParams } from "react-router-dom"; // Hook para URL params
import { useState, useEffect, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import {
  PlusIcon,
  DocumentTextIcon,
  UserIcon,
  PencilSquareIcon,
  SwatchIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";

import { fetchEvaluacion } from "@/features/evaluacion/services/plantilla/evaluacion";
import { TipoEvaluacion } from "@/features/evaluacion/types/evaluacion";

// --- Sub-componente: Item en Vista Lista ---
const TemplateListItem = ({
  tipo,
  onClick,
  isEvaluacion,
}: {
  tipo: TipoEvaluacion;
  onClick: () => void;
  isEvaluacion: boolean;
}) => (
  <div
    className="group flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-300 hover:shadow-md transition-all cursor-pointer mb-3"
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div
        className={`p-2 rounded-lg transition-colors ${
          isEvaluacion
            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
            : "bg-purple-50 text-purple-600 dark:bg-purple-900/20"
        }`}
      >
        {isEvaluacion ? (
          <DocumentTextIcon className="w-5 h-5" />
        ) : (
          <UserIcon className="w-5 h-5" />
        )}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
          {tipo.n_tipo_evaluacion}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <Chip
            className={`h-5 text-[10px] ${
              isEvaluacion
                ? "bg-blue-50 text-blue-700"
                : "bg-purple-50 text-purple-700"
            }`}
            size="sm"
            variant="flat"
          >
            {isEvaluacion ? "Plantilla Evaluación" : "Plantilla AutoEvaluación"}
          </Chip>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3 text-gray-400 group-hover:text-primary-500">
      <span className="text-xs font-medium hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
        Editar
      </span>
      <PencilSquareIcon className="w-5 h-5" />
    </div>
  </div>
);

// --- Sub-componente: Item en Vista Grid (Card) ---
const TemplateGridItem = ({
  tipo,
  onClick,
  isEvaluacion,
}: {
  tipo: TipoEvaluacion;
  onClick: () => void;
  isEvaluacion: boolean;
}) => (
  <Card
    isPressable
    className="group border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 bg-white dark:bg-gray-900 h-full"
    onPress={onClick}
  >
    <CardBody className="p-5 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-xl transition-colors ${
            isEvaluacion
              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
              : "bg-purple-50 text-purple-600 dark:bg-purple-900/20"
          }`}
        >
          {isEvaluacion ? (
            <DocumentTextIcon className="w-6 h-6" />
          ) : (
            <UserIcon className="w-6 h-6" />
          )}
        </div>
        {/* Icono de edición que aparece al hacer hover */}
        <div className="text-gray-300 group-hover:text-primary-600 transition-colors">
          <PencilSquareIcon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary-700 transition-colors min-h-[3rem]">
          {tipo.n_tipo_evaluacion}
        </h3>
        <div className="flex items-center gap-2">
          <Chip
            className={`h-6 px-2 text-xs font-medium ${
              isEvaluacion
                ? "bg-blue-50 text-blue-700"
                : "bg-purple-50 text-purple-700"
            }`}
            size="sm"
            variant="flat"
          >
            {isEvaluacion ? "Plantilla Evaluación" : "Plantilla AutoEvaluación"}
          </Chip>
        </div>
      </div>

      <Divider className="my-4 bg-gray-100 dark:bg-gray-800" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Acción
        </span>
        <div className="flex items-center gap-1 text-sm font-semibold text-gray-600 group-hover:text-primary-600 transition-colors">
          Editar Contenido <ChevronRightIcon className="w-3 h-3 stroke-[3px]" />
        </div>
      </div>
    </CardBody>
  </Card>
);

export default function EditarEvaluacionPage() {
  const navigate = useNavigate();
  // 1. Manejo de estado por URL (Persistencia)
  const [searchParams, setSearchParams] = useSearchParams();
  const tabSeleccionado =
    searchParams.get("tab") === "autoevaluaciones"
      ? "autoevaluaciones"
      : "evaluaciones";

  // Estados locales
  const [tiposEvaluacion, setTiposEvaluacion] = useState<TipoEvaluacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Vistas
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Carga de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tiposEvaluacionResponse = await fetchEvaluacion();

        setTiposEvaluacion(
          Array.isArray(tiposEvaluacionResponse) ? tiposEvaluacionResponse : [],
        );
      } catch (error) {
        console.error("Error al cargar tipos de evaluación:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handler para cambiar Tab y actualizar URL
  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
    setSearchQuery(""); // Limpiar búsqueda al cambiar contexto
  };

  // 2. Lógica Core: Filtrado y Ordenamiento
  const datosProcesados = useMemo(() => {
    // A. Filtrar por Tab (Evaluación vs Auto)
    let filtered = tiposEvaluacion.filter((t) => {
      const esAuto = !!t.auto;

      return tabSeleccionado === "autoevaluaciones" ? esAuto : !esAuto;
    });

    // B. Filtrar por Búsqueda
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();

      filtered = filtered.filter((t) =>
        t.n_tipo_evaluacion?.toLowerCase().includes(lowerQ),
      );
    }

    // C. Ordenar Alfabéticamente
    filtered.sort((a, b) => {
      const nombreA = a.n_tipo_evaluacion || "";
      const nombreB = b.n_tipo_evaluacion || "";

      return nombreA.localeCompare(nombreB);
    });

    return filtered;
  }, [tiposEvaluacion, tabSeleccionado, searchQuery]);

  const isEvaluaciones = tabSeleccionado === "evaluaciones";

  // --- Componente: Empty State ---
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
      <div
        className={`p-4 rounded-full mb-4 bg-gray-100 dark:bg-gray-800 text-gray-400`}
      >
        <SwatchIcon className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {searchQuery
          ? "No se encontraron plantillas"
          : isEvaluaciones
            ? "Sin Plantillas de Evaluación"
            : "Sin Plantillas de Autoevaluación"}
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
        {searchQuery
          ? "Intenta con otro término de búsqueda."
          : "Define los criterios, preguntas y estructura creando tu primera plantilla."}
      </p>
      {!searchQuery && (
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={() =>
            navigate(
              `/evaluacion-crear?auto=${tabSeleccionado === "autoevaluaciones"}`,
            )
          }
        >
          Crear Nueva Plantilla
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b1220]">
        <div className="flex flex-col items-center gap-4">
          <Spinner color="primary" size="lg" />
          <p className="text-sm text-gray-500 font-medium">
            Cargando plantillas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1220] pb-10">
      {/* 1. Header Principal (Sticky & Clean) */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 pt-8 pb-8 px-6 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <SwatchIcon className="w-8 h-8 text-gray-400" />
              Gestión de Plantillas
            </h1>
            <p className="text-gray-500 mt-1">
              Diseña y configura los instrumentos de evaluación.
            </p>
          </div>
          <Button
            className="font-medium shadow-lg shadow-blue-500/20"
            color="primary"
            size="lg"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={() =>
              navigate(
                `/evaluacion-crear?auto=${tabSeleccionado === "autoevaluaciones"}`,
              )
            }
          >
            {isEvaluaciones ? "Nueva Plantilla" : "Nueva Plantilla"}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 2. Controles Superiores (Tabs + Buscador + Vistas) */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-6">
          {/* Tabs */}
          <Tabs
            aria-label="Tipo de plantilla"
            classNames={{
              cursor: "w-full bg-primary",
              tabContent:
                "group-data-[selected=true]:text-primary font-medium text-gray-500",
            }}
            color="primary"
            selectedKey={tabSeleccionado}
            variant="underlined"
            onSelectionChange={(k) => handleTabChange(k as string)}
          >
            <Tab
              key="evaluaciones"
              title={
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Evaluaciones</span>
                </div>
              }
            />
            <Tab
              key="autoevaluaciones"
              title={
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Autoevaluaciones</span>
                </div>
              }
            />
          </Tabs>

          {/* Barra de Herramientas */}
          <div className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            {/* Buscador */}
            <Input
              isClearable
              classNames={{
                base: "w-full sm:w-64",
                inputWrapper: "h-10 bg-gray-50 dark:bg-slate-800 border-none",
              }}
              placeholder="Buscar plantilla..."
              radius="lg"
              size="sm"
              startContent={
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
              }
              value={searchQuery}
              onValueChange={setSearchQuery}
            />

            <Divider className="h-6 hidden sm:block" orientation="vertical" />

            {/* Toggle Vista Grid/List */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 shadow text-primary"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Vista Cuadrícula"
                onClick={() => setViewMode("grid")}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 shadow text-primary"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Vista Lista"
                onClick={() => setViewMode("list")}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Renderizado de Contenido */}
        {datosProcesados.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-2"
            }
          >
            {datosProcesados.map((tipo, index) =>
              viewMode === "grid" ? (
                <TemplateGridItem
                  key={`${tabSeleccionado}-${tipo.id || index}`}
                  isEvaluacion={isEvaluaciones}
                  tipo={tipo}
                  onClick={() =>
                    navigate("/evaluacion-editar/edicion", {
                      state: { tipoEvaluacion: tipo },
                    })
                  }
                />
              ) : (
                <TemplateListItem
                  key={`${tabSeleccionado}-${tipo.id || index}`}
                  isEvaluacion={isEvaluaciones}
                  tipo={tipo}
                  onClick={() =>
                    navigate("/evaluacion-editar/edicion", {
                      state: { tipoEvaluacion: tipo },
                    })
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
