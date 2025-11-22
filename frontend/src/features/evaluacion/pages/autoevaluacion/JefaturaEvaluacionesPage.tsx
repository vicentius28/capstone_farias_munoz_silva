import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { addToast } from "@heroui/toast";
import {
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

import "@/features/evaluacion/styles/animations.css";
import { useEvaluacionesJefe } from "@/features/evaluacion/hooks/useEvaluacionesJefe";
import {
  EstadoEvaluacionBadge,
  TimelineEvaluacion,
} from "@/features/evaluacion/components/flow";

import type {
  EvaluacionJefe,
  EstadoEvaluacion,
} from "@/features/evaluacion/types/evaluacion";
export default function JefaturaEvaluacionesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"en-proceso" | "finalizadas">("en-proceso");
  const [filtroEstado] = useState<EstadoEvaluacion | "todas">("todas");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Usar el hook que maneja las evaluaciones de jefatura
  const { evaluaciones, loading, error } = useEvaluacionesJefe({
    soloMisEvaluaciones: true,
    debug: true,
  });

  // Función para determinar el estado de una evaluación
  const getEstadoEvaluacion = useCallback(
    (ev: EvaluacionJefe): EstadoEvaluacion => {
      // Lógica de fallback basada en campos booleanos
      if (ev.firmado || ev.firmado_obs) return "finalizado";
      if (ev.retroalimentacion && ev.cerrado_para_firma) return "firmar";
      if (ev.completado) return "retroalimentar";

      return "pendiente";
    },
    [],
  );

  // Función para filtrar por estado - ACTUALIZADA para 4 estados
  const filtrarPorEstado = useCallback(
    (evaluaciones: EvaluacionJefe[], estado: EstadoEvaluacion) => {
      return evaluaciones.filter((ev) => {
        const estadoActual = getEstadoEvaluacion(ev);

        return estadoActual === estado;
      });
    },
    [getEstadoEvaluacion],
  );

  // Filtrar evaluaciones por tab y estado
  const evaluacionesFiltradas = useMemo(() => {
    let filtradas = evaluaciones;

    // Filtrar por tab - incluir finalizadas en finalizadas
    switch (tab) {
      case "en-proceso":
        filtradas = filtradas.filter((ev) => {
          const estado = getEstadoEvaluacion(ev);

          return estado !== "finalizado";
        });
        break;
      case "finalizadas":
        filtradas = filtradas.filter((ev) => {
          const estado = getEstadoEvaluacion(ev);

          return estado === "finalizado";
        });
        break;
    }

    // Filtrar por estado específico
    if (filtroEstado !== "todas") {
      filtradas = filtrarPorEstado(filtradas, filtroEstado);
    }

    return filtradas;
  }, [evaluaciones, tab, filtroEstado, filtrarPorEstado, getEstadoEvaluacion]);

  const years = useMemo(() => {
    const setYears = new Set<string>();

    evaluaciones.forEach((ev) => {
      const s = String(ev?.fecha_evaluacion ?? "");
      const m = s.match(/(\d{4})/);

      if (m) setYears.add(m[1]);
    });

    return Array.from(setYears).sort((a, b) => Number(b) - Number(a));
  }, [evaluaciones]);

  const yearItems = useMemo(
    () => [
      { key: "all", label: "Todos" },
      ...years.map((y) => ({ key: y, label: y })),
    ],
    [years],
  );

  const evaluacionesFiltradasPorAnio = useMemo(() => {
    const base =
      yearFilter === "all"
        ? evaluacionesFiltradas
        : evaluacionesFiltradas.filter((ev) =>
            String(ev?.fecha_evaluacion ?? "").includes(yearFilter),
          );

    return [...base].sort((a, b) =>
      String(b?.fecha_evaluacion ?? "").localeCompare(
        String(a?.fecha_evaluacion ?? ""),
      ),
    );
  }, [evaluacionesFiltradas, yearFilter]);

  const counts = useMemo(
    () => ({
      enProceso: evaluaciones.filter((ev) => {
        const estado = getEstadoEvaluacion(ev);

        return estado !== "finalizado";
      }).length,
      finalizadas: evaluaciones.filter((ev) => {
        const estado = getEstadoEvaluacion(ev);

        return estado === "finalizado";
      }).length,
    }),
    [evaluaciones, getEstadoEvaluacion],
  );

  const openEvaluacion = useCallback(
    (id: number, firmado: boolean) => {
      // Buscar la evaluación en el array para verificar su estado
      const evaluacion = evaluaciones.find((ev) => ev.id === id);

      if (!evaluacion) return;

      const estado = getEstadoEvaluacion(evaluacion);

      // Mostrar mensaje informativo si está en estado pendiente
      if (estado === "pendiente") {
        addToast({
          title: "Evaluación no disponible",
          description:
            "Esta evaluación aún está en proceso. Podrás acceder cuando avance a la siguiente etapa.",
          color: "warning",
          variant: "solid",
        });

        return;
      }

      navigate("/autoevaluacion/jefatura/detalle", { state: { id, firmado } });
    },
    [navigate, evaluaciones, getEstadoEvaluacion],
  );

  // CORREGIDA - usar campos que existen en EvaluacionJefe
  const extractTexto = (ev: EvaluacionJefe) =>
    ev?.retroalimentacion ?? ev?.text_destacar ?? ev?.text_mejorar ?? undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-default-50/30 dark:to-default-900/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 animate-ping">
              <div className="w-full h-full rounded-full bg-primary/10" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">Cargando</p>
            <p className="text-sm text-default-500">
              Obteniendo evaluaciones de jefatura...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm">
              <ClipboardDocumentCheckIcon className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Mis Evaluaciones
          </h1>
          <p className="text-default-600 max-w-2xl mx-auto">
            revisa tus evaluaciones de desempeño
          </p>
        </div>
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6">
          <div className="p-1 bg-default-100/80 dark:bg-default-100/20 backdrop-blur-sm rounded-xl border border-default-200/50">
            <Tabs
              aria-label="Evaluaciones de jefatura"
              classNames={{
                tabList: "gap-1",
                cursor: "bg-background shadow-sm",
                tab: "h-10 px-4 data-[selected=true]:text-foreground",
                tabContent:
                  "group-data-[selected=true]:text-foreground text-default-600",
              }}
              selectedKey={tab}
              onSelectionChange={(key) =>
                setTab(key as "en-proceso" | "finalizadas")
              }
            >
              <Tab
                key="en-proceso"
                title={
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    <span>En Proceso</span>
                    {counts.enProceso > 0 && (
                      <Chip
                        className="text-xs min-w-5 h-5"
                        color="primary"
                        size="sm"
                        variant="flat"
                      >
                        {counts.enProceso}
                      </Chip>
                    )}
                  </div>
                }
              />
              <Tab
                key="finalizadas"
                title={
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Finalizadas</span>
                    {counts.finalizadas > 0 && (
                      <Chip
                        className="text-xs min-w-5 h-5"
                        color="success"
                        size="sm"
                        variant="flat"
                      >
                        {counts.finalizadas}
                      </Chip>
                    )}
                  </div>
                }
              />
            </Tabs>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-default-200/50 shadow-sm dark:bg-default-50/5">
          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="p-4 rounded-full mb-4 bg-danger/10 text-danger">
                <ExclamationTriangleIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Error al cargar evaluaciones
              </h3>
              <p className="text-sm text-default-500 text-center mb-6 max-w-sm">
                {error}
              </p>
            </div>
          )}

          {/* Content */}
          {!error && (
            <div className="p-6">
              {evaluacionesFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="p-4 rounded-full mb-4 bg-default/10 text-default-500">
                    <DocumentTextIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No hay evaluaciones en esta categoría
                  </h3>
                  <p className="text-sm text-default-500 text-center mb-6 max-w-sm">
                    {tab === "en-proceso" &&
                      "No hay evaluaciones en proceso actualmente."}
                    {tab === "finalizadas" &&
                      "No tienes evaluaciones finalizadas aún."}
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    {tab === "en-proceso"
                      ? "Evaluaciones en Proceso"
                      : "Evaluaciones Finalizadas"}
                  </h3>
                  {/* Filtros de estado */}
                  <div className="mb-6">
                    <Card className="border-0 bg-background/60 backdrop-blur-sm shadow-sm">
                      <CardBody className="p-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="text-sm font-medium text-foreground">
                            Estados de evaluación:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "pendiente",
                              "retroalimentar",
                              "firmar",
                              "finalizado",
                            ].map((estado) => (
                              <div
                                key={estado}
                                className="flex items-center gap-2"
                              >
                                <EstadoEvaluacionBadge
                                  estado={estado as EstadoEvaluacion}
                                  size="sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <Select
                        className="w-full md:w-[240px]"
                        classNames={{
                          trigger: "h-11",
                          label: "text-default-600",
                          value: "text-sm",
                        }}
                        items={yearItems}
                        label="Año"
                        labelPlacement="outside-left"
                        selectedKeys={[yearFilter]}
                        size="md"
                        onSelectionChange={(keys) => {
                          const key = Array.from(keys as Set<React.Key>)[0] as
                            | string
                            | undefined;

                          setYearFilter(key ?? "all");
                        }}
                      >
                        {(item) => (
                          <SelectItem key={item.key}>{item.label}</SelectItem>
                        )}
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        color={viewMode === "cards" ? "primary" : "default"}
                        size="sm"
                        variant={viewMode === "cards" ? "solid" : "flat"}
                        onPress={() => setViewMode("cards")}
                      >
                        Tarjetas
                      </Button>
                      <Button
                        color={viewMode === "table" ? "primary" : "default"}
                        size="sm"
                        variant={viewMode === "table" ? "solid" : "flat"}
                        onPress={() => setViewMode("table")}
                      >
                        Tabla
                      </Button>
                    </div>
                  </div>
                  {viewMode === "cards" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch h-full w-full">
                      {evaluacionesFiltradasPorAnio.map((evaluacion, index) => (
                        <div
                          key={evaluacion.id}
                          className="animate-fadeInUp h-full"
                          style={{ animationDelay: `${index * 0.08}s` }}
                        >
                          <TimelineEvaluacion
                            compact={true}
                            evaluacion={evaluacion}
                            extractTexto={extractTexto}
                            showPersonaName={false}
                            onOpen={openEvaluacion}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Table
                      isStriped
                      aria-label="Listado de evaluaciones de jefatura"
                      classNames={{ wrapper: "min-h-[400px]" }}
                      selectedKeys={new Set()}
                      selectionMode="none"
                    >
                      <TableHeader>
                        <TableColumn>Evaluación</TableColumn>
                        <TableColumn>Período</TableColumn>
                        <TableColumn>Estado</TableColumn>
                        <TableColumn>Acción</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {evaluacionesFiltradasPorAnio.map((ev) => (
                          <TableRow key={String(ev.id)}>
                            <TableCell>
                              {ev?.tipo_evaluacion?.n_tipo_evaluacion ??
                                "Evaluación"}
                            </TableCell>
                            <TableCell>{ev?.fecha_evaluacion ?? ""}</TableCell>
                            <TableCell>
                              <Chip
                                color={
                                  getEstadoEvaluacion(ev) === "finalizado"
                                    ? "success"
                                    : getEstadoEvaluacion(ev) === "firmar"
                                      ? "primary"
                                      : getEstadoEvaluacion(ev) ===
                                          "retroalimentar"
                                        ? "warning"
                                        : "default"
                                }
                                size="sm"
                                variant="flat"
                              >
                                {getEstadoEvaluacion(ev)}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <Button
                                color={
                                  getEstadoEvaluacion(ev) === "finalizado"
                                    ? "success"
                                    : "primary"
                                }
                                size="sm"
                                variant="flat"
                                onPress={() =>
                                  openEvaluacion(
                                    ev.id,
                                    !!(ev.firmado || ev.firmado_obs),
                                  )
                                }
                              >
                                {getEstadoEvaluacion(ev) === "finalizado"
                                  ? "Ver"
                                  : "Continuar"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
