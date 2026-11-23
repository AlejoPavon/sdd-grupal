export interface Sesion {
  token: string;
  usuarioId: string;
  expiresAt: Date;
}

export interface SessionRepository {
  crear(usuarioId: string, ttlMs: number): Promise<Sesion>;
  buscar(token: string): Promise<Sesion | undefined>;
  eliminar(token: string): Promise<void>;
}
