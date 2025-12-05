import { useMemo, useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Iconos
import {
  CalendarDaysIcon,
  SparklesIcon,
  DocumentTextIcon,
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CogIcon,
  LinkIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// Tus imports
import { useSession } from "@/hooks/useSession";
import { usePermissions } from "@/hooks/usePermissions";
import { sections } from "@/data/sections";

// --- TEMAS VISUALES ---
const THEMES: Record<string, any> = {
  rose: {
    gradient: "from-rose-500 to-pink-600",
    bgSoft: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-700 dark:text-rose-200",
    icon: "text-rose-600 dark:text-rose-400",
  },
  blue: {
    gradient: "from-blue-500 to-indigo-600",
    bgSoft: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-200",
    icon: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    gradient: "from-violet-500 to-purple-600",
    bgSoft: "bg-violet-50 dark:bg-violet-900/20",
    text: "text-violet-700 dark:text-violet-200",
    icon: "text-violet-600 dark:text-violet-400",
  },
  emerald: {
    gradient: "from-emerald-500 to-teal-600",
    bgSoft: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-200",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  slate: {
    gradient: "from-slate-500 to-gray-600",
    bgSoft: "bg-slate-50 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-200",
    icon: "text-slate-600 dark:text-slate-400",
  },
};

const getSectionTheme = (title: string) => {
  const t = title.toUpperCase();

  if (t.includes("HUMANOS") || t.includes("RRHH")) return THEMES.rose;
  if (t.includes("EVALUA")) return THEMES.blue;
  if (t.includes("TRABAJADOR") || t.includes("DOCENTE")) return THEMES.purple;
  if (t.includes("ADMIN")) return THEMES.slate;

  return THEMES.emerald;
};

const getSectionIcon = (title: string) => {
  const t = title.toUpperCase();

  if (t.includes("HUMANOS")) return <UserGroupIcon className="w-5 h-5" />;
  if (t.includes("EVALUA")) return <AcademicCapIcon className="w-5 h-5" />;
  if (t.includes("TRABAJADOR")) return <BriefcaseIcon className="w-5 h-5" />;
  if (t.includes("ADMIN")) return <CogIcon className="w-5 h-5" />;

  return <UserIcon className="w-5 h-5" />;
};

const getCardDescription = (label: string) => {
  const l = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (l.includes("evaluacion"))
    return "Reflexiona sobre tu práctica pedagógica, reconoce tus logros en el aula y detecta áreas de crecimiento personal.";
  if (l.includes("evaluar") || l.includes("pendientes"))
    return "Brinda una mirada constructiva y guía el desarrollo profesional de tu equipo docente hacia la excelencia.";
  if (l.includes("mixta"))
    return "Una visión integral 180°: conecta tu autopercepción con la retroalimentación de tu liderazgo educativo.";

  return "Accede a las herramientas de gestión de este módulo.";
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { hasAccess } = usePermissions();
  const { user } = useSession();

  const [greeting, setGreeting] = useState("Hola");
  const [currentDate, setCurrentDate] = useState("");

  const displayName =
    user?.nombres?.split(" ")[0] || user?.username || "Colega";
  const companyName = user?.empresa?.name || "Mi Institución";
  const companyLogo = user?.empresa?.logo || user?.empresa?.logo_url || null;

  // --- LÓGICA DE DATOS ---
  const { groupedSections, totalModules } = useMemo(() => {
    if (!sections) return { groupedSections: [], totalModules: 0 };

    let count = 0;
    const groups = sections
      .map((section) => {
        const validButtons =
          section.buttons?.filter((btn) => hasAccess(btn.permiso)) || [];

        if (validButtons.length === 0) return null;

        count += validButtons.length;
        const theme = getSectionTheme(section.title || "General");

        const buttonsWithTheme = validButtons.map((btn) => ({
          ...btn,
          sectionTitle: section.title,
          theme,
          description: getCardDescription(btn.label),
        }));

        return {
          id: section.title,
          title: section.title || "General",
          buttons: buttonsWithTheme,
          theme,
          icon: getSectionIcon(section.title || ""),
        };
      })
      .filter(Boolean);

    return { groupedSections: groups, totalModules: count };
  }, [hasAccess, sections]);

  useEffect(() => {
    const h = new Date().getHours();

    setGreeting(
      h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches",
    );
    setCurrentDate(
      new Date().toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }, []);

  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();
  const currentDay = new Date().getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="min-h-screen w-full font-sans bg-[#FDFBF7] dark:bg-[#0c0c0e] relative overflow-x-hidden selection:bg-orange-100 dark:selection:bg-indigo-900">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#a1a1aa_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.15] dark:opacity-[0.1]" />
        <motion.div
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[60%] rounded-full bg-gradient-to-br from-amber-200/40 via-orange-100/30 to-transparent blur-[120px]"
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          className="absolute top-[20%] -right-[10%] w-[60%] h-[70%] rounded-full bg-gradient-to-bl from-sky-200/40 via-indigo-100/30 to-transparent blur-[130px]"
          transition={{ duration: 15, delay: 2, repeat: Infinity }}
        />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 md:py-12 flex flex-col gap-8">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-white/60 border border-orange-200/50 backdrop-blur-md shadow-sm">
              <CalendarDaysIcon className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600 capitalize">
                {currentDate}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {greeting},{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-600">
                {displayName}.
              </span>
            </h1>

            {companyLogo && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
                initial={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.1 }}
              >
                <div className="p-4 bg-white/70 dark:bg-white/5 rounded-[1.5rem] mt-4 border border-white/50 dark:border-white/10 shadow-sm backdrop-blur-xl flex items-center gap-4 w-2xl">
                  <img
                    alt={companyName}
                    className="h-16 w-auto object-contain mix-blend-multiply dark:mix-blend-normal opacity-95 gap-4"
                    src={companyLogo}
                  />
                  <p className="text-xl text-gray-500 dark:text-gray-400 font-medium max-w-2xl">
                    Bienvenido a{" "}
                    <span className="text-gray-800 dark:text-gray-200 font-bold">
                      {companyName}
                    </span>
                    . Tu lugar para realizar evaluaciones y gestionar tu
                    información de manera eficiente.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Cita Inspiradora (Estilo tarjeta de nota) */}
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:flex w-full max-w-sm bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 p-5 rounded-3xl shadow-sm items-center gap-4 hover:bg-white/80 transition-colors duration-500"
            initial={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-3 bg-gradient-to-br from-amber-300 to-orange-400 rounded-2xl text-white shadow-lg shadow-orange-500/20 shrink-0">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-serif italic text-gray-700 dark:text-gray-300 leading-relaxed">
                "La educación es el encendido de una llama, no el llenado de un
                recipiente."
              </p>
              <p className="text-xs mt-1.5 text-gray-400 font-bold tracking-wide uppercase">
                — Sócrates
              </p>
            </div>
          </motion.div>
        </header>

        {/* LAYOUT: 2 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: Módulos (Adaptativa) */}
          <div className="lg:col-span-8 space-y-10 min-h-[500px]">
            {groupedSections.length === 0 ? (
              // EMPTY STATE: Se muestra si no hay NADA asignado
              <div className="flex flex-col items-center justify-center py-20 bg-white/40 rounded-3xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  No hay módulos asignados a tu cuenta.
                </p>
              </div>
            ) : (
              groupedSections.map((section: any, sectionIdx) => {
                // LÓGICA DE GRID INTELIGENTE:
                // Si la sección tiene 1 solo botón, usamos grid-cols-1 (tarjeta ancha).
                // Si tiene 2+, usamos grid-cols-2.
                // Además, si el TOTAL de módulos en toda la app es bajo (<3), forzamos tarjetas anchas para llenar espacio.
                const useWideCards =
                  section.buttons.length === 1 || totalModules < 3;

                return (
                  <motion.div
                    key={sectionIdx}
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 15 }}
                    transition={{ delay: sectionIdx * 0.1 }}
                  >
                    <div className="flex items-center gap-3 mb-4 pl-1">
                      <div
                        className={`w-2 h-8 rounded-full bg-gradient-to-b ${section.theme.gradient}`}
                      />
                      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                        {section.title}
                      </h2>
                    </div>

                    <div
                      className={`grid gap-4 ${useWideCards ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}
                    >
                      {section.buttons.map((module: any, idx: number) => (
                        <motion.div
                          key={idx}
                          transition={{ type: "spring", stiffness: 400 }}
                          whileHover={{ y: -3 }}
                        >
                          <Card
                            isPressable
                            className={`w-full bg-white dark:bg-[#151518] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] hover:border-orange-200/60 transition-all duration-300 rounded-2xl group overflow-hidden
                                ${useWideCards ? "py-2" : ""} 
                            `}
                            onPress={() => navigate(module.href)}
                          >
                            <CardBody className="p-5 flex items-center gap-5">
                              {/* Icono: Más grande si es tarjeta ancha */}
                              <div
                                className={`shrink-0 rounded-2xl ${section.theme.bgSoft} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${useWideCards ? "w-16 h-16" : "w-12 h-12"}`}
                              >
                                <div
                                  className={`${section.theme.icon} ${useWideCards ? "w-8 h-8" : "w-6 h-6"}`}
                                >
                                  {/* Si tienes iconos específicos en 'module.icon', úsalos aquí. Si no, usa el genérico de la sección */}
                                  {section.icon}
                                </div>
                              </div>

                              <div className="flex-1 text-left">
                                <h3
                                  className={`font-bold text-gray-800 dark:text-gray-100 group-hover:text-orange-600 transition-colors ${useWideCards ? "text-lg" : "text-base"}`}
                                >
                                  {module.label}
                                </h3>
                                <p
                                  className={`text-gray-500 mt-1 ${useWideCards ? "text-sm line-clamp-2" : "text-xs line-clamp-1"}`}
                                >
                                  {module.description}
                                </p>
                              </div>

                              <div
                                className={`rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors ${useWideCards ? "w-10 h-10" : "w-8 h-8"}`}
                              >
                                <ChevronRightIcon className="w-4 h-4" />
                              </div>
                            </CardBody>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* COLUMNA DERECHA: Sidebar (Fija y Decorativa) */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            {/* Calendario */}
            <div className="bg-white dark:bg-[#151518] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full -mr-4 -mt-4" />

              <div className="flex justify-between items-center mb-6 relative">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  Diciembre 2025
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">
                  Semestre 2
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-400 mb-3 font-medium">
                <span>L</span>
                <span>M</span>
                <span>M</span>
                <span>J</span>
                <span>V</span>
                <span>S</span>
                <span>D</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-sm">
                {[1, 2, 3].map((d) => (
                  <div key={`e-${d}`} />
                ))}
                {daysArray.map((day) => (
                  <div
                    key={day}
                    className={`aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-default
                    ${
                      day === currentDay
                        ? "bg-gradient-to-br from-indigo-500 to-rose-600 text-white shadow-lg shadow-indigo-500/30 scale-110"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Accesos Rápidos */}
            <div className="bg-white/60 dark:bg-[#151518]/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 dark:border-white/5 shadow-sm">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Accesos Rápidos
              </h4>
              <ul className="space-y-4">
                <li>
                  <a
                    className="flex items-center gap-4 group"
                    href="https://cslb.cl"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 transition-colors">
                        Web del Colegio
                      </p>
                      <p className="text-xs text-gray-400">
                        Noticias y comunicados
                      </p>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
