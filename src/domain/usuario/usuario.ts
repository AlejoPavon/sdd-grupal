export type Rol = "administrador" | "recepcionista" | "profesional";

export interface Usuario {
  id: string;
  email: string;
  passwordHash: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  activo: boolean;
  profesionalId?: string;
}

/** Identidad mínima adjunta a la request por el hook de autenticación. */
export interface UsuarioAutenticado {
  id: string;
  email: string;
  rol: Rol;
  profesionalId?: string;
}
