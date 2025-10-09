import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { UserIcon, RefreshCw, AlertCircle } from "lucide-react";
import { Link } from "@heroui/link";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";

import MatchTooltip from "../Tooltip/MacthTooltip";
import PaginationFooter from "./PaginationFooter";
import OptimizedAvatar from "../OptimizedAvatar";

import { buildFileUrl } from "@/utils/urlUtils";

interface Column {
  key: string;
  label: string;
}

interface Props {
  columns: Column[];
  data: any[];
  buttonText?: string;
  onButtonClick?: (userId: number) => void;
  resizedAvatars?: { [key: string]: string };
  getButtonText?: (userId: number) => string;
  searchTerm: string;
  page: number;
  setPage: (page: number) => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const ROWS_PER_PAGE_OPTIONS = [
  { key: "10", label: "10 por página" },
  { key: "25", label: "25 por página" },
  { key: "50", label: "50 por página" },
  { key: "100", label: "100 por página" },
];

const OptimizedTableComponent: React.FC<Props> = ({
  columns,
  data,
  buttonText,
  onButtonClick,
  getButtonText,
  searchTerm,
  page,
  setPage,
  loading = false,
  error = null,
  onRefresh,
}) => {
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const stored = sessionStorage.getItem("usersTableRowsPerPage");
    return stored ? parseInt(stored, 10) : 25; // Aumentar por defecto a 25
  });

  // Guardar preferencia de filas por página
  useEffect(() => {
    sessionStorage.setItem("usersTableRowsPerPage", rowsPerPage.toString());
  }, [rowsPerPage]);

  useEffect(() => {
    sessionStorage.setItem("lastUserTablePage", page.toString());
  }, [page]);

  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn('Data is not an array:', data);
      return [];
    }
    
    return [...data].sort((a, b) => {
      const nombreA = (a.persona?.last_name || a.last_name || "").toLowerCase();
      const nombreB = (b.persona?.last_name || b.last_name || "").toLowerCase();
      return nombreA.localeCompare(nombreB);
    });
  }, [data]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  // Ajustar página si es necesario cuando cambia rowsPerPage
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, page, setPage]);

  const extraerCampo = useCallback((item: any, campo: string) => {
    return (
      item.personas?.[campo]?.[campo] ??
      item[campo]?.[campo] ??
      item.personas?.[campo] ??
      item[campo] ??
      `Sin ${campo}`
    );
  }, []);

  // 🔧 Función mejorada para obtener URL de foto usando buildFileUrl
  const getUserPhotoUrl = useCallback((item: any) => {
    // Priorizar foto_thumbnail, luego foto
    const photoPath = item.foto_thumbnail || item.foto;
    if (!photoPath) {
      console.log('No photo path found for user:', item.id, item.first_name, item.last_name);
      return undefined;
    }

    const photoUrl = buildFileUrl(photoPath);
    console.log('Photo URL built for user:', item.id, 'Path:', photoPath, 'URL:', photoUrl);
    return photoUrl;
  }, []);

  // Componente de información de paginación
  const PaginationInfo = () => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, sortedData.length);
    
    return (
      <div className="flex items-center gap-4 text-sm text-default-500">
        <span>
          Mostrando {start}-{end} de {sortedData.length} usuarios
        </span>
        <Select
          size="sm"
          selectedKeys={[rowsPerPage.toString()]}
          onSelectionChange={(keys) => {
            const newRowsPerPage = parseInt(Array.from(keys)[0] as string, 10);
            setRowsPerPage(newRowsPerPage);
            setPage(1); // Reset a la primera página
          }}
          className="w-40"
          aria-label="Filas por página"
        >
          {ROWS_PER_PAGE_OPTIONS.map((option) => (
            <SelectItem key={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    );
  };

  // Mostrar error si existe
  if (error) {
    return (
      <div className="w-full p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 bg-danger-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-danger-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-danger-600">Error al cargar usuarios</h3>
            <p className="text-sm text-default-500 mt-1">{error}</p>
          </div>
          {onRefresh && (
            <Button
              color="danger"
              variant="flat"
              onPress={onRefresh}
              startContent={<RefreshCw className="w-4 h-4" />}
            >
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Información de paginación superior */}
      <div className="flex justify-between items-center mb-4 px-2">
        <PaginationInfo />
      </div>

      <Table
        isStriped
        aria-label="Tabla de usuarios optimizada"
        selectionMode="none"
        selectedKeys={new Set()}
        onRowAction={undefined}
        classNames={{
          td: "relative overflow-visible before:!content-none before:!bg-transparent before:!opacity-0",
          tr: "data-[hover=true]:bg-transparent data-[selected=true]:before:!bg-transparent",
          wrapper: "min-h-[400px]",
        }}
        bottomContent={
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <PaginationFooter page={page} pages={totalPages} onChange={setPage} />
            </div>
            <div className="flex justify-center">
              <PaginationInfo />
            </div>
          </div>
        }
      >
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.key} className="text-center py-4">
              {col.label}
            </TableColumn>
          ))}
        </TableHeader>

        <TableBody
          isLoading={loading}
          loadingContent={
            <div className="flex justify-center items-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-default-500">Cargando usuarios...</p>
              </div>
            </div>
          }
          emptyContent={
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="p-3 bg-default-100 rounded-full">
                <UserIcon className="w-6 h-6 text-default-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-default-600">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay usuarios disponibles'}
                </p>
                {searchTerm && (
                  <p className="text-xs text-default-400 mt-1">
                    para la búsqueda "{searchTerm}"
                  </p>
                )}
              </div>
            </div>
          }
        >
          {paginatedData.map((item) => {
            const nombreCompleto =
              `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim();
            const foto = getUserPhotoUrl(item);

            return (
              <TableRow key={item.id} unselectable="off">
                {columns.map((col) => (
                  <TableCell key={col.key} className="text-left">
                    {col.key === "user" ? (
                      <MatchTooltip searchTerm={searchTerm} user={item}>
                        <div className="flex items-center gap-3 py-2">
                          <OptimizedAvatar
                            src={foto}
                            name={nombreCompleto || "Sin nombre"}
                            size="md"
                            radius="lg"
                            className="object-cover bg-top flex-shrink-0"
                            showFallback={true}
                            color="warning"
                            onImageError={(error) => {
                              console.error('Error loading avatar for user:', item.id, error);
                            }}
                            onImageLoad={() => {
                              console.log('Avatar loaded successfully for user:', item.id);
                            }}
                          />
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {nombreCompleto || "Sin nombre"}
                            </p>
                            {item.email ? (
                              <Link
                                href={`mailto:${item.email}`}
                                size="sm"
                                className="text-xs text-default-500 hover:text-primary transition-colors"
                              >
                                {item.email}
                              </Link>
                            ) : (
                              <span className="text-xs text-default-400">Sin email</span>
                            )}
                          </div>
                        </div>
                      </MatchTooltip>
                    ) : col.key === "empresa" ||
                      col.key === "ciclo" ||
                      col.key === "cargo" ? (
                      <Chip
                        size="sm"
                        variant="flat"
                        color={extraerCampo(item, col.key).startsWith('Sin') ? "danger" : "default"}
                      >
                        {extraerCampo(item, col.key)}
                      </Chip>
                    ) : col.key === "completado" ? (
                      <Chip
                        size="sm"
                        color={item.completado ? "success" : "warning"}
                        variant="flat"
                      >
                        {item.completado ? "✅ Completado" : "🕒 Pendiente"}
                      </Chip>
                    ) : col.key === "accion" && buttonText && onButtonClick ? (
                      <Button
                        color={item.completado ? "success" : "secondary"}
                        variant="ghost"
                        size="sm"
                        className="relative z-10"
                        onPress={(e) => {
                          // @ts-ignore
                          e?.stopPropagation?.();
                          onButtonClick?.(item.id);
                        }}
                      >
                        {getButtonText ? getButtonText(item.id) : (item.completado ? "VER RESUMEN" : buttonText)}
                      </Button>
                    ) : (
                      <span className="text-default-500">
                        {item[col.key] || 'No disponible'}
                      </span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default OptimizedTableComponent;