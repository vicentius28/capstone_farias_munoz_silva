import React, { useEffect } from "react";
import { Link as HeroLink } from "@heroui/link";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@heroui/skeleton";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { Settings, UserIcon } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { useState } from "react";

import { useAuthentication } from "@/services/google/auth";
import { Logo } from "@/shared/components/Icons/icons";
import { ThemeSwitch } from "@/shared/components/ui/theme-switch";
import { siteConfig } from "@/core/config/site";
import { buildFileUrl } from "@/utils/urlUtils";
import { useUser } from "@/hooks/useUser";
import { SidebarDrawer } from "@/shared/components/layout/Sidebar";
import { sidebarRoutes } from "@/shared/utils/sidebarRoutes";

export const Navbar: React.FC = () => {
  const { isAuthorized, logout } = useAuthentication();
  const { user } = useUser();
  const navigate = useNavigate();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY > lastScrollY && currentY > 80) {
        setShowNavbar(false); // Ocultar si scroll hacia abajo
      } else {
        setShowNavbar(true); // Mostrar si scroll hacia arriba
      }

      setLastScrollY(currentY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isSidebarRoute = sidebarRoutes.includes(location.pathname);

  useEffect(() => {
    if (user) {
      // User data available
    }
  }, [user]);

  const handleLogout = async () => {
    logout();
    navigate("/");
  };

  const handleProfileClick = () => {
    navigate("/perfil", { state: { userId: user?.id } });
  };

  return (
    <HeroUINavbar
      className={`top-0 z-50 transition-transform duration-300 bg-default-50 shadow-sm ${showNavbar ? "translate-y-0" : "-translate-y-full"
        }`}
      maxWidth="xl"
      position="sticky"
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          {isSidebarRoute && (
            <>
              <Button
                className="bg-transparent border-none cursor-pointer"
                onPress={() => setSidebarOpen(true)}
              >
                <Bars3Icon height={24} width={24} />
              </Button>
              <SidebarDrawer
                isOpen={isSidebarOpen}
                setOpen={() => setSidebarOpen(!isSidebarOpen)}
              />
            </>
          )}

          <HeroLink
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/"
          >
            <Logo />
            <p className="font-bold text-inherit">
              Evalink|{new Date().getFullYear()}
            </p>
          </HeroLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <ThemeSwitch />
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.label}-${index}`}>
              <HeroLink
                color={
                  index === 2
                    ? "primary"
                    : index === siteConfig.navMenuItems.length - 1
                      ? "danger"
                      : "foreground"
                }
                href={item.href}
                size="lg"
              >
                {item.label}
              </HeroLink>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>

      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          {isAuthorized && user ? (
            user.foto_thumbnail ? (
              <Avatar
                isBordered
                alt="Foto de perfil"
                as="button"
                className="transition-transform object-top"
                src={buildFileUrl(user.foto_thumbnail)}
              />
            ) : (
              <Button
                isIconOnly
                variant="ghost"
                className="h-10 w-10 rounded-full border-2 border-default-200"
              >
                <UserIcon className="w-6 h-6" />
              </Button>
            )
          ) : (
            <Skeleton className="h-10 w-10 rounded-full" />
          )}
        </DropdownTrigger>

        {isAuthorized && user && (
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            {user.is_superuser ? (
              <>
                <DropdownItem
                  key="admin"
                  onPress={() =>
                    (window.location.href = `${import.meta.env.VITE_API_URL}/admin/`)
                  }
                >
                  <div className="flex items-center gap-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Administración</span>
                  </div>
                </DropdownItem>
              </>
            ) : null}

            <DropdownItem key="perfil" onPress={handleProfileClick}>
              <div className="flex items-center gap-x-2">
                <UserIcon className="w-4 h-4" />
                <span>Perfil</span>
              </div>
            </DropdownItem>
            <DropdownItem
              key="logout"
              className="text-danger"
              color="danger"
              onPress={onOpen}
            >
              Cerrar Sesión
            </DropdownItem>
          </DropdownMenu>
        )}
      </Dropdown>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-lg font-semibold text-red-600">
                ¿Cerrar sesión?
              </ModalHeader>

              <ModalBody>
                <p>¿Estás seguro de que deseas cerrar sesión?</p>
              </ModalBody>

              <ModalFooter className="flex justify-end gap-2">
                <Button
                  className="text-white"
                  color="secondary"
                  variant="solid"
                  onPress={onClose}
                >
                  Cancelar
                </Button>

                <Button
                  color="danger"
                  variant="solid"
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
  );
};
