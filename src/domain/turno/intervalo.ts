import { IntervaloInvalidoError } from "./turno.errors.js";

export class Intervalo {
  constructor(
    readonly inicio: Date,
    readonly fin: Date,
  ) {
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      throw new IntervaloInvalidoError("El intervalo tiene una fecha inválida");
    }
    if (fin.getTime() <= inicio.getTime()) {
      throw new IntervaloInvalidoError("El fin debe ser posterior al inicio");
    }
  }

  seSuperponeCon(otro: Intervalo): boolean {
    return this.inicio < otro.fin && this.fin > otro.inicio;
  }

  duracionMinutos(): number {
    return (this.fin.getTime() - this.inicio.getTime()) / 60_000;
  }

  static desdeInicioDuracion(inicio: Date, minutos: number): Intervalo {
    return new Intervalo(inicio, new Date(inicio.getTime() + minutos * 60_000));
  }
}