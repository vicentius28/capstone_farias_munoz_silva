import { useEffect, useState, useRef } from "react";
import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Users, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@heroui/button";

import SearchBar from "@/shared/components/ui/SearchBar";
import OptimizedTableComponent from "@/shared/components/ui/Table/OptimizedTableComponent";
import useUsersCache from "@/hooks/useUsersCache";
import { columns } from "@/hooks/columns";
import { UserSkeleton } from "@/shared/components/ui/UserLoader";

interface UsersTableProps {
  buttonText: string;
  onButtonClick: (userId: number) => void;
}

export default function UsersTable({
  buttonText,
  onButtonClick,
}: UsersTableProps) {
  const {
    searchTerm,
    setSearchTerm,
    filteredUsers,
    allUsers,
    loading,
    error,
    refreshUsers,
    lastRefresh
  } = useUsersCache();

  const [page, setPage] = useState<number>(() => {
    const stored = sessionStorage.getItem("lastUserTablePage");
    return stored ? parseInt(stored, 10) : 1;
  });

  const lastPageBeforeSearchRef = useRef<number>(page);
  const previousSearchTermRef = useRef<string>("");

  useEffect(() => {
    if (!searchTerm) {
      sessionStorage.setItem("lastUserTablePage", page.toString());
    }
  }, [page, searchTerm]);

  useEffect(() => {
    const previous = previousSearchTermRef.current;
    const isNowEmpty = searchTerm === "";
    const wasEmpty = previous === "";

    previousSearchTermRef.current = searchTerm;

    if (wasEmpty && !isNowEmpty) {
      lastPageBeforeSearchRef.current = page;
      setPage(1);
    } else if (!wasEmpty && isNowEmpty) {
      if (lastPageBeforeSearchRef.current) {
        setPage(lastPageBeforeSearchRef.current);
      }
    }
  }, [searchTerm, page, setPage]);

  // Mostrar skeleton mientras carga inicialmente
  if (loading && filteredUsers.length === 0) {
    return (
      <div className="w-full space-y-6 p-6">
        <Card className="border-none shadow-sm">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Usuarios</h2>
                <p className="text-sm text-default-500">Cargando usuarios...</p>
              </div>
            </div>
            <Divider className="mb-6" />
            <SearchBar
              placeholder="Buscar por Nombre, Cargo, Empresa, Titulo, Magister o Diploma"
              value={searchTerm}
              onChange={setSearchTerm}

            />
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm">
          <CardBody className="p-0">
            <UserSkeleton />
          </CardBody>
        </Card>
      </div>
    );
  }

  // Mostrar error crítico si no se pueden cargar usuarios
  if (error && filteredUsers.length === 0 && !loading) {
    return (
      <div className="w-full space-y-6 p-6">
        <Card className="border-none shadow-sm">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-danger/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Error al cargar usuarios</h2>
                <p className="text-sm text-danger">{error}</p>
              </div>
            </div>
            <Divider className="mb-6" />
            <div className="flex gap-4">
              <Button
                color="danger"
                variant="flat"
                onPress={refreshUsers}
                startContent={<RefreshCw className="w-4 h-4" />}
              >
                Reintentar
              </Button>
              <SearchBar
                placeholder="Buscar por Nombre, Cargo, Empresa, Titulo, Magister o Diploma"
                value={searchTerm}
                onChange={setSearchTerm}

              />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header Section */}
      <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Usuarios</h2>
                <p className="text-sm text-default-500">
                  {loading ? 'Cargando usuarios...' : 'Revisa los usuarios'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {error && (
                <Chip color="warning" variant="flat" size="sm">
                  ⚠️ Error parcial
                </Chip>
              )}
              <Chip
                color={filteredUsers.length > 0 ? "primary" : "danger"}
                variant="flat"
                size="sm"
              >
                {filteredUsers.length} usuarios
                {searchTerm && ` (filtrados de ${allUsers.length})`}
              </Chip>
              {lastRefresh && (
                <Chip color="success" variant="flat" size="sm">
                  Actualizado: {lastRefresh.toLocaleTimeString()}
                </Chip>
              )}
            </div>
          </div>

          <Divider className="my-4" />

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 min-w-0">
              <SearchBar
                placeholder="Buscar por Nombre, Cargo, Empresa, Título, Magister, Diplomado, Bienio o Tramo"
                value={searchTerm}
                onChange={setSearchTerm}

              />
            </div>
            <Button
              variant="flat"
              size="sm"
              onPress={refreshUsers}
              isLoading={loading}
              startContent={!loading && <RefreshCw className="w-4 h-4" />}
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Table Section */}
      <Card className="border-none shadow-sm">
        <CardBody className="p-0">
          <OptimizedTableComponent
            buttonText={buttonText}
            columns={columns}
            data={filteredUsers}
            page={page}
            searchTerm={searchTerm}
            setPage={setPage}
            onButtonClick={onButtonClick}
            loading={loading}
            error={error}
            onRefresh={refreshUsers}
          />
        </CardBody>
      </Card>
    </div>
  );
}
