import type { UsuarioRepository } from "../../application/ports/usuario-repository.js";
import type { Usuario } from "../../domain/usuario/usuario.js";
import { InMemoryRepositoryBase } from "./in-memory-repository-base.js";

export class InMemoryUsuarioRepository
  extends InMemoryRepositoryBase<Usuario>
  implements UsuarioRepository {}