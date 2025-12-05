// layouts/DefaultLayout.tsx
import { Suspense, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";

import { Navbar } from "@/shared/components/layout/navbar";
import { SidebarDrawer } from "@/shared/components/layout/Sidebar";
const FallbackLoader = () => (
  <div className="flex justify-center items-center h-24">
    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500" />
  </div>
);

export type ActionButtonConfig = {
  label: string;
  to: string;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  startContent?: ReactNode;
};

export type DefaultLayoutContext = {
  setActionButton: (cfg: ActionButtonConfig | null) => void;
};

export default function DefaultLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [actionButton, setActionButton] = useState<ActionButtonConfig | null>(
    null,
  );

  const isFullBleed = pathname === "/"; // el dashboard (home) va sin container

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <Navbar />
      <SidebarDrawer isOpen={isOpen} setOpen={setIsOpen} />

      {actionButton?.to ? (
        <div className="fixed top-30 left-6 z-20">
          <Button
            color={actionButton.color ?? "primary"}
            radius="full"
            startContent={actionButton.startContent}
            variant="light"
            onPress={() => navigate(actionButton.to)}
          >
            {actionButton.label}
          </Button>
        </div>
      ) : null}

      <main className="w-full flex-grow">
        {isFullBleed ? (
          <>
            <Suspense fallback={<FallbackLoader />}>
              <Outlet context={{ setActionButton }} />
            </Suspense>
          </>
        ) : (
          <div className="container mx-auto">
            <Suspense fallback={<FallbackLoader />}>
              <Outlet context={{ setActionButton }} />
            </Suspense>
          </div>
        )}
      </main>
    </div>
  );
}
