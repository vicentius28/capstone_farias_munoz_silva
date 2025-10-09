import React, { useEffect, useState, useMemo } from "react";
import { Spinner } from "@heroui/spinner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Badge } from "@heroui/badge";
import {
  UserIcon,
  Medal,
  FileText,
  GraduationCap,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { Select as HSelect, SelectItem } from "@heroui/select";

import { UserEvaluations } from "../UserProfile";
import {
  UserInfoCard,
  UserBienios,
  UserCapacitacion,
} from "../UserProfile";

import { useSession } from "@/hooks/useSession";
import { fetchUserById } from "@/api/user/user";
import { User } from "@/types/types";

type UserProfileProps = {
  hideEmptyTabs?: boolean;
};

// Componente de estadísticas

const UserProfile: React.FC<UserProfileProps> = ({ hideEmptyTabs = false }) => {
  const location = useLocation();
  const userId = location.state?.userId;
  const { user: loggedUser } = useSession();
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset() + 180;
    const localDate = new Date(date.getTime() + offset * 60 * 1000);
    return format(localDate, "dd MMMM yyyy", { locale: es });
  };

  const stats = useMemo(() => ({
    academic: (user?.titulos?.length ?? 0) + (user?.magisters?.length ?? 0) + (user?.diplomados?.length ?? 0),
    bienios: user?.bienios?.length ?? 0,
    evaluaciones: user?.evaluacion?.length ?? 0,
    capacitacion: user?.capacitacion?.length ?? 0,
  }), [user]);

  // Cargar usuario
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) {
        setError("ID de usuario no proporcionado");
        setLoading(false);
        return;
      }

      try {
        const userData = await fetchUserById(userId);
        if (userData) {
          setUser(userData);
        } else {
          setError("No se pudo cargar el perfil del usuario");
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
        setError("Error al cargar el perfil del usuario");
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

  // Configuración de tabs simplificada
  const tabs = useMemo(() => {
    return [
      {
        key: "info",
        title: "Personal",
        icon: <UserIcon className="w-4 h-4" />,
        count: null,
        color: "primary" as const,
        content: <UserInfoCard formatDate={formatDate} image={user?.foto} user={user} userId={userId} />,
        show: true,
      },
      {
        key: "bienios",
        title: "Carrera",
        icon: <Medal className="w-4 h-4" />,
        count: stats.bienios,
        color: "warning" as const,
        content: <UserBienios bienios={user?.bienios || []} />,
        show: !hideEmptyTabs || stats.bienios > 0,
      },
      {
        key: "evaluaciones",
        title: "Evaluaciones",
        icon: <FileText className="w-4 h-4" />,
        count: stats.evaluaciones,
        color: "secondary" as const,
        content: <UserEvaluations evaluaciones={user?.evaluacion || []} />,
        show: (!hideEmptyTabs || stats.evaluaciones > 0) && [15, 11, 7].includes(loggedUser?.group || 0),
      },
      {
        key: "capacitacion",
        title: "Capacitaciones",
        icon: <GraduationCap className="w-4 h-4" />,
        count: stats.capacitacion,
        color: "danger" as const,
        content: <UserCapacitacion capacitacion={user?.capacitacion || []} />,
        show: !hideEmptyTabs || stats.capacitacion > 0,
      },
    ].filter(tab => tab.show);
  }, [user, stats, hideEmptyTabs, loggedUser?.group, formatDate]);
  const [selectedKey, setSelectedKey] = useState<string>(tabs[0]?.key || "info");

  // helpers: mapear clases por color (pill + estilos al estar seleccionado)

  const pillClass = (color: string) =>
    color === "primary" ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400" :
      color === "success" ? "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400" :
        color === "warning" ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400" :
          color === "secondary" ? "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400" :
            color === "danger" ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400" :
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";


  // función para renderizar el título con icono + texto + badge


  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 lg:p-8 shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-full">
              <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Cargando perfil
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Obteniendo información del usuario...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 lg:p-8 shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
          <div className="text-center">
            <div className="p-4 bg-red-50 dark:bg-red-950/50 rounded-full w-fit mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Error al cargar el perfil
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error || "Usuario no encontrado"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Contenido principal */}
        <div className="px-4 sm:px-6 py-6 lg:py-8">
          <div className="mb-6">
            {/* Select para <1024px */}
            <div className="block lg:hidden mb-4">
              <HSelect
                label="Sección"
                aria-label="Seleccionar sección"
                variant="bordered"
                selectedKeys={[selectedKey]}
                disallowEmptySelection
                onSelectionChange={(keys) => {
                  const key = String(Array.from(keys)[0]);
                  setSelectedKey(key);
                }}
                renderValue={(items) => {
                  // trigger con icono + color + badge
                  const key = (items?.[0]?.key as string) || selectedKey;
                  const t = tabs.find(x => x.key === key);
                  if (!t) return null;
                  return (
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${pillClass(t.color)}`}>{t.icon}</div>
                      <span className="font-medium">{t.title}</span>
                      {t.count !== null && (
                        <Badge color={t.color} size="sm" variant="flat">
                          {t.count}
                        </Badge>
                      )}
                    </div>
                  );
                }}
              >
                {tabs.map((t) => (
                  <SelectItem
                    key={t.key}
                    textValue={t.title} // a11y cuando hay contenido no plano
                    startContent={<div className={`p-1.5 rounded-lg ${pillClass(t.color)}`}>{t.icon}</div>}
                    endContent={
                      t.count !== null ? (
                        <Badge color={t.color} size="sm" variant="flat">
                          {t.count}
                        </Badge>
                      ) : null
                    }
                  >
                    {t.title}
                  </SelectItem>
                ))}
              </HSelect>
            </div>

            {/* Tabs normales para ≥1024px */}
            <div className="hidden lg:block">
              <Tabs
                aria-label="Perfil de usuario"
                variant="light"
                selectedKey={selectedKey}
                onSelectionChange={(key) => setSelectedKey(String(key))}
                classNames={{
                  base: "w-full",
                  tabList:
                    "w-full bg-gray-50 dark:bg-gray-950/50 border-b border-gray-200 dark:border-gray-800 gap-2 px-2 py-2",
                  panel: "w-full p-0",
                  tab: "data-[hover]:bg-gray-100 dark:data-[hover]:bg-gray-800 px-4 py-3",
                }}
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.key}
                    title={
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${tab.color === "primary" ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                              : tab.color === "warning" ? "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                                : tab.color === "secondary" ? "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                                  : tab.color === "danger" ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            }`}
                        >
                          {tab.icon}
                        </div>
                        <span className="font-medium text-sm">{tab.title}</span>
                        {tab.count !== null && (
                          <Badge color={tab.color} size="sm" variant="flat">
                            {tab.count}
                          </Badge>
                        )}
                      </div>
                    }
                  >
                    <Card className="mt-0">
                      <CardBody className="p-4 sm:p-6">{tab.content}</CardBody>
                    </Card>
                  </Tab>
                ))}
              </Tabs>
            </div>

            {/* Panel de contenido para <1024px (usa el mismo selectedKey) */}
            <div className="block lg:hidden">
              <Card className="mt-0">
                <CardBody className="p-4">
                  {tabs.find((t) => t.key === selectedKey)?.content}
                </CardBody>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;