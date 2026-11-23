import type { TurnoRepository } from "./ports/turno-repository.js";
import type { Repositorios } from "./ports/repositorios.js";
import type { Turno } from "../domain/turno/turno.js";
import { puedeTransicionarA } from "../domain/turno/estado-turno.js";
import {
  RecursoNoEncontradoError,
  TransicionInvalidaError,
} from "../domain/turno/turno.errors.js";

export class CancelarTurno {
  private readonly turnos: TurnoRepository;

  constructor(...args: unknown[]) {
    const arg = args[0] as { turnos?: TurnoRepository; buscarPorId?: unknown } | undefined;
    // Preferir detección por capacidad (buscarPorId) para evitar colisión con el
    // campo privado `turnos` de InMemoryTurnoRepository.
    if (arg && typeof arg.buscarPorId === "function") {
      this.turnos = arg as unknown as TurnoRepository;
    } else if (arg && arg.turnos && typeof arg.turnos.buscarPorId === "function") {
      this.turnos = arg.turnos;
    } else {
      this.turnos = arg as unknown as TurnoRepository;
    }
  }

  async execute(...args: unknown[]): Promise<Turno> {
    let id: string;
    if (
      args.length === 1 &&
      args[0] &&
      typeof args[0] === "object" &&
      "id" in (args[0] as Record<string, unknown>)
    ) {
      id = (args[0] as { id: string }).id;
    } else {
      id = args[0] as string;
    }

    const turno = await this.turnos.buscarPorId(id);
    if (!turno) {
      throw new RecursoNoEncontradoError("turno", id);
    }

    // Idempotencia: si ya está cancelado, se devuelve sin persistir (RN-EX-03).
    if (turno.estado === "cancelado") {
      return turno;
    }

    if (!puedeTransicionarA(turno.estado, "cancelado")) {
      throw new TransicionInvalidaError(turno.estado, "cancelado");
    }

    const ahora = new Date();
    const actualizado: Turno = {
      ...turno,
      estado: "cancelado",
      cancelledAt: ahora,
      updatedAt: ahora,
    };

    return this.turnos.actualizar(actualizado);
  }
}