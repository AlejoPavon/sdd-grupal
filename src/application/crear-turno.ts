import { randomUUID } from "node:crypto";

import { TurnoBloqueadoError } from "../domain/bloqueo/bloqueo.errors.js";
import { Intervalo } from "../domain/turno/intervalo.js";
import { TurnoSolapadoError } from "../domain/turno/turno.errors.js";
import type { Turno } from "../domain/turno/turno.js";
import type { Repositorios } from "./ports/repositorios.js";
import { requerirRecurso, validarRecursoActivo } from "./validar-recursos.js";

export interface CrearTurnoInput {
  pacienteId: string;
  profesionalId: string;
  sillonId: string;
  prestacionId: string;
  inicio: Date;
  creadoPor: string;
  forzar?: boolean;
  autorizadoPor?: string;
  esSobreturno?: boolean;
}

interface Omisiones {
  solapamientoProfesional: boolean;
  busquedaBloqueoProfesional: boolean;
  bloqueo: boolean;
}

/**
 * Decisiones puras de las dos excepciones. `esSobreturno` relaja solo la agenda
 * del profesional; `forzar` relaja los bloqueos (incluido el del sillón) pero
 * nunca un solapamiento de sillón. No se busca un bloqueo cuya regla ya se omitió.
 */
function omisionesPara(input: Pick<CrearTurnoInput, "esSobreturno" | "forzar">): Omisiones {
  const sobreturno = input.esSobreturno === true;
  const forzar = input.forzar === true;
  return {
    solapamientoProfesional: sobreturno,
    busquedaBloqueoProfesional: sobreturno,
    bloqueo: forzar,
  };
}

export class CrearTurno {
  constructor(private readonly repos: Repositorios) {}

  async execute(input: CrearTurnoInput): Promise<Turno> {
    const esSobreturno = input.esSobreturno === true;
    const omisiones = omisionesPara(input);

    // Único orden de validaciones (heredado de C-03/C-07 y preservado por C-08):
    // 1) existencia y estado de los cuatro recursos; 2) solapamiento profesional
    // (omitido por esSobreturno); 3) solapamiento del sillón (nunca omitido);
    // 4) bloqueo profesional (omitido por esSobreturno); 5) bloqueo del sillón
    // (omitido solo por forzar); 6) persistencia. Intervalo semiabierto [inicio, fin).
    const paciente = await requerirRecurso(
      (id) => this.repos.pacientes.buscarPorId(id),
      "paciente",
      input.pacienteId,
    );
    validarRecursoActivo("paciente", input.pacienteId, paciente);

    const profesional = await requerirRecurso(
      (id) => this.repos.profesionales.buscarPorId(id),
      "profesional",
      input.profesionalId,
    );

    const sillon = await requerirRecurso(
      (id) => this.repos.sillones.buscarPorId(id),
      "sillon",
      input.sillonId,
    );

    const prestacion = await requerirRecurso(
      (id) => this.repos.prestaciones.buscarPorId(id),
      "prestacion",
      input.prestacionId,
    );

    validarRecursoActivo("profesional", input.profesionalId, profesional);
    validarRecursoActivo("sillon", input.sillonId, sillon);
    validarRecursoActivo("prestacion", input.prestacionId, prestacion);

    const intervalo = Intervalo.desdeInicioDuracion(input.inicio, prestacion.duracionMinutos);

    const solapadosProfesional = omisiones.solapamientoProfesional
      ? []
      : await this.repos.turnos.buscarSolapadoPorProfesional(input.profesionalId, intervalo);
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

    const bloqueosProfesional = omisiones.busquedaBloqueoProfesional
      ? []
      : await this.repos.bloqueos.buscarSolapadoPorProfesional(input.profesionalId, intervalo);
    const bloqueosSillon = await this.repos.bloqueos.buscarSolapadoPorSillon(input.sillonId, intervalo);
    const bloqueoEnConflicto = bloqueosProfesional[0] ?? bloqueosSillon[0];

    if (bloqueoEnConflicto && !omisiones.bloqueo) {
      throw new TurnoBloqueadoError(bloqueoEnConflicto);
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
      esSobreturno,
      createdBy: input.creadoPor,
      ...(esSobreturno || bloqueoEnConflicto ? { autorizadoPor: input.autorizadoPor } : {}),
      createdAt: ahora,
      updatedAt: ahora,
    };

    return this.repos.turnos.crear(turno);
  }
}