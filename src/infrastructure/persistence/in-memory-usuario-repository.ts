import type { UsuarioRepository } from "../../application/ports/usuario-repository.js";
import type { Usuario } from "../../domain/usuario/usuario.js";
import { InMemoryRepositoryBase } from "./in-memory-repository-base.js";

export class InMemoryUsuarioRepository
  extends InMemoryRepositoryBase<Usuario>
  implements UsuarioRepository
{
  async buscarPorEmail(email: string): Promise<Usuario | undefined> {
    const normalizado = email.trim().toLowerCase();
    return (await this.listar()).find(
      (usuario) => usuario.email.trim().toLowerCase() === normalizado,
    );
  }
}
