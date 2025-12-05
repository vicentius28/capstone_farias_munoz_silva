import api from "@/services/google/axiosInstance"; // usa el global con refresh automático
import { TipoEvaluacion } from "@/features/evaluacion/types/evaluacion";

export const BASE_API_URL = import.meta.env.VITE_API_URL + "/evaluacion/api/";

/**
 * Obtiene la lista ligera de plantillas (Optimizada).
 * Nota: Los objetos devueltos NO contienen 'areas' ni 'competencias'.
 * Usado solo para el listado / tarjetas.
 */
export const fetchEvaluacion = async (): Promise<TipoEvaluacion[]> => {
  try {
    const response = await api.get<TipoEvaluacion[]>(
      `${BASE_API_URL}tipos-evaluacion/`,
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error obteniendo los tipos de evaluación:", error);

    return [];
  }
};

/**
 * Obtiene el detalle completo de una plantilla por ID.
 * Incluye toda la estructura anidada (Áreas -> Competencias -> Indicadores).
 * Usado al entrar a editar.
 */
export const fetchEvaluacionById = async (
  id: number,
): Promise<TipoEvaluacion | null> => {
  try {
    const response = await api.get<TipoEvaluacion>(
      `${BASE_API_URL}tipos-evaluacion/${id}/`,
    );

    return response.data;
  } catch (error) {
    console.error(
      `❌ Error obteniendo el detalle de la evaluación ID ${id}:`,
      error,
    );

    return null;
  }
};
