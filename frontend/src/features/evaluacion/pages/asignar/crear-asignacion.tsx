import { lazy, Suspense, useEffect } from "react";
import { Spinner } from "@heroui/spinner";
import { ChevronLeftIcon } from "lucide-react";
import { useOutletContext } from "react-router-dom";

import { DefaultLayoutContext } from "@/shared";

const FormularioAsignacionEvaluacion = lazy(() =>
  import("@/features/evaluacion/components/Asignar/Crear").then((module) => ({
    default: module.FormularioAsignacionEvaluacion,
  })),
);

export default function CrearAsignacionPage() {
  const { setActionButton } = useOutletContext<DefaultLayoutContext>();

  useEffect(() => {
    setActionButton({
      label: "Volver",
      to: "/evaluacion-asignar",
      color: "primary",
      startContent: <ChevronLeftIcon className="w-4 h-4" />,
    });

    return () => setActionButton(null);
  }, [setActionButton]);

  return (
    <>
      <section className="min-h-screen py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-6xl">
          <Suspense fallback={<Spinner size="lg" />}>
            <FormularioAsignacionEvaluacion />
          </Suspense>
        </div>
      </section>
    </>
  );
}
