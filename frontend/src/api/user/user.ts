import api from "@/services/google/axiosInstance";
import { User } from "@/types/types";
import { UsuarioDias } from "@/features/usuario";

const BASE_API_URL = import.meta.env.VITE_API_URL + "/proyecto/api";

// 🔄 Obtiene todos los usuarios con mejor manejo de errores
export const fetchAllUsers = async (searchQuery?: string): Promise<User[]> => {
  try {
    console.log('🔍 Fetching users from API:', BASE_API_URL + '/user-all/');
    console.log('🔍 Search query:', searchQuery);
    
    const params = searchQuery ? { search: searchQuery } : {};
    const response = await api.get<User[]>(`${BASE_API_URL}/user-all/`, { 
      params,
      timeout: 30000 // 30 segundos de timeout
    });

    console.log('✅ API Response status:', response.status);
    console.log('✅ API Response data length:', response.data?.length || 0);

    // Validar que la respuesta sea un array
    if (!Array.isArray(response.data)) {
      console.error('❌ Invalid response format:', response.data);
      throw new Error('Formato de respuesta inválido del servidor');
    }

    // Validar que los usuarios tengan la estructura esperada
    const validUsers = response.data.filter(user => {
      const isValid = user && typeof user === 'object' && user.id;
      if (!isValid) {
        console.warn('⚠️ Invalid user object:', user);
      }
      return isValid;
    });

    if (validUsers.length !== response.data.length) {
      console.warn(`⚠️ Filtered ${response.data.length - validUsers.length} invalid users`);
    }

    console.log('✅ Valid users count:', validUsers.length);
    return validUsers;

  } catch (error: any) {
    console.error("❌ Error obteniendo todos los usuarios:", error);

    // Proporcionar información más detallada del error
    if (error.response) {
      // Error de respuesta del servidor
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.detail || 'Error del servidor';
      
      console.error(`❌ Server error ${status}:`, message);
      
      if (status === 401) {
        throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
      } else if (status === 403) {
        throw new Error('No tienes permisos para acceder a esta información.');
      } else if (status === 404) {
        throw new Error('Endpoint no encontrado. Verifica la configuración del servidor.');
      } else if (status >= 500) {
        throw new Error('Error interno del servidor. Intenta nuevamente más tarde.');
      } else {
        throw new Error(`Error del servidor: ${message}`);
      }
    } else if (error.request) {
      // Error de red
      console.error('❌ Network error:', error.request);
      throw new Error('Error de conexión. Verifica tu conexión a internet y que el servidor esté disponible.');
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      console.error('❌ Request timeout');
      throw new Error('La solicitud tardó demasiado. El servidor puede estar sobrecargado.');
    } else {
      // Error desconocido
      console.error('❌ Unknown error:', error.message);
      throw new Error(`Error inesperado: ${error.message}`);
    }
  }
};

export const fetchUserById = async (userId: string): Promise<User | null> => {
  try {
    console.log('🔍 Fetching user by ID:', userId);
    const response = await api.get<User>(`${BASE_API_URL}/user/${userId}/`);
    console.log('✅ User fetched successfully');
    return response.data;
  } catch (error: any) {
    console.error(`❌ Error obteniendo el usuario ${userId}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Usuario no encontrado');
    }
    
    return null;
  }
};

// api/authService.ts
export const fetchUsuarioActual = async () => {
  try {
    const res = await api.get("/usuario/api/get/usuario/");
    return res.data;
  } catch (error) {
    console.error("Error al obtener usuario actual:", error);
    return null;
  }
};

export const obtenerUsuariosDias = async (): Promise<UsuarioDias[]> => {
  try {
    const response = await api.get("proyecto/api/usuarios-dias/");
    return response.data;
  } catch (error) {
    console.error("Error al obtener usuarios días:", error);
    return [];
  }
};
