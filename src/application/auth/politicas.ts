import { SinPermisoError } from "../../domain/usuario/usuario.errors.js";
import type { UsuarioAutenticado } from "../../domain/usuario/usuario.js";
import type { Turno } from "../../domain/turno/turno.js";

type ReferenciaTurno = Pick<Turno, "pacienteId" | "profesionalId" | "estado">;

export function esProfesional(usuario: UsuarioAutenticado): boolean {
  return usuario.rol === "profesional";
}

export function profesionalIdRequerido(usuario: UsuarioAutenticado): string {
  if (!esProfesional(usuario) || !usuario.profesionalId) {
    throw new SinPermisoError();
  }
  return usuario.profesionalId;
}

export function puedeVerTurno(usuario: UsuarioAutenticado, turno: ReferenciaTurno): boolean {
  if (!esProfesional(usuario)) return true;
  return Boolean(usuario.profesionalId && usuario.profesionalId === turno.profesionalId);
}

export function puedeVerPaciente(
  usuario: UsuarioAutenticado,
  pacienteId: string,
  turnos: ReferenciaTurno[],
): boolean {
  if (!esProfesional(usuario)) return true;
  const profesionalId = usuario.profesionalId;
  if (!profesionalId) return false;
  return turnos.some(
    (turno) => turno.pacienteId === pacienteId && turno.profesionalId === profesionalId,
  );
}

export function filtrarPacientesVisibles<T extends { id: string }>(
  usuario: UsuarioAutenticado,
  pacientes: T[],
  turnos: ReferenciaTurno[],
): T[] {
  if (!esProfesional(usuario)) return pacientes;
  const profesionalId = usuario.profesionalId;
  if (!profesionalId) return [];

  const visibles = new Set(
    turnos.filter((turno) => turno.profesionalId === profesionalId).map((turno) => turno.pacienteId),
  );
  return pacientes.filter((paciente) => visibles.has(paciente.id));
}
