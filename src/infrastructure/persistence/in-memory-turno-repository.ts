import type {
  FiltrosTurno,
  TurnoRepository,
} from "../../application/ports/turno-repository.js";
import { ocupaAgenda } from "../../domain/turno/estado-turno.js";
import { Intervalo } from "../../domain/turno/intervalo.js";
import type { Turno } from "../../domain/turno/turno.js";
import { RecursoNoEncontradoError } from "../../domain/turno/turno.errors.js";

export class InMemoryTurnoRepository implements TurnoRepository {
  private readonly turnos = new Map<string, Turno>();

  async crear(turno: Turno): Promise<Turno> {
    this.turnos.set(turno.id, { ...turno });
    return { ...turno };
  }

  async buscarPorId(id: string): Promise<Turno | undefined> {
    const turno = this.turnos.get(id);
    return turno ? { ...turno } : undefined;
  }

  async listar(filtros: FiltrosTurno = {}): Promise<Turno[]> {
    return [...this.turnos.values()]
      .filter((t) => !filtros.desde || t.fin > filtros.desde)
      .filter((t) => !filtros.hasta || t.inicio < filtros.hasta)
      .filter((t) => !filtros.profesionalId || t.profesionalId === filtros.profesionalId)
      .filter((t) => !filtros.sillonId || t.sillonId === filtros.sillonId)
      .filter((t) => !filtros.estados || filtros.estados.includes(t.estado))
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
      .map((t) => ({ ...t }));
  }

  async buscarSolapadoPorProfesional(
    profesionalId: string,
    intervalo: Intervalo,
    excluirId?: string,
  ): Promise<Turno[]> {
    return this.buscarSolapados((t) => t.profesionalId === profesionalId, intervalo, excluirId);
  }

  async buscarSolapadoPorSillon(
    sillonId: string,
    intervalo: Intervalo,
    excluirId?: string,
  ): Promise<Turno[]> {
    return this.buscarSolapados((t) => t.sillonId === sillonId, intervalo, excluirId);
  }

  async actualizar(turno: Turno): Promise<Turno> {
    if (!this.turnos.has(turno.id)) {
      throw new RecursoNoEncontradoError("turno", turno.id);
    }
    this.turnos.set(turno.id, { ...turno });
    return { ...turno };
  }

  private buscarSolapados(
    mismoRecurso: (turno: Turno) => boolean,
    intervalo: Intervalo,
    excluirId?: string,
  ): Turno[] {
    return [...this.turnos.values()]
      .filter(mismoRecurso)
      .filter((t) => t.id !== excluirId)
      .filter((t) => ocupaAgenda(t.estado))
      .filter((t) => new Intervalo(t.inicio, t.fin).seSuperponeCon(intervalo))
      .map((t) => ({ ...t }));
  }
}