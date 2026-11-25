import { z } from "zod";

/**
 * El "al menos un recurso" se valida en el dominio para devolver
 * `BLOQUEO_RECURSO_REQUERIDO` en lugar de `VALIDACION_FALLIDA`.
 */
export const crearBloqueoSchema = z.object({
  profesionalId: z.uuid().optional(),
  sillonId: z.uuid().optional(),
  inicio: z.iso.datetime(),
  fin: z.iso.datetime(),
  motivo: z.string().min(1),
});

export type CrearBloqueoBody = z.infer<typeof crearBloqueoSchema>;

export const listarBloqueosQuerySchema = z.object({
  desde: z.iso.datetime().optional(),
  hasta: z.iso.datetime().optional(),
});

export type ListarBloqueosQuery = z.infer<typeof listarBloqueosQuerySchema>;

export const idBloqueoParamsSchema = z.object({
  id: z.uuid(),
});
