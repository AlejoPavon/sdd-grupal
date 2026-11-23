import { z } from "zod";

export const crearTurnoSchema = z.object({
  pacienteId: z.string().uuid(),
  profesionalId: z.string().uuid(),
  sillonId: z.string().uuid(),
  prestacionId: z.string().uuid(),
  inicio: z.string().datetime(),
  forzar: z.boolean().optional(),
  // Opcional: ausente o `false` conservan las validaciones de C-07; `true` activa
  // las omisiones controladas de sobreturno en CrearTurno (nunca sobre el sillón).
  esSobreturno: z.boolean().optional(),
});

export type CrearTurnoBody = z.infer<typeof crearTurnoSchema>;

export const turnoQuerySchema = z.object({
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional(),
  profesionalId: z.string().uuid().optional(),
  sillonId: z.string().uuid().optional(),
});

export type TurnoQuery = z.infer<typeof turnoQuerySchema>;