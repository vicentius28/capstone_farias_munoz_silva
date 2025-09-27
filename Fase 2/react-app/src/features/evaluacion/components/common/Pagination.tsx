import { useState, ReactNode } from "react";
import { Button } from "@heroui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface PaginationProps {
  estructura: any;
  renderBloque: (areaActual: any) => ReactNode;
  titulo: string;
}

export default function Pagination({
  estructura,
  renderBloque,
}: PaginationProps) {
  const [paginaActual, setPaginaActual] = useState(0);
  const totalPaginas = estructura.areas.length;

  const areaActual = estructura.areas[paginaActual];

  const avanzar = () => {
    if (paginaActual < totalPaginas - 1) setPaginaActual(paginaActual + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const retroceder = () => {
    if (paginaActual > 0) setPaginaActual(paginaActual - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-default-200 to-default-100/50">
      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 pb-20 sm:pb-24 lg:pb-28">
        <div
          key={`area-${paginaActual}`}
          className="animate-in fade-in-0 slide-in-from-right-4 duration-500"
        >
          {renderBloque(areaActual)}
        </div>
      </div>

      {/* Navegación flotante mejorada */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Fondo con glassmorphism */}
        <div className="bg-default/40 backdrop-blur-xl border-t border-default-200/30 shadow-2xl">
          <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Botón Anterior */}
              <Button
                className={`
                  group relative overflow-hidden rounded-lg sm:rounded-xl transition-all duration-300 flex-shrink-0
                  ${paginaActual === 0
                    ? "bg-default-300 text-default-800 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary-500 to-primary-700 text-default hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
                  }
                `}
                isDisabled={paginaActual === 0}
                size="sm"
                onPress={retroceder}
              >
                <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2">
                  <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline font-medium text-sm">Anterior</span>
                </div>
                {paginaActual > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
              </Button>

              {/* Indicador central mejorado */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center">
                <div className="bg-default-100/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5">
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base font-semibold text-default-700">
                    <span>{paginaActual + 1}</span>
                    <span className="text-default-400">/</span>
                    <span>{totalPaginas}</span>
                  </div>
                </div>

                {/* Indicadores de página */}
                <div className="flex gap-1 sm:gap-1.5">
                  {Array.from({ length: Math.min(totalPaginas, 5) }, (_, index) => {
                    const pageIndex = totalPaginas <= 5 ? index :
                      paginaActual < 3 ? index :
                        paginaActual > totalPaginas - 3 ? totalPaginas - 5 + index :
                          paginaActual - 2 + index;

                    return (
                      <div
                        key={pageIndex}
                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 rounded-full transition-all duration-300 ${pageIndex === paginaActual
                          ? "bg-primary-600 scale-125"
                          : "bg-default-400 scale-100"
                          }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Botón Siguiente */}
              <Button
                className={`
                  group relative overflow-hidden rounded-lg sm:rounded-xl transition-all duration-300 flex-shrink-0
                  ${paginaActual === totalPaginas - 1
                    ? "bg-default-300 text-default-800 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
                  }
                `}
                isDisabled={paginaActual === totalPaginas - 1}
                size="sm"
                onPress={avanzar}
              >
                <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2">
                  <span className="hidden sm:inline font-medium text-sm">Siguiente</span>
                  <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {paginaActual < totalPaginas - 1 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
