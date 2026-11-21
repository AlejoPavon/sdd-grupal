import type { Intervalo } from "../../domain/turno/intervalo.js";
import type { EstadoTurno } from "../../domain/turno/estado-turno.js";
import type { Turno } from "../../domain/turno/turno.js";

export interface FiltrosTurno {
  desde?: Date;
  hasta?: Date;
  profesionalId?: string;
  sillonId?: string;
  estados?: EstadoTurno[];
}

export interface TurnoRepository {
  crear(turno: Turno): Promise<Turno>;
  buscarPorId(id: string): Promise<Turno | undefined>;
  listar(filtros?: FiltrosTurno): Promise<Turno[]>;
  buscarSolapadoPorProfesional(
    profesionalId: string,
    intervalo: Intervalo,
    excluirId?: string,
  ): Promise<Turno[]>;
  buscarSolapadoPorSillon(
    sillonId: string,
    intervalo: Intervalo,
    excluirId?: string,
  ): Promise<Turno[]>;
  actualizar(turno: Turno): Promise<Turno>;
}