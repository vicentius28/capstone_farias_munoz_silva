import React, { Suspense, useEffect } from "react";
import { Spinner } from "@heroui/spinner";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ChevronLeftIcon } from "lucide-react";

import { DefaultLayoutContext } from "@/shared";

// Lazy load de la tabla de usuarios
const UsersTable = React.lazy(
  () => import("@/features/usuario/components/UsersTable/Table"),
);

export default function UsersPage() {
  const navigate = useNavigate();
  const { setActionButton } = useOutletContext<DefaultLayoutContext>();

  useEffect(() => {
    setActionButton({
      label: "Volver",
      to: "/",
      color: "primary",
      startContent: <ChevronLeftIcon className="w-4 h-4" />,
    });

    return () => setActionButton(null);
  }, [setActionButton]);

  return (
    <>
      <section className="flex flex-col items-center justify-center gap-3 py-5 md:py-1">
        <div className="inline-block text-center justify-center">
          <Suspense
            fallback={<Spinner label="Cargando tabla de usuarios..." />}
          >
            <UsersTable
              buttonText="VER PERFIL"
              onButtonClick={(userId: number) => {
                navigate(`/ficha/usuario`, { state: { userId } });
              }}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
}
