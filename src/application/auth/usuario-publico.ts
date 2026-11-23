import type { Rol, Usuario } from "../../domain/usuario/usuario.js";

export interface UsuarioPublico {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Rol;
}

/** Único punto de construcción del DTO público: nunca incluye datos sensibles. */
export function toUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    rol: usuario.rol,
  };
}
