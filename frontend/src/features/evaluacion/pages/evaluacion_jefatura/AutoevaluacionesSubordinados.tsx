import type { GrupoAutoevaluaciones as GrupoAutoevaluacionesView } from "./components/subordinados/PeriodComponents";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { addToast } from "@heroui/toast";

import Header from "./components/subordinados/Header";
import {
  StatsOverview,
  StatsDetailView,
} from "./components/subordinados/StatsCards";
import { YearSection } from "./components/subordinados/PeriodComponents";
import EnhancedUserCard from "./components/subordinados/UserCard";
import {
  EmptyState,
  EmptyStateDetail,
} from "./components/subordinados/EmptyStates";
import {
  HeaderSkeleton,
  SkeletonGrid,
} from "./components/subordinados/Skeletons";

import { Autoevaluacion } from "@/features/evaluacion/types/evaluacion";
import axios from "@/services/google/axiosInstance";

// Extender la interfaz Autoevaluacion para incluir campos específicos de subordinados
interface AutoevaluacionSubordinado
  extends Omit<Autoevaluacion, "tipo_evaluacion"> {
  persona: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  tipo_evaluacion: {
    id: number;
    n_tipo_evaluacion: string;
  };
  completado: boolean;
  logro_obtenido: number;
  fecha_inicio: string;
  fecha_ultima_modificacion: string;
}

interface GrupoAutoevaluacionesData {
  tipo_evaluacion: {
    id: number;
    n_tipo_evaluacion: string;
  };
  fecha_evaluacion: string;
  total_autoevaluaciones: number;
  completadas: number;
  pendientes: number;
  autoevaluaciones: AutoevaluacionSubordinado[];
}

// Nueva interfaz para organizar por años
interface PeriodoPorAnoData {
  año: number;
  periodos: GrupoAutoevaluacionesData[];
  totalAutoevaluaciones: number;
  completadas: number;
  pendientes: number;
}

export default function AutoevaluacionesSubordinadosPage() {
  const [grupos, setGrupos] = useState<GrupoAutoevaluacionesData[]>([]);
  const [autoevaluaciones, setAutoevaluaciones] = useState<
    AutoevaluacionSubordinado[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parámetros de URL para filtros específicos
  const tipoEvaluacion = searchParams.get("tipo_evaluacion");
  const fechaEvaluacion = searchParams.get("fecha_evaluacion");
  const isDetailView = Boolean(tipoEvaluacion && fechaEvaluacion);

  const nombreCompleto = useCallback(
    (persona: { first_name: string; last_name: string }) =>
      `${persona.first_name} ${persona.last_name}`.trim(),
    [],
  );

  // Organizar grupos por año con estadísticas
  const periodosPorAno = useMemo(() => {
    const anosMap = new Map<number, GrupoAutoevaluacionesData[]>();

    grupos.forEach((grupo) => {
      const año = new Date(`${grupo.fecha_evaluacion}-01`).getFullYear();

      if (!anosMap.has(año)) {
        anosMap.set(año, []);
      }
      anosMap.get(año)!.push(grupo);
    });

    const periodos: PeriodoPorAnoData[] = Array.from(anosMap.entries())
      .map(([año, periodos]) => {
        const totalAutoevaluaciones = periodos.reduce(
          (sum, p) => sum + p.total_autoevaluaciones,
          0,
        );
        const completadas = periodos.reduce((sum, p) => sum + p.completadas, 0);
        const pendientes = periodos.reduce((sum, p) => sum + p.pendientes, 0);

        return {
          año,
          periodos: periodos.sort(
            (a, b) =>
              new Date(`${b.fecha_evaluacion}-01`).getTime() -
              new Date(`${a.fecha_evaluacion}-01`).getTime(),
          ),
          totalAutoevaluaciones,
          completadas,
          pendientes,
        };
      })
      .sort((a, b) => b.año - a.año);

    return periodos;
  }, [grupos]);

  // Estadísticas globales
  const estadisticasGlobales = useMemo(() => {
    if (isDetailView) {
      const completadas = autoevaluaciones.filter((a) => a.completado).length;
      const pendientes = autoevaluaciones.length - completadas;
      const progresoPromedio =
        autoevaluaciones.length > 0
          ? autoevaluaciones.reduce(
              (sum, a) => sum + (a.logro_obtenido || 0),
              0,
            ) / autoevaluaciones.length
          : 0;

      return {
        total: autoevaluaciones.length,
        completadas,
        pendientes,
        progresoPromedio,
      };
    } else {
      const totales = periodosPorAno.reduce(
        (acc, periodo) => {
          acc.total += periodo.totalAutoevaluaciones;
          acc.completadas += periodo.completadas;
          acc.pendientes += periodo.pendientes;

          return acc;
        },
        { total: 0, completadas: 0, pendientes: 0 },
      );

      return {
        ...totales,
        años: periodosPorAno.length,
        periodos: periodosPorAno.reduce((sum, p) => sum + p.periodos.length, 0),
      };
    }
  }, [periodosPorAno, autoevaluaciones, isDetailView]);

  // Create properly typed stats objects for each component
  const statsForDetailView = useMemo(() => {
    if (!isDetailView)
      return { total: 0, completadas: 0, pendientes: 0, progresoPromedio: 0 };

    return {
      total: estadisticasGlobales.total,
      completadas: estadisticasGlobales.completadas,
      pendientes: estadisticasGlobales.pendientes,
      progresoPromedio: (estadisticasGlobales as any).progresoPromedio,
    };
  }, [estadisticasGlobales, isDetailView]);

  const statsForOverview = useMemo(() => {
    if (isDetailView)
      return { total: 0, completadas: 0, pendientes: 0, años: 0, periodos: 0 };

    return {
      total: estadisticasGlobales.total,
      completadas: estadisticasGlobales.completadas,
      pendientes: estadisticasGlobales.pendientes,
      años: (estadisticasGlobales as any).años,
      periodos: (estadisticasGlobales as any).periodos,
    };
  }, [estadisticasGlobales, isDetailView]);

  // Obtener información del período actual para la vista de detalle
  const periodoActual = useMemo(() => {
    if (!isDetailView || !fechaEvaluacion) return null;

    const grupo = grupos.find((g) => g.fecha_evaluacion === fechaEvaluacion);

    if (!grupo) return null;

    const fecha = new Date(`${fechaEvaluacion}-01`);

    return {
      año: fecha.getFullYear(),
      mes: fecha.toLocaleDateString("es-CL", { month: "long" }),
      tipoEvaluacion: grupo.tipo_evaluacion.n_tipo_evaluacion,
      grupo,
    };
  }, [isDetailView, fechaEvaluacion, grupos]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (tipoEvaluacion) params.append("tipo_evaluacion", tipoEvaluacion);
        if (fechaEvaluacion) params.append("fecha_evaluacion", fechaEvaluacion);

        const response = await axios.get(
          `/evaluacion/api/autoevaluaciones-subordinados/?${params.toString()}`,
        );

        if (isDetailView) {
          setAutoevaluaciones(response.data);
        } else {
          setGrupos(response.data);
        }
      } catch (err) {
        console.error(err);
        addToast({
          title: "Error al cargar",
          description:
            "No se pudieron obtener las autoevaluaciones de tus subordinados.",
          color: "danger",
          variant: "solid",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [tipoEvaluacion, fechaEvaluacion, isDetailView]);

  const openGrupo = (grupo: GrupoAutoevaluacionesView) => {
    navigate(
      `/evaluacion-jefatura/autoevaluaciones-subordinados?tipo_evaluacion=${grupo.tipo_evaluacion.id}&fecha_evaluacion=${grupo.fecha_evaluacion}`,
    );
  };

  const verAutoevaluacion = (autoevaluacion: AutoevaluacionSubordinado) => {
    navigate("/evaluacion-jefatura/autoevaluacion-detalle", {
      state: {
        id: autoevaluacion.id,
        autoevaluacion,
        backUrl: `/evaluacion-jefatura/autoevaluaciones-subordinados?tipo_evaluacion=${tipoEvaluacion}&fecha_evaluacion=${fechaEvaluacion}`,
      },
    });
  };

  const volverAResumen = () => {
    navigate("/evaluacion-jefatura/autoevaluaciones-subordinados");
  };

  const volverAInicio = () => {
    navigate("/evaluacion-jefatura");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <HeaderSkeleton />
          <SkeletonGrid />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/20">
      {/* Elementos decorativos de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-400/5 to-cyan-600/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Header
          isDetailView={isDetailView}
          periodoActual={periodoActual}
          onVolverAInicio={volverAInicio}
          onVolverAResumen={volverAResumen}
        />

        {isDetailView ? (
          // Vista de detalle: lista de usuarios con estadísticas
          <div className="space-y-8">
            {/* Estadísticas del período */}
            <StatsDetailView stats={statsForDetailView} />

            <Divider className="my-8" />
            {autoevaluaciones.length === 0 ? (
              <EmptyStateDetail />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                      Equipo de trabajo
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Revisa el progreso de cada miembro de tu equipo
                    </p>
                  </div>
                  <Chip
                    className="font-semibold"
                    color="primary"
                    size="lg"
                    variant="flat"
                  >
                    {autoevaluaciones.length} persona
                    {autoevaluaciones.length !== 1 ? "s" : ""}
                  </Chip>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {autoevaluaciones.map((autoevaluacion) => (
                    <EnhancedUserCard
                      key={autoevaluacion.id}
                      autoevaluacion={autoevaluacion}
                      nombreCompleto={nombreCompleto}
                      onVer={() => verAutoevaluacion(autoevaluacion)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          // Vista de resumen: organizada por años con estadísticas
          <div className="space-y-8">
            {/* Estadísticas globales */}
            <StatsOverview stats={statsForOverview} />

            <Divider className="my-8" />

            {periodosPorAno.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-10">
                {periodosPorAno.map((periodoPorAno) => (
                  <YearSection
                    key={periodoPorAno.año}
                    periodoPorAno={periodoPorAno}
                    onOpenGrupo={openGrupo}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────── Componentes ────────────────── */
