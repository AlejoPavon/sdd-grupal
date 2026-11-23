import { randomUUID } from "node:crypto";

import { crearBloqueo, type Bloqueo } from "../../domain/bloqueo/bloqueo.js";
import { requerirRecurso, validarRecursoActivo } from "../validar-recursos.js";
import type { Repositorios } from "../ports/repositorios.js";

export interface CrearBloqueoInput {
  profesionalId?: string;
  sillonId?: string;
  inicio: Date;
  fin: Date;
  motivo: string;
  creadoPor: string;
}

export class CrearBloqueo {
  constructor(private readonly repos: Repositorios) {}

  async execute(input: CrearBloqueoInput): Promise<Bloqueo> {
    const bloqueo = crearBloqueo({
      ...input,
      id: randomUUID(),
      createdAt: new Date(),
    });

    if (input.profesionalId) {
      const profesional = await requerirRecurso(
        (id) => this.repos.profesionales.buscarPorId(id),
        "profesional",
        input.profesionalId,
      );
      validarRecursoActivo("profesional", input.profesionalId, profesional);
    }

    if (input.sillonId) {
      const sillon = await requerirRecurso(
        (id) => this.repos.sillones.buscarPorId(id),
        "sillon",
        input.sillonId,
      );
      validarRecursoActivo("sillon", input.sillonId, sillon);
    }

    return this.repos.bloqueos.crear(bloqueo);
  }
}
