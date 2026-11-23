import type { Intervalo } from "../../domain/turno/intervalo.js";
import type { Bloqueo } from "../../domain/bloqueo/bloqueo.js";

export interface FiltrosBloqueo {
  desde?: Date;
  hasta?: Date;
  profesionalId?: string;
  sillonId?: string;
}

export interface BloqueoRepository {
  crear(bloqueo: Bloqueo): Promise<Bloqueo>;
  buscarPorId(id: string): Promise<Bloqueo | undefined>;
  listar(filtros?: FiltrosBloqueo): Promise<Bloqueo[]>;
  buscarSolapadoPorProfesional(profesionalId: string, intervalo: Intervalo): Promise<Bloqueo[]>;
  buscarSolapadoPorSillon(sillonId: string, intervalo: Intervalo): Promise<Bloqueo[]>;
  eliminar(id: string): Promise<void>;
}
