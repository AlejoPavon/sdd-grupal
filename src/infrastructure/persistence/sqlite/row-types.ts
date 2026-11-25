import type { EstadoTurno } from "../../../domain/turno/estado-turno.js";
import type { Rol } from "../../../domain/usuario/usuario.js";

/** Forma de las filas devueltas por SQLite (columnas snake_case, fechas en epoch ms). */

export interface TurnoRow {
  id: string;
  paciente_id: string;
  profesional_id: string;
  sillon_id: string;
  prestacion_id: string;
  inicio: number;
  fin: number;
  estado: EstadoTurno;
  es_sobreturno: number;
  notas: string | null;
  created_by: string;
  autorizado_por: string | null;
  created_at: number;
  updated_at: number;
  cancelled_at: number | null;
}

export interface BloqueoRow {
  id: string;
  profesional_id: string | null;
  sillon_id: string | null;
  inicio: number;
  fin: number;
  motivo: string;
  creado_por: string;
  created_at: number;
}

export interface PacienteRow {
  id: string;
  nombre: string;
  apellido: string;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  notas: string | null;
  activo: number;
  created_at: number;
  updated_at: number;
}

export interface PrestacionRow {
  id: string;
  codigo: string;
  nombre: string;
  duracion_minutos: number;
  precio: number | null;
  activo: number;
}

export interface ProfesionalRow {
  id: string;
  nombre: string;
  apellido: string;
  matricula: string;
  especialidades: string;
  activo: number;
}

export interface SillonRow {
  id: string;
  nombre: string;
  sucursal_id: string;
  activo: number;
}

export interface UsuarioRow {
  id: string;
  email: string;
  password_hash: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  profesional_id: string | null;
  activo: number;
}

export interface MigracionRow {
  version: string;
}
