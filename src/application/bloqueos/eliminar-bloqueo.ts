import { BloqueoNoEncontradoError } from "../../domain/bloqueo/bloqueo.errors.js";
import type { Repositorios } from "../ports/repositorios.js";

export class EliminarBloqueo {
  constructor(private readonly repos: Repositorios) {}

  async execute(id: string): Promise<void> {
    const bloqueo = await this.repos.bloqueos.buscarPorId(id);
    if (!bloqueo) throw new BloqueoNoEncontradoError(id);

    await this.repos.bloqueos.eliminar(id);
  }
}
