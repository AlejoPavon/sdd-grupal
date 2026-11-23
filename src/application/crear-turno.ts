import { randomUUID } from "node:crypto";

import { Intervalo } from "../domain/turno/intervalo.js";
import {
  RecursoInactivoError,
  RecursoNoEncontradoError,
  TurnoSolapadoError,
} from "../domain/turno/turno.errors.js";
import type { Turno } from "../domain/turno/turno.js";
import type { Repositorios } from "./ports/repositorios.js";

export interface CrearTurnoInput {
  pacienteId: string;
  profesionalId: string;
  sillonId: string;
  prestacionId: string;
  inicio: Date;
  creadoPor: string;
}

export class CrearTurno {
  constructor(private readonly repos: Repositorios) {}

  async execute(input: CrearTurnoInput): Promise<Turno> {
    const paciente = await this.repos.pacientes.buscarPorId(input.pacienteId);
    if (!paciente) {
      throw new RecursoNoEncontradoError("paciente", input.pacienteId);
    }
    if (!paciente.activo) {
      throw new RecursoInactivoError("paciente", input.pacienteId);
    }

    const profesional = await this.repos.profesionales.buscarPorId(input.profesionalId);
    if (!profesional) {
      throw new RecursoNoEncontradoError("profesional", input.profesionalId);
    }

    const sillon = await this.repos.sillones.buscarPorId(input.sillonId);
    if (!sillon) {
      throw new RecursoNoEncontradoError("sillon", input.sillonId);
    }

    const prestacion = await this.repos.prestaciones.buscarPorId(input.prestacionId);
    if (!prestacion) {
      throw new RecursoNoEncontradoError("prestacion", input.prestacionId);
    }

    if (!profesional.activo) {
      throw new RecursoInactivoError("profesional", input.profesionalId);
    }
    if (!sillon.activo) {
      throw new RecursoInactivoError("sillon", input.sillonId);
    }
    if (!prestacion.activo) {
      throw new RecursoInactivoError("prestacion", input.prestacionId);
    }

    const intervalo = Intervalo.desdeInicioDuracion(input.inicio, prestacion.duracionMinutos);

    const solapadosProfesional =
      await this.repos.turnos.buscarSolapadoPorProfesional(input.profesionalId, intervalo);
    if (solapadosProfesional.length > 0) {
      throw new TurnoSolapadoError("profesional", solapadosProfesional[0]!);
    }

    const solapadosSillon = await this.repos.turnos.buscarSolapadoPorSillon(
      input.sillonId,
      intervalo,
    );
    if (solapadosSillon.length > 0) {
      throw new TurnoSolapadoError("sillon", solapadosSillon[0]!);
    }

    const ahora = new Date();
    const turno: Turno = {
      id: randomUUID(),
      pacienteId: input.pacienteId,
      profesionalId: input.profesionalId,
      sillonId: input.sillonId,
      prestacionId: input.prestacionId,
      inicio: intervalo.inicio,
      fin: intervalo.fin,
      estado: "pendiente",
      esSobreturno: false,
      createdBy: input.creadoPor,
      createdAt: ahora,
      updatedAt: ahora,
    };

    return this.repos.turnos.crear(turno);
  }
}