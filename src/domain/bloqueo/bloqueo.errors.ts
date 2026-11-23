import { DominioError } from "../errors/dominio-error.js";
import type { Bloqueo } from "./bloqueo.js";

/** El bloqueo debe reservar al menos un profesional o un sillón. */
export class BloqueoRecursoRequeridoError extends DominioError {
  readonly code = "BLOQUEO_RECURSO_REQUERIDO";

  constructor() {
    super("El bloqueo debe indicar al menos un profesional o un sillón");
  }
}

/** El intervalo del bloqueo debe ser válido y semiabierto [inicio, fin). */
export class BloqueoIntervaloInvalidoError extends DominioError {
  readonly code = "BLOQUEO_INTERVALO_INVALIDO";

  constructor(message = "El bloqueo requiere un inicio y un fin válidos con fin posterior al inicio") {
    super(message);
  }
}

/** El bloqueo solicitado no existe (borrado físico). */
export class BloqueoNoEncontradoError extends DominioError {
  readonly code = "BLOQUEO_NO_ENCONTRADO";

  constructor(readonly id: string) {
    super(`No se encontró bloqueo con id ${id}`);
  }
}

/** Conflicto entre el turno nuevo y un bloqueo vigente. */
export class TurnoBloqueadoError extends DominioError {
  readonly code = "TURNO_BLOQUEADO";

  constructor(readonly bloqueo: Bloqueo) {
    super("El turno se superpone con un bloqueo de la agenda", {
      bloqueo: { id: bloqueo.id, inicio: bloqueo.inicio, fin: bloqueo.fin },
    });
  }
}

/** El motivo del bloqueo no puede estar vacío. */
export class BloqueoMotivoRequeridoError extends DominioError {
  readonly code = "BLOQUEO_MOTIVO_REQUERIDO";

  constructor() {
    super("El motivo del bloqueo no puede estar vacío");
  }
}
