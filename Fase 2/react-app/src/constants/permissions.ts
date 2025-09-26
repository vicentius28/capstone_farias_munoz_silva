// Constantes de permisos organizadas por módulos
export const PERMISSIONS = {
  // Portal Trabajador
  PORTAL: {
    SOLICITAR: 'portal.solicitar',
    MIS_SOLICITUDES: 'portal.mis_solicitudes',
    BENEFICIOS: 'portal.beneficios',
    CALENDARIO_PERMISOS: 'portal.calendario_permisos',
    AUTOEVALUACION: 'portal.autoevaluacion',
    PROTOCOLOS: 'portal.protocolos',
  },
  
  // Equipo Directivo
  DIRECTIVO: {
    FORMULARIOS_PENDIENTES: 'directivo.formularios_pendientes',
    HISTORIAL_FORMULARIOS: 'directivo.historial_formularios',
    CALENDARIO_PERMISOS: 'directivo.calendario_permisos',
    CALENDARIO_LICENCIAS: 'directivo.calendario_licencias',
    USUARIOS: 'directivo.usuarios',
    EVALUAR_DESEMPENO: 'directivo.evaluar_desempeno',
    EVALUACION_MIXTA: 'directivo.evaluacion_mixta',
  },
  // Evaluación de Desempeño
  EVALUACION: {
    PLANTILLAS: 'evaluacion.plantillas',
    ASIGNAR: 'evaluacion.asignar',
    AUTOEVALUACION: 'evaluacion.autoevaluacion',
    JEFATURA: 'evaluacion.jefatura',
    CREAR: 'evaluacion.crear',
  },
  
  // Licencias
  LICENCIAS: {
    CREAR: 'licencias.crear',
    HISTORIAL: 'licencias.historial',
    CALENDARIO: 'licencias.calendario',
  },
  
  // Fundación
  FUNDACION: {
    USUARIOS_FICHA: 'fundacion.usuarios_ficha',
    CAPACITACIONES: 'fundacion.capacitaciones',
  },
  
  // Beneficios Admin
  BENEFICIOS_ADMIN: {
    GESTIONAR: 'beneficios_admin.gestionar',
    ADMINISTRAR: 'beneficios_admin.administrar',
  },
  
  // Sistema
  SISTEMA: {
    USUARIOS: 'sistema.usuarios',
    USER_PROFILE: 'sistema.user_profile',
  },
} as const;

// Tipo para autocompletado y validación
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];

// Helper para obtener todos los permisos como array
export const getAllPermissions = (): Permission[] => {
  return Object.values(PERMISSIONS).flatMap(module => 
    Object.values(module)
  ) as Permission[];
};

// Helper para validar si un permiso existe
export const isValidPermission = (permission: string): permission is Permission => {
  return getAllPermissions().includes(permission as Permission);
};