import api from "@/services/google/axiosInstance";

export type UserPermissions = {
  grupo: string;
  empresa: string;
  permisos: string[];
};

export const getUserPermissions = async (): Promise<UserPermissions> => {
  const response = await api.get("/acceso/api/auth/user/access/");

  const data = response.data;
  if (
    !data ||
    typeof data.grupo !== "string" ||
    typeof data.empresa !== "string" ||
    !Array.isArray(data.permisos)
  ) {
    throw new Error("Formato inesperado de permisos de usuario");
  }

  return data as UserPermissions;
};
