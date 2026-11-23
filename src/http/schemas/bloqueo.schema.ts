import { z } from "zod";

/**
 * El "al menos un recurso" se valida en el dominio para devolver
 * `BLOQUEO_RECURSO_REQUERIDO` en lugar de `VALIDACION_FALLIDA`.
 */
export const crearBloqueoSchema = z.object({
  profesionalId: z.string().uuid().optional(),
  sillonId: z.string().uuid().optional(),
  inicio: z.string().datetime(),
  fin: z.string().datetime(),
  motivo: z.string().min(1),
});

export type CrearBloqueoBody = z.infer<typeof crearBloqueoSchema>;

export const listarBloqueosQuerySchema = z.object({
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional(),
});

export type ListarBloqueosQuery = z.infer<typeof listarBloqueosQuerySchema>;

export const idBloqueoParamsSchema = z.object({
  id: z.string().uuid(),
});
