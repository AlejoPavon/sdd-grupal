import type { Turno } from "./turno.js";

export abstract class DominioError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class IntervaloInvalidoError extends DominioError {
  readonly code = "TURNO_INTERVALO_INVALIDO";
}

export type RecursoSolapado = "profesional" | "sillon";

export class TurnoSolapadoError extends DominioError {
  readonly code: "TURNO_SOLAPADO_PROFESIONAL" | "TURNO_SOLAPADO_SILLON";

  constructor(
    readonly recurso: RecursoSolapado,
    readonly turnoEnConflicto: Turno,
  ) {
    super(
      recurso === "profesional"
        ? "El profesional ya tiene un turno en ese horario"
        : "El sillón ya tiene un turno en ese horario",
    );
    this.code =
      recurso === "profesional" ? "TURNO_SOLAPADO_PROFESIONAL" : "TURNO_SOLAPADO_SILLON";
  }
}

export type RecursoConsultable = "paciente" | "profesional" | "sillon" | "prestacion" | "turno";

const CODIGOS_NO_ENCONTRADO: Record<RecursoConsultable, string> = {
  paciente: "PACIENTE_NO_ENCONTRADO",
  profesional: "PROFESIONAL_NO_ENCONTRADO",
  sillon: "SILLON_NO_ENCONTRADO",
  prestacion: "PRESTACION_NO_ENCONTRADA",
  turno: "TURNO_NO_ENCONTRADO",
};

export class RecursoNoEncontradoError extends DominioError {
  readonly code: string;

  constructor(
    readonly recurso: RecursoConsultable,
    readonly id: string,
  ) {
    super(`No se encontró ${recurso} con id ${id}`);
    this.code = CODIGOS_NO_ENCONTRADO[recurso];
  }
}

export class RecursoInactivoError extends DominioError {
  readonly code = "RECURSO_INACTIVO";

  constructor(
    readonly recurso: RecursoConsultable,
    readonly id: string,
  ) {
    super(`El recurso ${recurso} con id ${id} está inactivo`);
  }
}

export class TransicionInvalidaError extends DominioError {
  readonly code = "TRANSICION_INVALIDA";

  constructor(
    readonly desde: string,
    readonly hacia: string,
  ) {
    super(`No se puede pasar un turno de ${desde} a ${hacia}`);
  }
}

export class RangoInvalidoError extends DominioError {
  readonly code = "RANGO_INVALIDO";
  constructor() {
    super("El rango de consulta es inválido: 'desde' debe ser menor que 'hasta'");
  }
}