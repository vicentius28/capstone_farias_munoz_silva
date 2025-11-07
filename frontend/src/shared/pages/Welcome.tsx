// Importaciones y helpers
import React, { useState, Suspense, useEffect, JSX } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
// import { Divider } from "@heroui/divider"; // ← no usado
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { addToast } from "@heroui/toast";

import { title } from "@/shared/utils/primitives";
import { Button } from "@heroui/button";
import { ThemeSwitch } from "@/shared/components/ui/theme-switch";

// ⬇ Lazy load de componentes secundarios
const GoogleLoginButton = React.lazy(
  () => import("@/features/auth/components/GoogleLoginButton"),
);
const TermsModal = React.lazy(
  () => import("@/shared/components/ui/Legal/TermsModal"),
);
const Footer = React.lazy(() => import("@/shared/components/layout/footer"));

const showErrorToast = (type: string) => {
  const messages: Record<
    string,
    { title: string; description: string; color: "danger" | "warning"; timeout: number }
  > = {
    invalid_domain: {
      title: "Acceso Denegado",
      description: "Cuenta no registrada y correo electrónico no pertenece a un dominio autorizado.",
      color: "danger",
      timeout: 5000,
    },
    no_registered: {
      title: "Cuenta no registrada",
      description: "Tu correo no está registrado en nuestra plataforma. Contacta con Recursos Humanos.",
      color: "warning",
      timeout: 4000,
    },
    default: {
      title: "Error de acceso",
      description: "Ocurrió un error inesperado. Intenta nuevamente.",
      color: "danger",
      timeout: 3000,
    },
  };

  const msg = messages[type] || messages.default;
  addToast({ ...msg, shouldShowTimeoutProgress: true });
};

// Burbujas animadas
// Componente de fondo con burbujas cálidas
const EnhancedBubbles = () => {
  const [bubbles, setBubbles] = useState<JSX.Element[] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isDark = document.documentElement.classList.contains("dark");

    const newBubbles = [...Array(6)].map((_, i) => {
      const size = 36 + Math.random() * 18;
      const depth = i / 6;
      const colors = isDark
        ? [
            "rgba(59,130,246,0.16)",  // blue-500
            "rgba(99,102,241,0.14)",  // indigo-500
            "rgba(14,165,233,0.14)",  // sky-500
            "rgba(56,189,248,0.14)",  // cyan-400
            "rgba(37,99,235,0.14)",   // blue-600
          ]
        : [
            "rgba(59,130,246,0.25)",  // blue-500
            "rgba(99,102,241,0.20)",  // indigo-500
            "rgba(14,165,233,0.18)",  // sky-500
            "rgba(56,189,248,0.18)",  // cyan-400
            "rgba(147,197,253,0.15)", // blue-300
          ];

      return (
        <motion.div
          key={i}
          animate={{
            x: [i % 2 === 0 ? -120 : screenWidth + 120, i % 2 === 0 ? screenWidth + 120 : -120],
            y: [Math.random() * screenHeight, Math.random() * screenHeight],
            scale: [1, 1.1, 1],
          }}
          className="absolute rounded-full pointer-events-none"
          initial={{ x: i % 2 === 0 ? -120 : screenWidth + 120, y: Math.random() * screenHeight }}
          style={{
            width: size,
            height: size,
            backgroundColor: colors[i % colors.length],
            boxShadow: `0 0 30px ${colors[i % colors.length]}`,
            zIndex: -depth * 10,
            mixBlendMode: isDark ? "screen" : "normal",
            filter: "blur(0.6px)",
          }}
          transition={{ duration: 14 - depth * 4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      );
    });

    setBubbles(newBubbles);
  }, []);

  return <AnimatePresence>{bubbles}</AnimatePresence>;
};

// Componente de fondo: Imagen atenuada con overlay
const BackgroundImage = () => (
  <div className="fixed inset-0 -z-10">
    <div className="absolute inset-0 bg-[url('/bg-evalink.jpg')] bg-cover bg-center" />
    <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-rose-50/50 to-amber-50/60 dark:from-[#0b0f17]/70 dark:via-[#131a24]/80 dark:to-[#0b0f17]/70" />
  </div>
);

// Componente de fondo: Blobs orgánicos
const BackgroundBlobs = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <svg className="absolute w-[140vw] h-[140vh] -left-[20vw] -top-[20vh]" viewBox="0 0 800 600">
      <defs>
        <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(251 191 36 / 0.30)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(244 114 182 / 0.25)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="blob3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(59 130 246 / 0.18)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <g opacity="0.9">
        <circle cx="160" cy="140" r="220" fill="url(#blob1)" />
        <circle cx="640" cy="160" r="200" fill="url(#blob2)" />
        <circle cx="360" cy="420" r="240" fill="url(#blob3)" />
      </g>
    </svg>
    {/* Overlay para modos de color */}
    <div className="absolute inset-0 bg-gradient-to-br from-rose-50/40 via-amber-50/40 to-orange-50/40 dark:from-[#0b0f17]/70 dark:via-[#131a24]/80 dark:to-[#0b0f17]/70" />
  </div>
);

function Welcome() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");
    const loggedOut = params.get("logged_out");

    if (loggedOut && !sessionStorage.getItem("logged_out_handled")) {
      localStorage.clear();
      sessionStorage.clear();
      addToast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente.", color: "success", timeout: 3000 });
      sessionStorage.setItem("logged_out_handled", "true");
      setTimeout(() => navigate("/login", { replace: true }), 100);
    } else {
      sessionStorage.removeItem("logged_out_handled");
    }

    if (errorParam && !sessionStorage.getItem(`error_handled_${errorParam}`)) {
      showErrorToast(errorParam);
      sessionStorage.setItem(`error_handled_${errorParam}`, "true");
      setTimeout(() => navigate("/login", { replace: true }), 100);
    } else {
      sessionStorage.removeItem("error_handled_invalid_domain");
      sessionStorage.removeItem("error_handled_no_registered");
    }
  }, [location.search, navigate]);

  return (
    <>
      {/* Fondo animado azul con burbujas + malla de puntos */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:from-[#0b1220] dark:via-[#0f172a] dark:to-[#0b1220]">
        <EnhancedBubbles />
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "12px 12px" }}
        />
      </div>
      {/* Layout principal y tarjeta */}
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center px-6 py-10">
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full max-w-[620px]"
          >
            <Card className="rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-[#111827]/90 shadow-2xl border border-white/60 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5">
              <CardHeader className="px-8 pt-8">
                <div className="w-full flex flex-col items-center justify-center text-center gap-3">
                  <img
                    src="/CED.png"
                    alt="Logo Evalink"
                    className="w-14 h-14 object-contain rounded-xl mx-auto"
                    draggable={false}
                  />
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-300">
                      Evalink
                    </span>
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Accede con tu cuenta institucional
                  </p>
                </div>
              </CardHeader>

              <CardBody className="px-8 pb-10 text-center">
                {/* Inicio de sesión (único contenido) */}
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Inicia sesión para continuar con tus procesos de evaluación.
                </p>

                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-4 gap-2">
                      <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Cargando...</span>
                    </div>
                  }
                >
                  <div className="mt-3 flex justify-center">
                    <GoogleLoginButton />
                  </div>
                </Suspense>

                <div className="mt-6">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Al iniciar sesión, aceptas nuestros{" "}
                    <Button
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium transition-colors"
                      type="button"
                      onClick={() => setShowTerms(true)}
                      variant="light"
                      color="primary"
                    >
                      Términos y Condiciones
                    </Button>
                  </p>
                </div>

                {/* Cambiar tema: pill centrado */}
                <div className="mt-8">
                  <div className="mx-auto w-fit flex items-center gap-2 rounded-full bg-blue-50 dark:bg-zinc-800/60 px-3 py-1.5 shadow-sm">
                    <span className="text-xs font-medium text-blue-700 dark:text-slate-200">Tema</span>
                    <div className="scale-90 sm:scale-75">
                      <ThemeSwitch />
                    </div>
                  </div>
                </div>

                <Suspense fallback={null}>
                  <TermsModal isOpen={showTerms} onClose={setShowTerms} />
                </Suspense>
              </CardBody>
            </Card>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0 py-4">
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </footer>
      </div>
    </>
  );
}

export default Welcome;

// Iconos de evaluación
import { AcademicCapIcon, ClipboardDocumentListIcon, HeartIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
