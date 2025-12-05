import { Button } from "@heroui/button";
import { useNavigate, useSearchParams } from "react-router-dom"; // Hook para URL params
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Tooltip } from "@heroui/tooltip";
import {
  PlusIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  Square2StackIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

import {
  fetchAsignarAutoevaluacion,
  fetchAsignarEvaluacion,
} from "@/features/evaluacion/services/asignar/evaluacion";
import { AsignacionEvaluacion } from "@/features/evaluacion/types/asignar/evaluacion";

// Lazy load del modal
const ModalDetalleAsignacion = lazy(() =>
  import("@/features/evaluacion/components/Asignar").then((module) => ({
    default: module.ModalDetalleAsignacion,
  })),
);

// --- Sub-componente: Item en Vista Lista ---
const ListItem = ({
  asignacion,
  onClick,
  isEvaluacion,
}: {
  asignacion: AsignacionEvaluacion;
  onClick: () => void;
  isEvaluacion: boolean;
}) => (
  <div
    className="group flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-300 hover:shadow-md transition-all cursor-pointer mb-3"
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div
        className={`p-2 rounded-lg ${
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
        <h4 className="font-semibold text-gray-900 dark:text-white">
          {asignacion.tipo_evaluacion?.n_tipo_evaluacion}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CalendarDaysIcon className="w-3 h-3" />
          <span>{asignacion.fecha_evaluacion}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Chip className="hidden sm:flex" size="sm" variant="flat">
        {isEvaluacion ? "Evaluación" : "Autoevaluación"}
      </Chip>
      <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
    </div>
  </div>
);

// --- Sub-componente: Item en Vista Grid (Card) ---
const GridItem = ({
  asignacion,
  onClick,
  isEvaluacion,
}: {
  asignacion: AsignacionEvaluacion;
  onClick: () => void;
  isEvaluacion: boolean;
}) => (
  <Card
    isPressable
    className="border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 bg-white dark:bg-gray-900 group h-full"
    onPress={onClick}
  >
    <CardBody className="p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between w-full mb-4">
          <div
            className={`p-3 rounded-xl ${
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
          <Chip
            className="text-xs text-gray-500"
            color="default"
            size="sm"
            variant="flat"
          >
            {isEvaluacion ? "Evaluación" : "Autoevaluación"}
          </Chip>
        </div>

        <div className="space-y-1 mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 min-h-[3.5rem]">
            {asignacion.tipo_evaluacion?.n_tipo_evaluacion}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <CalendarDaysIcon className="w-4 h-4" />
            <span>{asignacion.fecha_evaluacion}</span>
          </div>
        </div>
      </div>

      <div>
        <Divider className="my-3 bg-gray-100 dark:bg-gray-800" />
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Configuración
          </span>
          <div className="flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:underline">
            Ver detalle <ChevronRightIcon className="w-3 h-3" />
          </div>
        </div>
      </div>
    </CardBody>
  </Card>
);

export default function AsignarEvaluacionPage() {
  const navigate = useNavigate();
  // 1. Manejo de estado por URL (Persistencia)
  const [searchParams, setSearchParams] = useSearchParams();

  // Leemos el tab de la URL, si no existe, por defecto es 'evaluaciones'
  const tabSeleccionado =
    searchParams.get("tab") === "autoevaluaciones"
      ? "autoevaluaciones"
      : "evaluaciones";

  // Estados locales para UI
  const [tiposEvaluacion, setTiposEvaluacion] = useState<
    AsignacionEvaluacion[]
  >([]);
  const [asignacionSeleccionada, setAsignacionSeleccionada] =
    useState<AsignacionEvaluacion | null>(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros y Vista
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupByPeriod, setGroupByPeriod] = useState(false);

  // Carga de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [autoevals, evals] = await Promise.all([
          fetchAsignarAutoevaluacion(),
          fetchAsignarEvaluacion(),
        ]);

        setTiposEvaluacion([...evals, ...autoevals]);
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
    // Resetear filtros al cambiar de tab para mejor UX
    setSearchQuery("");
    setFilterPeriod("all"); // Importante: Resetear el periodo porque los disponibles cambian
  };

  // 2. Pre-filtrado por TAB (Base para cálculos dinámicos)
  // Esto separa la lógica: Primero obtengo los items del contexto actual
  const itemsDelTab = useMemo(() => {
    return tiposEvaluacion.filter((t) => {
      const esAuto = !!t.tipo_evaluacion?.auto;

      return tabSeleccionado === "autoevaluaciones" ? esAuto : !esAuto;
    });
  }, [tiposEvaluacion, tabSeleccionado]);

  // 3. Periodos Dinámicos (Basados SOLAMENTE en itemsDelTab)
  const periodosDisponibles = useMemo(() => {
    const periods = itemsDelTab.map((t) => t.fecha_evaluacion).filter(Boolean);

    return Array.from(new Set(periods)).sort().reverse(); // Ordenar descendente
  }, [itemsDelTab]);

  // 4. Lógica "Core": Filtrado (Periodo/Búsqueda), Ordenamiento y Agrupación
  const datosProcesados = useMemo(() => {
    // A. Usamos la lista base del tab (ya filtrada por tipo)
    let filtered = [...itemsDelTab];

    // B. Filtrar por Periodo
    if (filterPeriod !== "all") {
      filtered = filtered.filter((t) => t.fecha_evaluacion === filterPeriod);
    }

    // C. Filtrar por Búsqueda (Texto)
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();

      filtered = filtered.filter((t) =>
        t.tipo_evaluacion?.n_tipo_evaluacion?.toLowerCase().includes(lowerQ),
      );
    }

    // D. Ordenar Alfabéticamente SIEMPRE (por nombre de evaluación)
    filtered.sort((a, b) => {
      const nombreA = a.tipo_evaluacion?.n_tipo_evaluacion || "";
      const nombreB = b.tipo_evaluacion?.n_tipo_evaluacion || "";

      return nombreA.localeCompare(nombreB);
    });

    return filtered;
  }, [itemsDelTab, filterPeriod, searchQuery]);

  // Agrupación de datos si el toggle está activo
  const datosAgrupados = useMemo(() => {
    if (!groupByPeriod) return null;

    return datosProcesados.reduce(
      (groups, item) => {
        const period = item.fecha_evaluacion || "Sin periodo";

        if (!groups[period]) groups[period] = [];
        groups[period].push(item);

        return groups;
      },
      {} as Record<string, AsignacionEvaluacion[]>,
    );
  }, [datosProcesados, groupByPeriod]);

  const isEvaluaciones = tabSeleccionado === "evaluaciones";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b1220]">
        <div className="flex flex-col items-center gap-4">
          <Spinner color="primary" size="lg" />
          <p className="text-sm text-gray-500 font-medium">
            Cargando Asignaciones...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1220] pb-10">
      {/* 1. Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 pt-8 pb-8 px-6 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <AdjustmentsHorizontalIcon className="w-8 h-8 text-gray-400" />
              Asignación de Evaluaciones
            </h1>
            <p className="text-gray-500 mt-1">
              Gestiona y asigna las evaluaciones y autoevaluaciones.
            </p>
          </div>
          <Button
            className="font-medium shadow-lg shadow-blue-500/20"
            color="primary"
            size="lg"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={() =>
              navigate(
                `/evaluacion-asignar/crear?auto=${tabSeleccionado === "autoevaluaciones"}`,
              )
            }
          >
            {isEvaluaciones ? "Nueva Evaluación" : "Nueva AutoEvaluación"}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 2. Controles Superiores (Tabs + Filtros) */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-6">
          {/* Tabs */}
          <Tabs
            aria-label="Tipo de evaluación"
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

          {/* Barra de Herramientas (Filtros) */}
          <div className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            {/* Buscador */}
            <Input
              isClearable
              classNames={{
                base: "w-full sm:w-64",
                inputWrapper: "h-10 bg-gray-50 dark:bg-slate-800 border-none",
              }}
              placeholder="Buscar..."
              radius="lg"
              size="sm"
              startContent={
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
              }
              value={searchQuery}
              onValueChange={setSearchQuery}
            />

            <Divider className="h-6 hidden sm:block" orientation="vertical" />

            {/* Filtro Periodo (DINÁMICO) */}
            <Select
              aria-label="Filtrar por periodo"
              className="w-full sm:w-48"
              classNames={{
                trigger: "h-10 bg-gray-50 dark:bg-slate-800 border-none",
              }}
              placeholder="Todos los periodos"
              radius="lg"
              selectedKeys={filterPeriod !== "all" ? [filterPeriod] : []}
              size="sm"
              startContent={
                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
              }
              onSelectionChange={(keys) => {
                const k = String(Array.from(keys)[0] || "");

                setFilterPeriod(k || "all");
              }}
            >
              {periodosDisponibles.map((p) => (
                <SelectItem key={p} textValue={p}>
                  {p}
                </SelectItem>
              ))}
            </Select>

            {/* Toggle Agrupar */}
            <Tooltip content="Agrupar por periodo">
              <div className="flex items-center px-2">
                <Switch
                  color="secondary"
                  isSelected={groupByPeriod}
                  size="sm"
                  onValueChange={setGroupByPeriod}
                />
              </div>
            </Tooltip>

            {/* Toggle Vista Grid/List */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow text-primary" : "text-gray-400 hover:text-gray-600"}`}
                onClick={() => setViewMode("grid")}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow text-primary" : "text-gray-400 hover:text-gray-600"}`}
                onClick={() => setViewMode("list")}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Grid de Contenido */}
        {datosProcesados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50">
            <div className="p-4 rounded-full mb-4 bg-gray-100 dark:bg-gray-800 text-gray-400">
              <Square2StackIcon className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              No se encontraron resultados
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
              Intenta ajustar los filtros o crea una nueva configuración.
            </p>
          </div>
        ) : (
          <>
            {/* VISTA AGRUPADA */}
            {groupByPeriod && datosAgrupados ? (
              <div className="space-y-8">
                {Object.entries(datosAgrupados)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([periodo, items]) => (
                    <div key={periodo}>
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                          {periodo}
                        </h3>
                        <div className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800" />
                        <Chip size="sm" variant="flat">
                          {items.length}
                        </Chip>
                      </div>
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            : "flex flex-col gap-2"
                        }
                      >
                        {items.map((asignacion, index) =>
                          viewMode === "grid" ? (
                            <GridItem
                              key={asignacion.id || index}
                              asignacion={asignacion}
                              isEvaluacion={isEvaluaciones}
                              onClick={() => {
                                setAsignacionSeleccionada(asignacion);
                                setMostrarModalDetalle(true);
                              }}
                            />
                          ) : (
                            <ListItem
                              key={asignacion.id || index}
                              asignacion={asignacion}
                              isEvaluacion={isEvaluaciones}
                              onClick={() => {
                                setAsignacionSeleccionada(asignacion);
                                setMostrarModalDetalle(true);
                              }}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              /* VISTA PLANA (SIN AGRUPAR) */
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "flex flex-col gap-2"
                }
              >
                {datosProcesados.map((asignacion, index) =>
                  viewMode === "grid" ? (
                    <GridItem
                      key={asignacion.id || index}
                      asignacion={asignacion}
                      isEvaluacion={isEvaluaciones}
                      onClick={() => {
                        setAsignacionSeleccionada(asignacion);
                        setMostrarModalDetalle(true);
                      }}
                    />
                  ) : (
                    <ListItem
                      key={asignacion.id || index}
                      asignacion={asignacion}
                      isEvaluacion={isEvaluaciones}
                      onClick={() => {
                        setAsignacionSeleccionada(asignacion);
                        setMostrarModalDetalle(true);
                      }}
                    />
                  ),
                )}
              </div>
            )}
          </>
        )}

        {/* Modal (Lazy Loaded) */}
        <Suspense fallback={null}>
          {mostrarModalDetalle && asignacionSeleccionada && (
            <ModalDetalleAsignacion
              asignacionSeleccionada={asignacionSeleccionada}
              mostrarModalDetalle={mostrarModalDetalle}
              setMostrarModalDetalle={setMostrarModalDetalle}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
