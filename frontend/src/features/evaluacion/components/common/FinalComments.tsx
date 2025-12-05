import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Lock,
  Send,
  Sparkles,
  MessageSquarePlus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface FinalCommentsProps {
  progresoGlobal: number;
  respuestasRespondidasGlobal: number;
  totalIndicadoresGlobal: number;
  mostrarTextarea: boolean;
  textMejorar: string;
  textDestacar: string;
  setTextMejorar: (text: string) => void;
  setTextDestacar: (text: string) => void;
  handleFinalizar: () => void;
  tipoEvaluacion: "autoevaluacion" | "evaluacion";
  isLoading?: boolean;
  guardando?: boolean;
}

export default function FinalComments({
  progresoGlobal,
  respuestasRespondidasGlobal,
  totalIndicadoresGlobal,
  textMejorar,
  textDestacar,
  setTextMejorar,
  setTextDestacar,
  handleFinalizar,
  isLoading = false,
  guardando = false,
}: FinalCommentsProps) {
  // Hook para controlar el modal
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Validaciones
  const minChars = 20;
  const isDestacarValid = textDestacar.trim().length >= minChars;
  const isMejorarValid = textMejorar.trim().length >= minChars;
  const isFormValid = isDestacarValid && isMejorarValid;
  const isComplete = progresoGlobal === 100;

  // Estados de la interfaz
  const isDisabled = isLoading || guardando;

  // Función interna para manejar el envío desde el modal
  const onConfirmSend = () => {
    handleFinalizar();
    // No necesitamos cerrar el modal manualmente si handleFinalizar navega a otra página.
    // Si la acción es asíncrona y te quedas en la misma página, el modal se cerrará solo si el componente se desmonta o puedes usar onClose.
  };

  // --- VISTA 1: BLOQUEADO (Progreso incompleto) ---
  if (!isComplete) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-8 flex flex-col items-center justify-center text-center transition-all">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">
          Sección Final Bloqueada
        </h3>
        <p className="text-sm text-slate-500 max-w-md mt-2">
          Para acceder a los comentarios finales y enviar la evaluación, debes
          completar todos los indicadores.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/50 text-xs font-bold text-slate-600">
          <span>
            Faltan {totalIndicadoresGlobal - respuestasRespondidasGlobal}{" "}
            preguntas
          </span>
        </div>
      </div>
    );
  }

  // --- VISTA 2: FORMULARIO ACTIVO (Progreso 100%) ---
  return (
    <>
      <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
          {/* Header Visual */}
          <div className="bg-gradient-to-r from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Comentarios Finales
                </h3>
                <p className="text-sm text-slate-500">
                  Comparte tu retroalimentación para cerrar el proceso.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Campo 1: Destacar */}
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>Aspectos a destacar</span>
                <span
                  className={cn(
                    "text-xs transition-colors",
                    textDestacar.length >= 500
                      ? "text-rose-500"
                      : isDestacarValid
                      ? "text-emerald-600"
                      : "text-slate-400"
                  )}
                >
                  {textDestacar.length} / 500
                </span>
              </label>
              <div className="relative group">
                <Textarea
                  classNames={{
                    inputWrapper: cn(
                      "bg-slate-50 dark:bg-slate-800 border-2 shadow-none transition-all duration-300",
                      // La lógica visual aquí causaba el problema de redibujado al perder foco
                      !isDestacarValid && textDestacar.length > 0
                        ? "border-amber-200 focus-within:border-amber-400 bg-amber-50/30"
                        : "border-slate-100 hover:border-slate-300 focus-within:border-indigo-500 focus-within:bg-white"
                    ),
                    input:
                      "text-slate-700 dark:text-slate-200 placeholder:text-slate-400",
                  }}
                  isDisabled={isDisabled}
                  maxLength={500}
                  minRows={3}
                  placeholder="Describe las fortalezas y logros observados..."
                  value={textDestacar}
                  onValueChange={setTextDestacar}
                />
                <div className="absolute right-3 top-3 pointer-events-none">
                  {isDestacarValid ? (
                    <div className="bg-emerald-100 p-1 rounded-full animate-in zoom-in">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                    </div>
                  ) : (
                    textDestacar.length > 0 && (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Campo 2: Mejorar */}
            <div className="space-y-3">
              <label className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>Oportunidades de mejora</span>
                <span
                  className={cn(
                    "text-xs transition-colors",
                    textMejorar.length >= 500
                      ? "text-rose-500"
                      : isMejorarValid
                      ? "text-emerald-600"
                      : "text-slate-400"
                  )}
                >
                  {textMejorar.length} / 500
                </span>
              </label>
              <div className="relative group">
                <Textarea
                  classNames={{
                    inputWrapper: cn(
                      "bg-slate-50 dark:bg-slate-800 border-2 shadow-none transition-all duration-300",
                      !isMejorarValid && textMejorar.length > 0
                        ? "border-amber-200 focus-within:border-amber-400 bg-amber-50/30"
                        : "border-slate-100 hover:border-slate-300 focus-within:border-indigo-500 focus-within:bg-white"
                    ),
                    input:
                      "text-slate-700 dark:text-slate-200 placeholder:text-slate-400",
                  }}
                  isDisabled={isDisabled}
                  maxLength={500}
                  minRows={3}
                  placeholder="¿Qué aspectos podrían desarrollarse mejor?"
                  value={textMejorar}
                  onValueChange={setTextMejorar}
                />
                <div className="absolute right-3 top-3 pointer-events-none">
                  {isMejorarValid && (
                    <div className="bg-emerald-100 p-1 rounded-full animate-in zoom-in">
                      <MessageSquarePlus className="w-3 h-3 text-emerald-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer de Acción */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400 text-center sm:text-left">
                {guardando
                  ? "Sincronizando cambios con la nube..."
                  : "Una vez enviada, no podrás modificar la evaluación."}
              </p>

              <Button
                className={cn(
                  "w-full sm:w-auto font-semibold shadow-lg transition-all duration-300",
                  isFormValid
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-indigo-200"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 border border-slate-200"
                )}
                isDisabled={!isFormValid || isDisabled}
                isLoading={isLoading}
                size="lg"
                startContent={!isLoading && <Send className="w-4 h-4" />}
                
                // --- FIX DOBLE CLIC ---
                onMouseDown={(e) => e.preventDefault()}
                
                onPress={onOpen}
              >
                {isLoading ? "Enviando..." : "Finalizar Evaluación"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DE CONFIRMACIÓN --- */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        backdrop="blur"
        // --- FIX BLOQUEO DE MODAL ---
        // Si está cargando, evitamos que se cierre al hacer clic fuera o presionar ESC
        isDismissable={!isLoading} 
        isKeyboardDismissDisabled={isLoading}
        hideCloseButton={isLoading}
        classNames={{
          base: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-xl">Confirmar Envío</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-300">
                    Estás a punto de finalizar el proceso de evaluación. Por favor verifica que:
                  </p>
                  <ul className="list-disc list-inside text-sm text-slate-500 space-y-1 ml-2">
                    <li>Has respondido todos los indicadores.</li>
                    <li>Tus comentarios finales son claros y constructivos.</li>
                    <li>La ortografía y redacción son correctas.</li>
                  </ul>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      Esta acción es irreversible. No podrás editar tus respuestas después de enviar.
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={onClose}
                  // Deshabilitamos el botón de cancelar si ya está enviando
                  isDisabled={isLoading}
                >
                  Volver y Revisar
                </Button>
                <Button 
                  className="bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                  isLoading={isLoading}
                  onPress={() => {
                    onConfirmSend();
                    // NO llamamos a onClose() aquí.
                    // El modal se mantendrá abierto y "cargando" hasta que 
                    // el componente se desmonte por la redirección.
                  }}
                >
                  Sí, Enviar Evaluación
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}