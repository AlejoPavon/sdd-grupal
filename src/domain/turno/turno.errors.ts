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