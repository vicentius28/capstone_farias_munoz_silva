import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/dropdown";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
// Importamos componente de teclado para el estilo visual
// Opcional para el buscador
import {
  Settings,
  User as UserIcon,
  BarChart3,
  LogOut,
  Menu,
} from "lucide-react";
// Para el punto de notificación

// Imports de tu proyecto
import { useAuthentication } from "@/services/google/auth";
import { ThemeSwitch } from "@/shared/components/ui/theme-switch";
import { buildFileUrl } from "@/utils/urlUtils";
import { useUser } from "@/hooks/useUser";
import { usePermissions } from "@/hooks/usePermissions";
import { SidebarDrawer } from "@/shared/components/layout/Sidebar";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthentication();
  const { user } = useUser();
  const { is_staff } = usePermissions();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Lógica de Scroll (Suavizada)
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY > lastScrollY && currentY > 60) {
        // Umbral reducido
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleLogout = async () => {
    logout();
    navigate("/");
  };

  const handleProfileClick = () => {
    navigate("/perfil", { state: { userId: user?.id } });
  };

  const displayName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    user?.username;
  const displayEmail = user?.email || "";

  return (
    <>
      <HeroUINavbar
        // CAMBIO: Fondo más transparente (backdrop-blur-lg) y borde sutil
        className={`transition-all duration-500 ease-in-out border-b border-gray-200/50 dark:border-white/5 bg-white/70 dark:bg-[#0c0c0e]/70 backdrop-blur-xl ${
          showNavbar
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
        classNames={{
          wrapper: "px-4 sm:px-6 h-16 md:h-20 max-w-7xl mx-auto", // Centrado con el resto del dashboard
        }}
        isBordered={false} // Quitamos borde default para usar el nuestro custom
        maxWidth="full"
        position="sticky"
      >
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <div className="md:hidden mr-1">
            <Button
              isIconOnly
              radius="full"
              variant="light"
              onPress={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-500" />
            </Button>
          </div>

          <NavbarBrand
            className="gap-3 max-w-fit cursor-pointer group"
            onClick={() => navigate("/")}
          >
            {/* Logo con el nuevo gradiente Naranja/Rosa */}
            <div className="bg-gradient-to-br  p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <img alt="Evalink" className="w-10 h-10" src="/CED.ico" />
            </div>

            <div className="hidden sm:flex flex-col">
              <p className="font-bold text-lg leading-none tracking-tight text-gray-800 dark:text-white group-hover:text-orange-600 transition-colors">
                Evalink
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Gestión {new Date().getFullYear()}
              </p>
            </div>
          </NavbarBrand>
        </NavbarContent>

        {/* 3. DERECHA: Acciones */}
        <NavbarContent className="gap-4" justify="end">
          <NavbarItem>
            <ThemeSwitch />
          </NavbarItem>

          {/* Dropdown Usuario Refinado */}
          <Dropdown
            showArrow
            classNames={{
              content:
                "border border-gray-100 dark:border-white/10 shadow-xl rounded-2xl",
            }}
            placement="bottom-end"
          >
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform w-9 h-9 sm:w-10 sm:h-10 ring-2 ring-offset-2 ring-orange-100 dark:ring-orange-900/20"
                color="default" // Usamos el borde custom via ring class
                name={displayName}
                size="sm"
                src={
                  user?.foto_thumbnail
                    ? buildFileUrl(user.foto_thumbnail)
                    : undefined
                }
              />
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Profile Actions"
              className="w-64"
              variant="flat"
            >
              <DropdownSection showDivider>
                <DropdownItem
                  key="profile"
                  className="h-16 gap-2"
                  textValue="Perfil"
                >
                  <p className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Conectado como
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white text-base truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-indigo-400 truncate">
                    {displayEmail}
                  </p>
                </DropdownItem>
              </DropdownSection>

              <DropdownSection showDivider title="Cuenta">
                <DropdownItem
                  key="settings"
                  startContent={<UserIcon className="w-4 h-4 text-gray-500" />}
                  onPress={handleProfileClick}
                >
                  Mi Perfil
                </DropdownItem>
                {/* Puedes agregar más items aquí como "Mis Evaluaciones" */}
              </DropdownSection>

              {is_staff ? (
                <DropdownSection showDivider title="Gestión">
                  <DropdownItem
                    key="admin"
                    startContent={
                      <Settings className="w-4 h-4 text-orange-500" />
                    }
                    onPress={() =>
                      (window.location.href = `${import.meta.env.VITE_API_URL}/admin/`)
                    }
                  >
                    Panel Admin
                  </DropdownItem>
                  <DropdownItem
                    key="analytics"
                    startContent={
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                    }
                    onPress={() =>
                      window.open(
                        "https://meta.eva-link.com",
                        "_blank",
                        "noopener",
                      )
                    }
                  >
                    Analítica (Metabase)
                  </DropdownItem>
                </DropdownSection>
              ) : null}

              <DropdownSection>
                <DropdownItem
                  key="logout"
                  className="text-danger group"
                  color="danger"
                  startContent={
                    <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  }
                  onPress={onOpen}
                >
                  Cerrar Sesión
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        </NavbarContent>

        {/* Modal de Logout (Estilizado) */}
        <Modal
          backdrop="blur"
          classNames={{
            base: "bg-white dark:bg-[#151518] border border-gray-100 dark:border-white/10 shadow-2xl rounded-3xl",
          }}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1 items-center pt-8">
                  <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2">
                    <LogOut className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold">Cerrar Sesión</h3>
                </ModalHeader>
                <ModalBody className="text-center pb-6">
                  <p className="text-gray-500">
                    ¿Estás seguro de que deseas salir? <br />
                    Tendrás que ingresar tus credenciales nuevamente.
                  </p>
                </ModalBody>
                <ModalFooter className="justify-center pb-8">
                  <Button
                    className="font-medium"
                    radius="full"
                    variant="flat"
                    onPress={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="shadow-lg shadow-red-500/20 font-bold"
                    color="danger"
                    radius="full"
                    onPress={() => {
                      onClose();
                      handleLogout();
                    }}
                  >
                    Sí, cerrar sesión
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </HeroUINavbar>

      <SidebarDrawer
        isOpen={isSidebarOpen}
        setOpen={() => setSidebarOpen(!isSidebarOpen)}
      />
    </>
  );
};
