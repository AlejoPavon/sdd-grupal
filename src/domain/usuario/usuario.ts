export type Rol = "administrador" | "recepcionista" | "profesional";

export interface Usuario {
  id: string;
  email: string;
  passwordHash: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  activo: boolean;
}