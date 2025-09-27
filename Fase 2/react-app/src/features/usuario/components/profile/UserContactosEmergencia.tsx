"use client";
import { Suspense } from "react";
import { Spinner } from "@heroui/spinner";
import React from "react";
import { useLocation } from "react-router-dom";

const ListaContactosEmergencia = React.lazy(
  () => import("./ListaContactosEmergencia"),
);
const ContactoEmergenciaForm = React.lazy(
  () => import("./ContactoEmergenciaForm"),
);

interface UserContactosEmergenciaProps {
  userId?: number; // ID del usuario cuyos contactos queremos ver
}

const UserContactosEmergencia: React.FC<UserContactosEmergenciaProps> = ({ userId }) => {
  const location = useLocation();
  const isProfilePage = location.pathname === "/perfil";
  return (
    <div className="space-y-6">
      <Suspense fallback={<Spinner label="Cargando contactos..." />}>
        <ListaContactosEmergencia userId={userId} />
      </Suspense>
      {isProfilePage && (
        <Suspense fallback={<Spinner label="Cargando formulario..." />}>
          <ContactoEmergenciaForm />
        </Suspense>
      )}
    </div>
  );
};

export default UserContactosEmergencia;
