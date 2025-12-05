import React, { Suspense, useEffect } from "react";
import { Spinner } from "@heroui/spinner";
import { useOutletContext } from "react-router-dom";
import { ChevronLeftIcon } from "lucide-react";

import { DefaultLayoutContext } from "@/shared";

// Lazy load del componente de perfil
const UserProfile = React.lazy(
  () => import("@/features/usuario/components/profile/UserProfile"),
);

export default function UserProfileView() {
  const { setActionButton } = useOutletContext<DefaultLayoutContext>();

  useEffect(() => {
    setActionButton({
      label: "Volver",
      to: "/ficha",
      color: "primary",
      startContent: <ChevronLeftIcon className="w-4 h-4" />,
    });

    return () => setActionButton(null);
  }, [setActionButton]);

  return (
    <>
      <section className="w-full flex justify-center items-center py-6 px-4">
        <div className="w-full max-w-5xl">
          <Suspense
            fallback={<Spinner label="Cargando perfil del usuario..." />}
          >
            <UserProfile />
          </Suspense>
        </div>
      </section>
    </>
  );
}
