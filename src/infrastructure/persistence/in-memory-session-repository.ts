import { randomBytes } from "node:crypto";

import type { Sesion, SessionRepository } from "../../application/ports/session-repository.js";

/** Reloj inyectable para hacer deterministas los tests de expiración. */
export class InMemorySessionRepository implements SessionRepository {
  private readonly sesiones = new Map<string, Sesion>();

  constructor(private readonly reloj: () => Date = () => new Date()) {}

  async crear(usuarioId: string, ttlMs: number): Promise<Sesion> {
    const sesion: Sesion = {
      token: randomBytes(32).toString("base64url"),
      usuarioId,
      expiresAt: new Date(this.reloj().getTime() + ttlMs),
    };
    this.sesiones.set(sesion.token, sesion);
    return this.copiar(sesion);
  }

  async buscar(token: string): Promise<Sesion | undefined> {
    const sesion = this.sesiones.get(token);
    if (!sesion) return undefined;

    if (this.expirada(sesion)) {
      this.sesiones.delete(token);
      return undefined;
    }
    return this.copiar(sesion);
  }

  private expirada(sesion: Sesion): boolean {
    return sesion.expiresAt.getTime() <= this.reloj().getTime();
  }

  async eliminar(token: string): Promise<void> {
    this.sesiones.delete(token);
  }

  private copiar(sesion: Sesion): Sesion {
    return { ...sesion, expiresAt: new Date(sesion.expiresAt) };
  }
}
