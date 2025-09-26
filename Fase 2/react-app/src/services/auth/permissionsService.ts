import api from "@/services/google/axiosInstance";

export type UserPermissions = {
  grupo: string;
  empresa: string;
  permisos: string[];
};

export const getUserPermissions = async (): Promise<UserPermissions> => {
  const response = await api.get("/acceso/api/auth/user/access/");

  return response.data;
};
