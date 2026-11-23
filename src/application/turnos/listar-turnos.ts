import type { PacienteRepository } from "../ports/paciente-repository.js";
import type { PrestacionRepository } from "../ports/prestacion-repository.js";
import type { TurnoRepository } from "../ports/turno-repository.js";
import type { Repositorios } from "../ports/repositorios.js";
import type { Turno } from "../../domain/turno/turno.js";
import { RecursoNoEncontradoError, RangoInvalidoError } from "../../domain/turno/turno.errors.js";

export interface TurnoEnriquecido extends Turno {
  paciente?: { id: string; nombre: string; apellido: string };
  prestacion?: { id: string; codigo: string; nombre: string; duracionMinutos: number };
}

export interface ListarTurnosFiltros {
  desde?: Date | string;
  hasta?: Date | string;
  profesionalId?: string;
  sillonId?: string;
}

function toDate(v: Date | string | undefined): Date | undefined {
  if (v === undefined || v === null) return undefined;
  return v instanceof Date ? v : new Date(v);
}

type Repos = {
  turnos: TurnoRepository;
  pacientes: PacienteRepository;
  prestaciones: PrestacionRepository;
};

function normalizarRepos(arg: unknown, a?: unknown, b?: unknown): Repos {
  if (arg && typeof arg === "object" && "turnos" in (arg as Record<string, unknown>)) {
    const r = arg as Repositorios | (Repos & Record<string, unknown>);
    return {
      turnos: r.turnos,
      pacientes: r.pacientes,
      prestaciones: r.prestaciones,
    };
  }
  if (a !== undefined && b !== undefined) {
    return {
      turnos: arg as TurnoRepository,
      pacientes: a as PacienteRepository,
      prestaciones: b as PrestacionRepository,
    };
  }
  // fallback: try positional repos as objects
  return {
    turnos: (arg as Repos).turnos,
    pacientes: (arg as Repos).pacientes,
    prestaciones: (arg as Repos).prestaciones,
  };
}

export class ListarTurnos {
  private readonly repos: Repos;

  constructor(...args: unknown[]) {
    this.repos = normalizarRepos(args[0], args[1], args[2]);
  }

  async execute(...args: unknown[]): Promise<TurnoEnriquecido[]> {
    let filtros: ListarTurnosFiltros = {};
    if (args.length === 1 && args[0] && typeof args[0] === "object" && !(args[0] instanceof Date)) {
      filtros = args[0] as ListarTurnosFiltros;
    } else if (args.length > 1) {
      filtros = {
        desde: args[0] as Date | string,
        hasta: args[1] as Date | string,
        profesionalId: args[2] as string | undefined,
        sillonId: args[3] as string | undefined,
      };
    } else if (args.length === 1 && args[0] !== undefined) {
      // single non-object positional? treat as desde? unlikely; keep as filtros? 
      filtros = {};
    }

    const desde = toDate(filtros.desde);
    const hasta = toDate(filtros.hasta);

    if (desde && hasta && desde.getTime() >= hasta.getTime()) {
      throw new RangoInvalidoError();
    }

    const turnos = await this.repos.turnos.listar({
      desde,
      hasta,
      profesionalId: filtros.profesionalId,
      sillonId: filtros.sillonId,
      estados: ["pendiente", "confirmado"],
    });

    const result: TurnoEnriquecido[] = [];
    for (const t of turnos) {
      const paciente = await this.repos.pacientes.buscarPorId(t.pacienteId);
      const prestacion = await this.repos.prestaciones.buscarPorId(t.prestacionId);
      const item: TurnoEnriquecido = { ...t };
      if (paciente) {
        item.paciente = { id: paciente.id, nombre: paciente.nombre, apellido: paciente.apellido };
      }
      if (prestacion) {
        item.prestacion = {
          id: prestacion.id,
          codigo: prestacion.codigo,
          nombre: prestacion.nombre,
          duracionMinutos: prestacion.duracionMinutos,
        };
      }
      result.push(item);
    }
    return result;
  }
}

export class ObtenerTurno {
  private readonly turnos: TurnoRepository;

  constructor(...args: unknown[]) {
    const arg = args[0];
    if (arg && typeof arg === "object" && "turnos" in (arg as Record<string, unknown>)) {
      this.turnos = (arg as Repositorios).turnos;
    } else {
      this.turnos = arg as TurnoRepository;
    }
  }

  async execute(...args: unknown[]): Promise<Turno> {
    let id: string;
    if (args.length === 1 && args[0] && typeof args[0] === "object" && "id" in (args[0] as Record<string, unknown>)) {
      id = (args[0] as { id: string }).id;
    } else {
      id = args[0] as string;
    }
    const turno = await this.turnos.buscarPorId(id);
    if (!turno) {
      throw new RecursoNoEncontradoError("turno", id);
    }
    return turno;
  }
}