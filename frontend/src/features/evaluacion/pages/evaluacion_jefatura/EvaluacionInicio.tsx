import type { DefaultLayoutContext } from "@/shared/components/layout/default";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Progress } from "@heroui/progress";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { addToast } from "@heroui/toast";
import {
  CalendarDaysIcon,
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  UsersIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ChatBubbleBottomCenterTextIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion"; // Opcional: para suavidad, si no usas framer, quita los motion.div

import axios from "@/services/google/axiosInstance";

// --- Tipos ---
type EvalAsignacion = {
  id: number;
  fecha_evaluacion: string;
  personas?: any[];
  tipo_evaluacion?: { id: number; n_tipo_evaluacion?: string };
  total_asignadas?: number;
  total_pendientes?: number;
  total_en_proceso?: number;
  total_cerradas_firma?: number;
  total_firmadas?: number;
  progreso_real?: number;
};

// --- COMPONENTE 1: Timeline de Estados Interactivo (Filtro) ---
const ProcessTimelineFilter = ({
  stats,
  activeFilter,
  onFilterChange,
}: any) => {
  const steps = [
    {
      id: "pendiente",
      label: "Pendientes",
      count: stats.pendientes,
      icon: <ClockIcon className="w-5 h-5" />,
      color: "amber",
      desc: "Sin iniciar",
    },
    {
      id: "proceso",
      label: "En Gestión",
      count: stats.enProceso,
      icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />,
      color: "blue",
      desc: "Retro / Reunión",
    },
    {
      id: "firma",
      label: "Por Firmar",
      count: stats.cerradasFirma,
      icon: <PencilSquareIcon className="w-5 h-5" />,
      color: "purple",
      desc: "Esperando cierre",
    },
    {
      id: "finalizada",
      label: "Finalizadas",
      count: stats.firmadas,
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: "emerald",
      desc: "Completo",
    },
  ];

  return (
    <div className="w-full mb-8">
      {/* Línea conectora de fondo */}
      <div className="relative">
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-zinc-800 -translate-y-1/2 rounded-full z-0" />

        <div className="flex flex-col md:flex-row justify-between gap-4 relative z-10">
          {steps.map((step) => {
            const isActive = activeFilter === step.id;
            const isInactive = activeFilter !== "all" && !isActive;

            return (
              <button
                key={step.id}
                className={`
                    group flex-1 flex flex-col items-center p-4 rounded-2xl transition-all duration-300 outline-none
                    ${
                      isActive
                        ? "bg-white dark:bg-zinc-800 shadow-lg scale-105 ring-2 ring-offset-2 ring-blue-500 z-20"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                    }
                    ${isInactive ? "opacity-50 grayscale hover:grayscale-0 hover:opacity-100" : "opacity-100"}
                  `}
                onClick={() => onFilterChange(isActive ? "all" : step.id)}
              >
                {/* Icono Circular */}
                <div
                  className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm transition-colors duration-300
                      ${
                        isActive
                          ? `bg-${step.color}-500 text-white shadow-${step.color}-200`
                          : `bg-white border-2 border-${step.color}-100 text-${step.color}-500 group-hover:bg-${step.color}-50`
                      }
                    `}
                >
                  {step.icon}
                </div>

                {/* Contadores y Texto */}
                <div className="text-center">
                  <span
                    className={`text-2xl font-bold block leading-none mb-1 ${isActive ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
                  >
                    {step.count}
                  </span>
                  <span
                    className={`text-sm font-semibold ${isActive ? `text-${step.color}-600` : "text-gray-500"}`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Indicador de Selección (Puntito) */}
                {isActive && (
                  <motion.div
                    className={`mt-2 w-1.5 h-1.5 rounded-full bg-${step.color}-500`}
                    layoutId="active-dot"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE 2: Selector de Años (Timeline Horizontal) ---
const YearTimelineSelector = ({ years, selectedYear, onChange }: any) => {
  if (years.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        className={`
            px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap
            ${
              selectedYear === "all"
                ? "bg-gray-900 text-white shadow-md dark:bg-white dark:text-black"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-400"
            }
        `}
        onClick={() => onChange("all")}
      >
        Histórico
      </button>

      <div className="h-6 w-px bg-gray-300 dark:bg-zinc-700 mx-2" />

      {years.map((year: string) => (
        <button
          key={year}
          className={`
            px-4 py-2 rounded-full text-sm font-semibold transition-all relative whitespace-nowrap
            ${
              selectedYear === year
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 pl-8 pr-4"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-300"
            }
          `}
          onClick={() => onChange(year)}
        >
          {selectedYear === year && (
            <motion.span
              animate={{ scale: 1 }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"
              initial={{ scale: 0 }}
            />
          )}
          {year}
        </button>
      ))}
    </div>
  );
};

export default function EvaluacionInicioPage() {
  const [asignaciones, setAsignaciones] = useState<EvalAsignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setActionButton } = useOutletContext<DefaultLayoutContext>();

  // Estados de Filtros
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [estadoFilter, setEstadoFilter] = useState<
    "all" | "pendiente" | "proceso" | "firma" | "finalizada"
  >("all");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Helpers
  const fechaFormateada = useCallback((ym: string) => {
    if (!ym) return "";

    return new Date(`${ym}-01T00:00:00`).toLocaleDateString("es-CL", {
      month: "long",
      year: "numeric",
    });
  }, []);

  const normalizePeriodo = useCallback((s?: string | null) => {
    if (!s) return "";
    const m = String(s).match(/(\d{4})-(\d{2})/);

    return m ? `${m[1]}-${m[2]}` : String(s).slice(0, 7);
  }, []);

  // Items para Filtros
  const years = useMemo(() => {
    const ySet = new Set<string>();

    asignaciones.forEach((a) => {
      const y = a.fecha_evaluacion?.split("-")[0];

      if (y) ySet.add(y);
    });

    return Array.from(ySet).sort().reverse();
  }, [asignaciones]);

  const tipoItems = useMemo(() => {
    const tMap = new Map();

    asignaciones.forEach((a) => {
      if (a.tipo_evaluacion?.id)
        tMap.set(
          String(a.tipo_evaluacion.id),
          a.tipo_evaluacion.n_tipo_evaluacion,
        );
    });

    return [
      { key: "all", label: "Todos los tipos" },
      ...Array.from(tMap.entries()).map(([k, v]) => ({ key: k, label: v })),
    ];
  }, [asignaciones]);

  // KPIs Globales (Siempre visibles, calculados ANTES de filtrar para mostrar el universo completo en el timeline)
  const estadisticasGlobales = useMemo(() => {
    return asignaciones.reduce(
      (acc, item) => ({
        pendientes: acc.pendientes + (item.total_pendientes || 0),
        enProceso: acc.enProceso + (item.total_en_proceso || 0),
        cerradasFirma: acc.cerradasFirma + (item.total_cerradas_firma || 0),
        firmadas: acc.firmadas + (item.total_firmadas || 0),
      }),
      { pendientes: 0, enProceso: 0, cerradasFirma: 0, firmadas: 0 },
    );
  }, [asignaciones]);

  // Lógica de Filtrado Principal
  const asignacionesFiltradas = useMemo(() => {
    return asignaciones
      .filter((item) => {
        // 1. Filtro Año
        if (
          yearFilter !== "all" &&
          !item.fecha_evaluacion.startsWith(yearFilter)
        )
          return false;

        // 2. Filtro Tipo
        if (
          tipoFilter !== "all" &&
          String(item.tipo_evaluacion?.id) !== tipoFilter
        )
          return false;

        // 3. Filtro Estado (Interactivo desde el Timeline)
        if (estadoFilter !== "all") {
          switch (estadoFilter) {
            case "pendiente":
              return (item.total_pendientes || 0) > 0;
            case "proceso":
              return (item.total_en_proceso || 0) > 0;
            case "firma":
              return (item.total_cerradas_firma || 0) > 0;
            case "finalizada":
              return (item.total_firmadas || 0) > 0;
          }
        }

        return true;
      })
      .sort((a, b) => b.fecha_evaluacion.localeCompare(a.fecha_evaluacion));
  }, [asignaciones, yearFilter, tipoFilter, estadoFilter]);

  // Carga de Datos (Lógica corregida de la respuesta anterior)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cardsRes, evalsRes] = await Promise.all([
          axios.get("/evaluacion/api/mostrar-asignacion"),
          axios.get("/evaluacion/api/evaluaciones-jefe"),
        ]);
        const cards = cardsRes.data || [];
        const evals = evalsRes.data || [];
        const grupos: Record<string, any> = {};

        cards.forEach((c: any) => {
          const key = `${c?.tipo_evaluacion?.id}|${normalizePeriodo(c?.fecha_evaluacion)}`;

          grupos[key] = {
            ...c,
            stats: {
              totalReal: 0,
              pendientes: 0,
              enProceso: 0,
              cerradasFirma: 0,
              firmadas: 0,
              acumuladoPuntos: 0,
            },
          };
        });

        evals.forEach((e: any) => {
          const keyId = `${e?.tipo_evaluacion?.id}|${normalizePeriodo(e?.fecha_evaluacion)}`;
          let grupo = grupos[keyId];

          if (!grupo) {
            const matchKey = Object.keys(grupos).find((k) =>
              k.includes(normalizePeriodo(e?.fecha_evaluacion)),
            );

            if (matchKey) grupo = grupos[matchKey];
          }

          if (grupo) {
            let puntos = 0;
            const firmada = !!(
              e?.firmado || e?.estado_firma?.includes("firmado")
            );
            const cerradaFirma = !!e?.cerrado_para_firma;
            const enGestion = !!(
              e?.retroalimentacion ||
              e?.reunion_realizada ||
              e?.completado
            );

            grupo.stats.totalReal += 1;

            if (firmada) {
              grupo.stats.firmadas++;
              puntos = 4;
            } else if (cerradaFirma) {
              grupo.stats.cerradasFirma++;
              puntos = 3;
            } else if (enGestion) {
              grupo.stats.enProceso++;
              puntos = 2;
            } else {
              grupo.stats.pendientes++;
              puntos = 0;
            }
            grupo.stats.acumuladoPuntos += puntos;
          }
        });

        const processed = Object.values(grupos).map((g: any) => {
          const totalDocentes = g.stats.totalReal;
          const totalPosible = totalDocentes * 4;
          const porcentaje =
            totalPosible > 0
              ? (g.stats.acumuladoPuntos / totalPosible) * 100
              : 0;

          return {
            ...g,
            total_asignadas: totalDocentes,
            total_pendientes: g.stats.pendientes,
            total_en_proceso: g.stats.enProceso,
            total_cerradas_firma: g.stats.cerradasFirma,
            total_firmadas: g.stats.firmadas,
            progreso_real: Math.round(porcentaje),
          };
        });

        setAsignaciones(processed);
      } catch (err) {
        addToast({
          title: "Error",
          description: "No se pudieron cargar los datos.",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setActionButton({
      label: "Volver menú",
      to: "/",
      color: "primary",
      startContent: <ChevronLeftIcon className="w-4 h-4" />,
    });

    return () => setActionButton(null);
  }, [setActionButton]);

  const openTabla = (item: EvalAsignacion) => {
    navigate("/evaluacion-jefatura/tabla", { state: { ...item } });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 min-h-screen bg-gray-50/50 dark:bg-black">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Campaña de Evaluación
          </h1>
          <p className="text-gray-500 mt-1">
            Gestiona y evalua a tu equipo de trabajo tiempo real.
          </p>
        </div>
        <Button
          className="bg-indigo-700 text-white shadow-lg hover:scale-105 transition-transform"
          startContent={<UsersIcon className="w-5 h-5" />}
          onPress={() =>
            navigate("/evaluacion-jefatura/autoevaluaciones-equipo")
          }
        >
          Mi Equipo
        </Button>
      </div>

      {/* 2. Timeline Interactivo (Filtro Estado) */}
      {!loading && asignaciones.length > 0 && (
        <ProcessTimelineFilter
          activeFilter={estadoFilter}
          stats={estadisticasGlobales}
          onFilterChange={setEstadoFilter}
        />
      )}

      {/* 3. Toolbar: Año (Timeline) y Tipo (Select) */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm sticky top-4 z-30 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80">
        {/* Filtro de Años Horizontal */}
        <div className="flex-1 w-full lg:w-auto overflow-hidden">
          <YearTimelineSelector
            selectedYear={yearFilter}
            years={years}
            onChange={setYearFilter}
          />
        </div>

        {/* Controles Secundarios (Tipo y Vistas) */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-l border-gray-200 dark:border-zinc-700 pl-4">
          {/* Filtro Tipo (Mantenemos select porque pueden ser muchos tipos) */}
          <div className="relative">
            <Select
              aria-label="Tipo"
              className="w-44"
              placeholder="Tipo Evaluación"
              selectedKeys={[tipoFilter]}
              size="sm"
              startContent={<FunnelIcon className="w-4 h-4 text-gray-400" />}
              variant="flat"
              onSelectionChange={(keys) =>
                setTipoFilter(String(Array.from(keys)[0] || "all"))
              }
            >
              {tipoItems.map((item) => (
                <SelectItem key={item.key} textValue={item.key}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0">
            <Button
              isIconOnly
              className={viewMode === "cards" ? "bg-white shadow-sm" : ""}
              size="sm"
              variant={viewMode === "cards" ? "solid" : "light"}
              onPress={() => setViewMode("cards")}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              className={viewMode === "table" ? "bg-white shadow-sm" : ""}
              size="sm"
              variant={viewMode === "table" ? "solid" : "light"}
              onPress={() => setViewMode("table")}
            >
              <TableCellsIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Grid de Resultados */}
      <div className="min-h-[400px]">
        {/* State: Cargando */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 bg-gray-200 dark:bg-zinc-800 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* State: Vacío */}
        {!loading && asignacionesFiltradas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-300">
            <div className="bg-gray-100 dark:bg-zinc-800 p-6 rounded-full mb-4">
              <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sin resultados
            </h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-6">
              No hay evaluaciones que coincidan con los filtros seleccionados.
            </p>
            <Button
              color="primary"
              startContent={<XMarkIcon className="w-4 h-4" />}
              variant="flat"
              onPress={() => {
                setYearFilter("all");
                setEstadoFilter("all");
                setTipoFilter("all");
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        )}

        {/* State: Datos */}
        {!loading && asignacionesFiltradas.length > 0 && (
          <AnimatePresence mode="popLayout">
            {viewMode === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {asignacionesFiltradas.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CampanaCard
                      fechaFormateada={fechaFormateada}
                      item={item}
                      onClick={() => openTabla(item)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
                <TablaCampanas
                  items={asignacionesFiltradas}
                  onClick={openTabla}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// --- CARD CON LÓGICA DE PROGRESO Y COLORES ---
const CampanaCard = ({ item, fechaFormateada, onClick }: any) => {
  const progreso = item.progreso_real || 0;

  // Agrupamos gestión para visualización compacta
  const gestionTotal =
    (item.total_en_proceso || 0) + (item.total_cerradas_firma || 0);

  const getProgressColor = (p: number) => {
    if (p >= 100) return "success";
    if (p >= 50) return "primary";
    if (p > 0) return "warning";

    return "default";
  };

  return (
    <Card
      isPressable
      className="group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl h-full w-full"
      onPress={onClick}
    >
      <CardBody className="p-0 flex flex-col h-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
              <ClipboardDocumentListIcon className="w-6 h-6" />
            </div>
            <Chip
              className="bg-gray-100 dark:bg-zinc-800 text-gray-600 font-semibold text-xs"
              variant="flat"
            >
              {item.total_asignadas} Docentes
            </Chip>
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
            {item.tipo_evaluacion?.n_tipo_evaluacion ?? "Evaluación"}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarDaysIcon className="w-4 h-4" />
            <span className="capitalize">
              {fechaFormateada(item.fecha_evaluacion)}
            </span>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px w-full bg-gray-50 dark:bg-zinc-800" />

        {/* Grilla Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-50 dark:divide-zinc-800">
          <div className="p-3 text-center">
            <span className="text-amber-500 font-bold text-lg block">
              {item.total_pendientes}
            </span>
            <span className="text-[10px] text-gray-400 uppercase font-bold">
              Pendientes
            </span>
          </div>
          <div className="p-3 text-center">
            <span className="text-blue-500 font-bold text-lg block">
              {gestionTotal}
            </span>
            <span className="text-[10px] text-gray-400 uppercase font-bold">
              Gestión
            </span>
          </div>
          <div className="p-3 text-center">
            <span className="text-emerald-500 font-bold text-lg block">
              {item.total_firmadas}
            </span>
            <span className="text-[10px] text-gray-400 uppercase font-bold">
              Fin
            </span>
          </div>
        </div>

        {/* Footer Progreso */}
        <div className="p-6 pt-4 mt-auto bg-gray-50/30 dark:bg-zinc-800/20">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">
              Avance
            </span>
            <span
              className={`text-sm font-bold ${progreso === 100 ? "text-emerald-600" : "text-gray-900 dark:text-white"}`}
            >
              {progreso}%
            </span>
          </div>
          <Progress
            className="h-2"
            classNames={{ track: "bg-gray-200 dark:bg-zinc-700" }}
            color={getProgressColor(progreso)}
            size="sm"
            value={progreso}
          />
          <div className="mt-4 text-right">
            <span className="text-sm font-medium text-blue-600 group-hover:underline flex items-center justify-end gap-1">
              Gestionar <ArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// --- Tabla Simple (Sin cambios mayores) ---
const TablaCampanas = ({ items, onClick }: any) => (
  <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
    <Table removeWrapper aria-label="Tabla">
      <TableHeader>
        <TableColumn>NOMBRE</TableColumn>
        <TableColumn>FECHA</TableColumn>
        <TableColumn align="center">DOCENTES</TableColumn>
        <TableColumn>ESTADO</TableColumn>
        <TableColumn>AVANCE</TableColumn>
        <TableColumn>ACCIÓN</TableColumn>
      </TableHeader>
      <TableBody>
        {items.map((item: any) => (
          <TableRow
            key={item.id}
            className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer"
            onClick={() => onClick(item)}
          >
            <TableCell className="font-bold">
              {item.tipo_evaluacion?.n_tipo_evaluacion}
            </TableCell>
            <TableCell>{item.fecha_evaluacion}</TableCell>
            <TableCell>
              <Chip size="sm" variant="flat">
                {item.total_asignadas}
              </Chip>
            </TableCell>
            <TableCell>
              {item.progreso_real === 100 ? (
                <Chip color="success" size="sm" variant="dot">
                  Finalizado
                </Chip>
              ) : (
                <Chip color="primary" size="sm" variant="dot">
                  En Curso
                </Chip>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress
                  className="w-20"
                  color="primary"
                  size="sm"
                  value={item.progreso_real}
                />
                <span className="text-xs font-bold">{item.progreso_real}%</span>
              </div>
            </TableCell>
            <TableCell>
              <Button size="sm" variant="light">
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
