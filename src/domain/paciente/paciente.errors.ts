import { DominioError } from "../turno/turno.errors.js";

export type CampoDuplicado = "email" | "documento";

export class PacienteDuplicadoError extends DominioError {
  readonly code = "PACIENTE_DUPLICADO";

  constructor(readonly campo: CampoDuplicado) {
    super(`Ya existe un paciente activo con el mismo ${campo}`);
  }
}