// layouts/DefaultLayout.tsx
import { Suspense, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Navbar } from "@/shared/components/layout/navbar";
import { SidebarDrawer } from "@/shared/components/layout/Sidebar";
import BackButton from "@/shared/components/ui/Button/LazyBackButton";

const FallbackLoader = () => (
  <div className="flex justify-center items-center h-24">
    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500" />
  </div>
);

export default function DefaultLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  const showBack = pathname !== "/"; // ⬅️ clave: mostrar en todas menos el home

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <Navbar />
      <SidebarDrawer isOpen={isOpen} setOpen={setIsOpen} />

      <main className="container mx-auto flex-grow">
        {showBack && (
          <div className="flex justify-start items-start ml-10">
            <BackButton />
          </div>
        )}

        <Suspense fallback={<FallbackLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
