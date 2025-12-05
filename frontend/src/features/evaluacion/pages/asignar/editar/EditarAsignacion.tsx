import { lazy, Suspense, useEffect } from "react";
import { Spinner } from "@heroui/spinner";
import { ChevronLeftIcon } from "lucide-react";
import { useOutletContext } from "react-router-dom";

import { DefaultLayoutContext } from "@/shared";

// Lazy load del formulario
const FormularioEditarAsignacionEvaluacion = lazy(() =>
  import("@/features/evaluacion/components/Asignar").then((module) => ({
    default: module.FormularioEditarAsignacionEvaluacion,
  })),
);

export default function EditarAsignacionPage() {
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
          <Suspense
            fallback={
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            }
          >
            <FormularioEditarAsignacionEvaluacion />
          </Suspense>
        </div>
      </section>
    </>
  );
}
