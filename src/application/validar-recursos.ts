import {
  RecursoInactivoError,
  RecursoNoEncontradoError,
  type RecursoConsultable,
} from "../domain/turno/turno.errors.js";

/** Recursos de agenda con los que se valida existencia y estado activo. */
export type RecursoConActivo = Exclude<RecursoConsultable, "turno">;

export interface EntidadActiva {
  activo: boolean;
}

/** Exigencia de existencia; conserva el tipo concreto del repositorio. */
export async function requerirRecurso<T extends EntidadActiva>(
  buscarPorId: (id: string) => Promise<T | undefined>,
  recurso: RecursoConActivo,
  id: string,
): Promise<T> {
  const entidad = await buscarPorId(id);
  if (!entidad) throw new RecursoNoEncontradoError(recurso, id);
  return entidad;
}

/** Exigencia de estado activo, separada para preservar el orden de validaciones. */
export function validarRecursoActivo<T extends EntidadActiva>(
  recurso: RecursoConActivo,
  id: string,
  entidad: T,
): void {
  if (!entidad.activo) throw new RecursoInactivoError(recurso, id);
}
