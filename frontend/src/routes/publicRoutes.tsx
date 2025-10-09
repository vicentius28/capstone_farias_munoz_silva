import { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

import RedirectGoogleAuth from "@/features/auth/components/GoogleRedirectHandler";
import Welcome from "@/shared/pages/Welcome";
import { useAuthentication } from "@/services/google/auth";
const ProtectedLogin = () => {
  const { isAuthorized } = useAuthentication();

  return isAuthorized ? <Navigate to="/" /> : <Welcome />;
};

export const publicRoutes: RouteObject[] = [
  {
    path: "/login/api/callback",
    element: <RedirectGoogleAuth />,
  },
  {
    path: "/login",
    element: <ProtectedLogin />,
  },
];
