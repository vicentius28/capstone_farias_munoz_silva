// Removed unused imports

import { ChevronLeftIcon } from "lucide-react";
import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import { DefaultLayoutContext } from "@/shared";
import { FormularioTipoEvaluacion } from "@/features/evaluacion/components";

export default function CrearTipoEvaluacionPage() {
  const { setActionButton } = useOutletContext<DefaultLayoutContext>();

  useEffect(() => {
    setActionButton({
      label: "Volver",
      to: "/evaluacion-editar",
      color: "primary",
      startContent: <ChevronLeftIcon className="w-4 h-4" />,
    });

    return () => setActionButton(null);
  }, [setActionButton]);

  return (
    <>
      <section className="min-h-screen py-10 px-4 flex items-center justify-center">
        <div className="w-full max-w-6xl">
          <FormularioTipoEvaluacion />
        </div>
      </section>
    </>
  );
}
