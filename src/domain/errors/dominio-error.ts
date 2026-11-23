/** Error base de dominio, con shape estable para el borde HTTP. */
export abstract class DominioError extends Error {
  abstract readonly code: string;

  readonly details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}
