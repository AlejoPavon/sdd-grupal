import type { BloqueoRepository, FiltrosBloqueo } from "../../application/ports/bloqueo-repository.js";
import { bloqueoSeSuperponeConIntervalo, type Bloqueo } from "../../domain/bloqueo/bloqueo.js";
import type { Intervalo } from "../../domain/turno/intervalo.js";

export class InMemoryBloqueoRepository implements BloqueoRepository {
  private readonly bloqueos = new Map<string, Bloqueo>();

  async crear(bloqueo: Bloqueo): Promise<Bloqueo> {
    this.bloqueos.set(bloqueo.id, { ...bloqueo });
    return { ...bloqueo };
  }

  async buscarPorId(id: string): Promise<Bloqueo | undefined> {
    const bloqueo = this.bloqueos.get(id);
    return bloqueo ? { ...bloqueo } : undefined;
  }

  async listar(filtros: FiltrosBloqueo = {}): Promise<Bloqueo[]> {
    return [...this.bloqueos.values()]
      .filter((b) => !filtros.desde || b.fin > filtros.desde)
      .filter((b) => !filtros.hasta || b.inicio < filtros.hasta)
      .filter((b) => !filtros.profesionalId || b.profesionalId === filtros.profesionalId)
      .filter((b) => !filtros.sillonId || b.sillonId === filtros.sillonId)
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
      .map((b) => ({ ...b }));
  }

  async buscarSolapadoPorProfesional(profesionalId: string, intervalo: Intervalo): Promise<Bloqueo[]> {
    return this.buscarSolapados((b) => b.profesionalId === profesionalId, intervalo);
  }

  async buscarSolapadoPorSillon(sillonId: string, intervalo: Intervalo): Promise<Bloqueo[]> {
    return this.buscarSolapados((b) => b.sillonId === sillonId, intervalo);
  }

  async eliminar(id: string): Promise<void> {
    this.bloqueos.delete(id);
  }

  private buscarSolapados(mismoRecurso: (bloqueo: Bloqueo) => boolean, intervalo: Intervalo): Bloqueo[] {
    return [...this.bloqueos.values()]
      .filter(mismoRecurso)
      .filter((b) => bloqueoSeSuperponeConIntervalo(b, intervalo))
      .map((b) => ({ ...b }));
  }
}
