import { z } from "zod";

export const crearTurnoSchema = z.object({
  pacienteId: z.uuid(),
  profesionalId: z.uuid(),
  sillonId: z.uuid(),
  prestacionId: z.uuid(),
  inicio: z.iso.datetime(),
  forzar: z.boolean().optional(),
  // Opcional: ausente o `false` conservan las validaciones de C-07; `true` activa
  // las omisiones controladas de sobreturno en CrearTurno (nunca sobre el sillón).
  esSobreturno: z.boolean().optional(),
});

export type CrearTurnoBody = z.infer<typeof crearTurnoSchema>;

export const turnoQuerySchema = z.object({
  desde: z.iso.datetime().optional(),
  hasta: z.iso.datetime().optional(),
  profesionalId: z.uuid().optional(),
  sillonId: z.uuid().optional(),
  pacienteId: z.uuid().optional(),
});

export type TurnoQuery = z.infer<typeof turnoQuerySchema>;