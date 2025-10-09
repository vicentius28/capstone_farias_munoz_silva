// src/pages/DashboardPage.tsx
import React, { Suspense } from "react";
import { Spinner } from "@heroui/spinner";

const DashboardAccess = React.lazy(
  () => import("@/features/dashboard/components/DashboardAccess"),
);

export default function DashboardPage() {
  return (
    <Suspense fallback={<Spinner label="Cargando panel principal..." />}>
      <DashboardAccess />
    </Suspense>
  );
}
