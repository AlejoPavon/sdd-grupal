import type { SessionRepository } from "../ports/session-repository.js";

/** Eliminar una sesión inexistente no es error: logout es idempotente. */
export class Logout {
  constructor(private readonly sesiones: SessionRepository) {}

  async execute(token: string): Promise<void> {
    await this.sesiones.eliminar(token);
  }
}
