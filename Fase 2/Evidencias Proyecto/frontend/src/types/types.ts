export interface User {
  id: number;
  foto: string;
  foto_thumbnail: string;
  first_name: string;
  last_name: string;
  genero: string | null;
  titulos: Titulo[];
  diplomados: Diplomado[];
  is_superuser: boolean;
  edad: Date;
  empresa: Empresa | string | null | number;
  magisters: Magister[];
  date_joined: string;
  username: string;
  cargo: string | null;
  email: string;
  telefono?: string;
  bienios: Bienio[];
  evaluacion: Evaluation[];
  capacitacion: Capacitacion[];
  jefe: string | null;
  group: number;
  rut: string;
  tiempo_en: string;
}

export interface Empresa {
  id: number;
  logo: string;
  empresa: string;
  name: string;
}

export interface Titulo {
  titulo: string;
  institucion: string;
  anio: number;
}

export interface Diplomado {
  diplomado: string;
  institucion: string;
  anio: number;
}

export interface Magister {
  magister: string;
  institucion: string;
  anio: number;
}

export interface Bienio {
  bienios: number;
  tramo: string;
}
export interface Capacitacion {
  id: number;
  capacitacion: Capa;
  fecha_realizacion: number;
}

export interface Capa {
  id: number;
  titulo_general: string;
  nombre: string;
  descripcion: string;
}

export interface Competencia {
  id: number;
  aeva: number;
  aeva_name: string;
  name: string;
  compeindicador_set: {
    id: number;
    competencia: number;
    indicador: string;
    numero: number;
    nvlindicadores: {
      id: number;
      descripcion: string;
      compe_indicador: number;
      nvl: number;
    }[];
  }[];
}

export interface Evaluation {
  id: number;
  porcentaje: number;
  drive_url?: string; // URL del archivo
  anio: string; // Ej: "202407"
  fecha_creacion: string;
}
