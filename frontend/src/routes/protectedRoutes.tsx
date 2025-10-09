// src/routes/protectedRoutes.ts
import { RouteObject } from "react-router-dom";
import { JSX, lazy } from "react";
import { Suspense } from "react";

import DefaultLayout from "@/shared/components/layout/default";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { FullPageSpinner } from "@/shared/components/ui/Spinner/FullPageSpinner";
import { PERMISSIONS } from "@/constants/permissions";

// Wrapper de Suspense
const withSuspense = (
  Component: React.LazyExoticComponent<() => JSX.Element>,
) => (
  <Suspense fallback={<FullPageSpinner />}>
    <Component />
  </Suspense>
);

// Páginas protegidas lazy
const IndexPage = lazy(() => import("@/features/usuario/pages/IndexPage"));
const UsersPage = lazy(() => import("@/features/usuario/pages/UsersPage"));
const DiasTablePage = lazy(
  () => import("@/features/usuario/pages/DiasTablePage"),
);
const ProfilePage = lazy(() => import("@/features/usuario/pages/ProfilePage"));
const UserProfileView = lazy(
  () => import("@/features/usuario/pages/UserProfileView"),
);

export const protectedRoutes: RouteObject[] = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DefaultLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(IndexPage) },

      { path: "perfil", element: withSuspense(ProfilePage) },
      {
        path: "ficha",
        element: (
          <ProtectedRoute permiso={PERMISSIONS.FUNDACION.USUARIOS_FICHA}>
            {withSuspense(UsersPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "usuarios",
        element: (
          <ProtectedRoute permiso={PERMISSIONS.DIRECTIVO.USUARIOS}>
            {withSuspense(DiasTablePage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "ficha/user-profile",
        element: (
          <ProtectedRoute permiso={PERMISSIONS.FUNDACION.USUARIOS_FICHA}>
            {withSuspense(UserProfileView)}
          </ProtectedRoute>
        ),
      },
   
    ],
  },


];
