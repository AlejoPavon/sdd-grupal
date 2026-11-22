import type { EstadoTurno } from "./estado-turno.js";

export interface Turno {
  id: string;
  pacienteId: string;
  profesionalId: string;
  sillonId: string;
  prestacionId: string;
  inicio: Date;
  fin: Date;
  estado: EstadoTurno;
  esSobreturno: boolean;
  notas?: string;
  createdBy: string;
  autorizadoPor?: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
}