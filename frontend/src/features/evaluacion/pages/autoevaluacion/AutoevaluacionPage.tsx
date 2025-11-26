import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";

import axios from "@/services/google/axiosInstance";

const AutoevaluacionFormulario = lazy(() =>
  import("@/features/evaluacion/components").then((module) => ({
    default: module.AutoevaluacionFormulario,
  })),
);

// Tipado mínimo necesario
interface Autoevaluacion {
  id: number;
  completado: boolean;
}

export default function AutoevaluacionPage() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { state, search } = useLocation();
  const selectedId = useMemo(() => {
    const fromState = state?.id;
    const params = new URLSearchParams(search);
    const fromQuery = params.get("id");
    const raw = fromState ?? fromQuery;
    const num = raw != null ? Number(String(raw).split("/")[0]) : undefined;

    return Number.isFinite(num as number) ? (num as number) : undefined;
  }, [state, search]);

  useEffect(() => {
    const cargarAutoevaluacion = async () => {
      try {
        const cameFromInicio = state?.from === "/autoevaluacion/inicio";
        const hasId = Boolean(selectedId);

        // Si ya viene un ID desde la selección o query, respetarlo
        if (hasId) {
          setLoading(false);

          return;
        }

        // Si venimos explícitamente desde el listado y no hay id, NO hacer fallback
        if (cameFromInicio) {
          addToast({
            title: "Selecciona una autoevaluación",
            description: "No se encontró el período seleccionado.",
            color: "warning",
            variant: "solid",
          });
          navigate("/autoevaluacion/inicio", { replace: true });

          return;
        }

        // Fallback solo para accesos directos sin state ni query
        const response = await axios.get<Autoevaluacion[]>(
          "/evaluacion/api/autoevaluaciones/",
        );
        const evaluacionPendiente = response.data.find((e) => !e.completado);

        if (evaluacionPendiente) {
          navigate("/autoevaluacion/inicio/formulario", {
            state: { id: evaluacionPendiente.id },
            replace: true,
          });
        } else {
          addToast({
            title: "No tienes autoevaluaciones pendientes",
            description: "No tienes autoevaluaciones pendientes.",
            color: "warning",
            variant: "solid",
          });
          navigate("/autoevaluacion?sinEvaluacion=true", { replace: true });
        }
      } catch (err) {
        console.error(err);
        addToast({
          title: "Error al cargar la autoevaluación",
          description: "Ocurrió un error al intentar cargar la autoevaluación.",
          color: "danger",
          variant: "solid",
        });
      } finally {
        setLoading(false);
      }
    };

    cargarAutoevaluacion();
  }, [navigate, selectedId]);

  if (loading) {
    return (
      <section className="flex justify-center py-20">
        <Spinner size="lg" />
      </section>
    );
  }

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-10">
        <Suspense fallback={<Spinner size="lg" />}>
          <AutoevaluacionFormulario />
        </Suspense>
      </section>
    </>
  );
}
