import type {
  Evaluacion,
  EvaluacionJefe,
  EstadoEvaluacion,
} from "@/features/evaluacion/types/evaluacion";

import React, { useEffect, useState, Suspense, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";

import { columns2 } from "@/hooks/columns";
import axios from "@/services/google/axiosInstance";
import { EstadoEvaluacionBadge } from "@/features/evaluacion/components/flow/EstadoEvaluacionBadge";

// Lazy load de la tabla optimizada para grandes volúmenes
const OptimizedTableComponent = React.lazy(() =>
  import("@/shared/components").then((mod) => ({
    default: mod.OptimizedTableComponent,
  })),
);

// Interfaz para los datos formateados
interface EvaluacionFormateada {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  foto_thumbnail?: string;
  ciclo: string;
  cargo: string;
  completado: boolean;
  estado_texto: string;
  estado: EstadoEvaluacion;
  accion?: string;
}

// Configuración de filtros mejorada
const filtrosConfig = {
  pendientes: {
    label: "Pendientes",
    color: "default" as const,
    icon: "⏳",
    description: "Evaluaciones sin completar",
  },
  completadas: {
    label: "Completadas",
    color: "primary" as const,
    icon: "✅",
    description: "Evaluaciones terminadas",
  },
  con_retroalimentacion: {
    label: "Con Retroalimentación",
    color: "success" as const,
    icon: "💬",
    description: "Con feedback completado",
  },
  cerradas_firma: {
    label: "Listas para Aceptar",
    color: "warning" as const,
    icon: "🔒",
    description: "Esperando aceptación",
  },
  firmadas: {
    label: "Firmadas",
    color: "success" as const,
    icon: "📝",
    description: "Proceso finalizado",
  },
};

export default function TableevaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [page, setPage] = useState(1);
  const [searchTerm] = useState("");
  const [asignaciones, setAsignaciones] = useState<EvaluacionJefe[]>([]);
  const [cargandoAsignaciones, setCargandoAsignaciones] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState<string | null>(
    state?.filtro || null,
  );

  const tipo_evaluacion = state?.tipo_evaluacion;
  const fecha_evaluacion = state?.fecha_evaluacion;
  const periodoFormateado = fecha_evaluacion
    ? new Date(fecha_evaluacion + "-01T00:00:00").toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
      })
    : "";

  useEffect(() => {
    const cargarAsignaciones = async () => {
      try {
        setCargandoAsignaciones(true);
        const resp = await axios.get("/evaluacion/api/evaluaciones-jefe");
        const todas = resp.data as EvaluacionJefe[];

        // Filtrar por tipo y fecha de evaluación
        const filtradas = todas
          .filter(
            (a) =>
              a?.tipo_evaluacion?.id === tipo_evaluacion?.id &&
              a?.fecha_evaluacion === fecha_evaluacion,
          )
          .map((a) => ({
            ...a,
            __isPonderada:
              typeof a?.ponderada === "boolean" ? a.ponderada : !!a?.ponderada,
          }));

        setAsignaciones(filtradas);
        console.log("✅ Asignaciones filtradas:", filtradas);
      } catch (err) {
        console.error(err);
        addToast({
          title: "Error al cargar las evaluaciones",
          description: "Ocurrió un error al intentar cargar las asignaciones.",
          color: "danger",
          variant: "solid",
        });
      } finally {
        setCargandoAsignaciones(false);
      }
    };

    cargarAsignaciones();
  }, [tipo_evaluacion?.id, fecha_evaluacion]);

  // Función para determinar el estado de la evaluación
  const determinarEstado = (evaluacion: EvaluacionJefe): EstadoEvaluacion => {
    // Agregar debugging
    console.log("🔍 Determinando estado para evaluación:", {
      id: evaluacion.id,
      estado_firma: evaluacion.estado_firma,
      firmado: evaluacion.firmado,
      firmado_obs: evaluacion.firmado_obs,
      cerrado_para_firma: evaluacion.cerrado_para_firma,
      retroalimentacion: evaluacion.retroalimentacion,
      completado: evaluacion.completado,
    });

    // 1. Si está firmado (con o sin observaciones) → finalizado
    if (evaluacion.firmado || evaluacion.firmado_obs) {
      console.log("✅ Estado: finalizado");

      return "finalizado";
    }

    // 2. Si tiene retroalimentación Y está cerrado para firma → firmar
    if (evaluacion.retroalimentacion && evaluacion.cerrado_para_firma) {
      console.log("✅ Estado: Aceptar");

      return "firmar";
    }

    // 3. Si está completado → retroalimentar
    if (evaluacion.completado) {
      console.log("✅ Estado: retroalimentar");

      return "retroalimentar";
    }

    // 4. Por defecto → pendiente
    console.log("✅ Estado: pendiente");

    return "pendiente";
  };

  // Datos filtrados según el filtro activo
  const asignacionesFiltradas = useMemo(() => {
    if (!filtroActivo) return asignaciones;

    return asignaciones.filter((a) => {
      switch (filtroActivo) {
        case "pendientes":
          return !a.completado;
        case "con_retroalimentacion":
          return a.completado && !a.retroalimentacion;
        case "cerradas_firma":
          return a.cerrado_para_firma && !a.firmado;
        case "firmadas":
          return a.firmado;
        case "pendientes_firma":
          return a.completado && !a.firmado;
        default:
          return true;
      }
    });
  }, [asignaciones, filtroActivo]);

  // Formatear datos para el TableComponent
  const dataFormateada = useMemo(() => {
    return asignacionesFiltradas.map((a): EvaluacionFormateada => {
      const u = (a: Evaluacion) => a?.persona;
      const user = u(a);
      const estado = determinarEstado(a);

      // Determinar el estado_texto y acción basado en el estado simplificado
      let estado_texto = "";
      let accion = undefined;

      switch (estado) {
        case "finalizado":
          estado_texto = "Finalizado";
          accion = "Ver Resumen";
          break;
        case "retroalimentar":
          estado_texto = "Retroalimentar";
          accion = "Retroalimentar";
          break;
        case "firmar":
          estado_texto = "Aceptar";
          accion = "Ver resumen";
          break;

        case "pendiente":
        default:
          estado_texto = "Pendiente";
          accion = "Evaluar";
          break;
      }

      return {
        id: a.id,
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        foto_thumbnail: user?.foto_thumbnail,
        ciclo: user?.ciclo || "",
        cargo: user?.cargo || "",
        completado: !!a?.completado,
        estado_texto,
        estado,
        accion,
      };
    });
  }, [asignacionesFiltradas]);

  // Eliminamos búsqueda superior en favor de filtros por columna en la tabla

  // Calcular estadísticas mejoradas
  const estadisticas = useMemo(() => {
    const total = dataFormateada.length;
    const pendientes = dataFormateada.filter(
      (a) => a.estado === "pendiente",
    ).length;
    const retroPendientes = dataFormateada.filter(
      (a) => a.estado === "retroalimentar",
    ).length;
    const cerradasFirma = dataFormateada.filter(
      (a) => a.estado === "firmar",
    ).length;
    const firmadas = dataFormateada.filter(
      (a) => a.estado === "finalizado",
    ).length;

    const porcentajeCompletado =
      total > 0 ? Math.round(((total - pendientes) / total) * 100) : 0;

    const promedioLogro =
      pendientes === 0 && total > 0
        ? Math.round(
            asignaciones
              .map((a) => a.porcentaje_total ?? 0)
              .reduce((acc, v) => acc + v, 0) / total || 0,
          )
        : null;

    return {
      total,
      pendientes,
      retroPendientes,
      cerradasFirma,
      firmadas,
      porcentajeCompletado,
      promedioLogro,
    };
  }, [dataFormateada, asignaciones]);

  // Función para cambiar filtros
  const cambiarFiltro = (nuevoFiltro: string | null) => {
    setFiltroActivo(nuevoFiltro);
    setPage(1);
  };

  // Mostrar spinner mientras se cargan las asignaciones
  if (cargandoAsignaciones) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-default-50">
        <Card className="w-full max-w-md">
          <CardBody className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="relative">
              <Spinner
                className="w-12 h-12"
                classNames={{
                  circle1: "border-b-primary",
                  circle2: "border-b-primary-300",
                }}
                size="lg"
              />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Cargando evaluaciones
              </h3>
              <p className="text-sm text-default-500">
                Obteniendo estado de las asignaciones...
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Función para manejar el click del botón de acción principal
  const handleActionClick = (userId: number) => {
    const evaluacion = asignacionesFiltradas.find((a) => a.id === userId);

    if (evaluacion) {
      // Determinar la ruta basada en el estado de la evaluación
      if (!evaluacion.completado) {
        // Evaluar - ir a página de evaluación
        navigate(`/evaluacion-jefatura/tabla/formulario`, {
          state: { id: evaluacion.id },
        });
      } else if (evaluacion.completado && !evaluacion.retroalimentacion) {
        // Ver resumen o programar reunión
        navigate(`/evaluacion-jefatura/tabla/retroalimentacion`, {
          state: { id: evaluacion.id },
        });
      } else if (
        evaluacion.retroalimentacion &&
        !evaluacion.cerrado_para_firma
      ) {
        // Ver resumen
        navigate(`/evaluacion-jefatura/tabla/detalle`, {
          state: { id: evaluacion.id },
        });
      } else if (evaluacion.cerrado_para_firma && !evaluacion.firmado) {
        // Firmar
        navigate(`/evaluacion-jefatura/tabla/detalle`, {
          state: { id: evaluacion.id },
        });
      } else {
        // Ver resumen final
        navigate(`/evaluacion-jefatura/tabla/detalle`, {
          state: { id: evaluacion.id },
        });
      }
    }
  };

  // Nueva función para manejar el click del botón "Ver Progreso"
  const handleVerProgreso = (userId: number) => {
    navigate(`/evaluacion-jefatura/tabla/detalle-progreso`, {
      state: { id: userId },
    });
  };

  // Función para obtener el texto del botón según el estado
  const getButtonText = (userId: number): string => {
    const evaluacion = dataFormateada.find((a) => a.id === userId);

    return evaluacion?.accion || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-default-50/50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section Mejorado */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row  lg:items-center lg:justify-between gap-6 ">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {tipo_evaluacion?.n_tipo_evaluacion}
              </h1>
              <p className="text-lg text-default-600 font-medium">
                {periodoFormateado}
              </p>
              {filtroActivo && (
                <div className="flex items-center gap-2">
                  <Chip
                    className="font-semibold"
                    color="primary"
                    size="sm"
                    startContent={
                      <span className="text-xs">
                        {
                          filtrosConfig[
                            filtroActivo as keyof typeof filtrosConfig
                          ]?.icon
                        }
                      </span>
                    }
                    variant="flat"
                  >
                    Filtro:{" "}
                    {
                      filtrosConfig[filtroActivo as keyof typeof filtrosConfig]
                        ?.label
                    }
                  </Chip>
                </div>
              )}
            </div>

            {/* Se eliminó el buscador superior para priorizar filtros por columna en la tabla */}

            {/* Estadísticas Mejoradas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Total */}
              <Card
                isPressable
                className={`min-w-[120px] cursor-pointer transition-all duration-200 hover:scale-105 ${
                  filtroActivo === null
                    ? "bg-default-100 border-default-300 shadow-md"
                    : "bg-default-50 border-default-200"
                }`}
                onPress={() => cambiarFiltro(null)}
              >
                <CardBody className="p-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2 rounded-full bg-default-200 mb-2">
                      <svg
                        className="w-4 h-4 text-default-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path
                          clipRule="evenodd"
                          d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 8a1 1 0 100-2 1 1 0 000 2zm-3-1a1 1 0 11-2 0 1 1 0 012 0zm-3-1a1 1 0 100-2 1 1 0 000 2z"
                          fillRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-default-700">
                      {estadisticas.total}
                    </p>
                    <p className="text-xs text-default-600 font-medium">
                      Total
                    </p>
                  </div>
                </CardBody>
              </Card>
              {/* Promedio de logro (solo si todas firmadas) */}
              {estadisticas.promedioLogro !== null && (
                <Card className="min-w-[120px] bg-success-50 border-success-200">
                  <CardBody className="p-3">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-2 rounded-full bg-success-200 mb-2">
                        <span className="text-sm">🎯</span>
                      </div>
                      <p className="text-xl font-bold text-success-700">
                        {estadisticas.promedioLogro}%
                      </p>
                      <p className="text-xs text-success-600 font-medium">
                        Promedio de logro
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Pendientes */}
              <Card
                isPressable
                className={`min-w-[120px] cursor-pointer transition-all duration-200 hover:scale-105 ${
                  filtroActivo === "pendientes"
                    ? "bg-default-100 border-default-300 shadow-md"
                    : "bg-default-50 border-default-200"
                }`}
                onPress={() => cambiarFiltro("pendientes")}
              >
                <CardBody className="p-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2 rounded-full bg-default-200 mb-2">
                      <span className="text-sm">⏳</span>
                    </div>
                    <p className="text-xl font-bold text-default-700">
                      {estadisticas.pendientes}
                    </p>
                    <p className="text-xs text-default-600 font-medium">
                      Pendientes
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* Retroalimentar */}
              <Card
                isPressable
                className={`min-w-[120px] cursor-pointer transition-all duration-200 hover:scale-105 ${
                  filtroActivo === "con_retroalimentacion"
                    ? "bg-secondary-100 border-secondary-300 shadow-md"
                    : "bg-secondary-50 border-secondary-200"
                }`}
                onPress={() => cambiarFiltro("con_retroalimentacion")}
              >
                <CardBody className="p-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2 rounded-full bg-secondary-200 mb-2">
                      <span className="text-sm">💬</span>
                    </div>
                    <p className="text-xl font-bold text-secondary-700">
                      {estadisticas.retroPendientes}
                    </p>
                    <p className="text-xs text-secondary-600 font-medium">
                      Retroalimentar
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* Reunión Finalizada (cerradas para firma) */}
              <Card
                isPressable
                className={`min-w-[120px] cursor-pointer transition-all duration-200 hover:scale-105 ${
                  filtroActivo === "cerradas_firma"
                    ? "bg-primary-100 border-primary-300 shadow-md"
                    : "bg-primary-50 border-primary-200"
                }`}
                onPress={() => cambiarFiltro("cerradas_firma")}
              >
                <CardBody className="p-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2 rounded-full bg-primary-200 mb-2">
                      <span className="text-sm">📅</span>
                    </div>
                    <p className="text-xl font-bold text-primary-700">
                      {estadisticas.cerradasFirma}
                    </p>
                    <p className="text-xs text-primary-600 font-medium">
                      Aceptar
                    </p>
                  </div>
                </CardBody>
              </Card>
              {/* Firmadas */}
              <Card
                isPressable
                className={`min-w-[120px] cursor-pointer transition-all duration-200 hover:scale-105 ${
                  filtroActivo === "firmadas"
                    ? "bg-success-100 border-success-300 shadow-md"
                    : "bg-success-50 border-success-200"
                }`}
                onPress={() => cambiarFiltro("firmadas")}
              >
                <CardBody className="p-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-2 rounded-full bg-success-200 mb-2">
                      <span className="text-sm">📝</span>
                    </div>
                    <p className="text-xl font-bold text-success-700">
                      {estadisticas.firmadas}
                    </p>
                    <p className="text-xs text-success-600 font-medium">
                      Aceptadas
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Leyenda de Estados */}
          <div className="mt-6">
            <Card className="bg-background/60 backdrop-blur-sm border-default-200">
              <CardBody className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    Estados de evaluación:
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {[
                      "pendiente",
                      "retroalimentar",
                      "firmar",
                      "finalizado",
                    ].map((estado) => (
                      <EstadoEvaluacionBadge
                        key={estado}
                        estado={estado as EstadoEvaluacion}
                        size="sm"
                        variant="flat"
                      />
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-12">
                <Spinner size="lg" />
              </div>
            }
          >
            <OptimizedTableComponent
              buttonText="Acción"
              columns={columns2}
              data={dataFormateada}
              getButtonText={getButtonText}
              loading={cargandoAsignaciones}
              page={page}
              renderCell={(item: EvaluacionFormateada, columnKey: string) => {
                if (columnKey === "estado_texto") {
                  return (
                    <EstadoEvaluacionBadge
                      estado={item.estado}
                      size="sm"
                      variant="flat"
                    />
                  );
                }

                // Renderizar botones personalizados para la columna de acción
                if (columnKey === "accion") {
                  return (
                    <div className="flex gap-2">
                      <Button
                        className="font-medium"
                        color={item.completado ? "success" : "primary"}
                        size="sm"
                        variant={item.completado ? "flat" : "solid"}
                        onPress={() => handleActionClick(item.id)}
                      >
                        {getButtonText(item.id)}
                      </Button>

                      {/* Mostrar botón "Ver Progreso" solo para evaluaciones pendientes */}
                      {!item.completado && (
                        <Button
                          className="font-medium"
                          color="primary"
                          size="sm"
                          variant="ghost"
                          onPress={() => handleVerProgreso(item.id)}
                        >
                          Ver Progreso
                        </Button>
                      )}
                    </div>
                  );
                }

                return undefined; // Usar renderizado por defecto para otras columnas
              }}
              searchTerm={searchTerm}
              setPage={setPage}
              onButtonClick={handleActionClick}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
