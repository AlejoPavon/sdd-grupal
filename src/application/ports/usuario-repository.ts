import type { Usuario } from "../../domain/usuario/usuario.js";

export interface UsuarioRepository {
  crear(usuario: Usuario): Promise<Usuario>;
  buscarPorId(id: string): Promise<Usuario | undefined>;
  listar(): Promise<Usuario[]>;
}