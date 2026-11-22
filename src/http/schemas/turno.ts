import { z } from "zod";

export const crearTurnoSchema = z.object({
  pacienteId: z.string().uuid(),
  profesionalId: z.string().uuid(),
  sillonId: z.string().uuid(),
  prestacionId: z.string().uuid(),
  inicio: z.string().datetime(),
});

export type CrearTurnoBody = z.infer<typeof crearTurnoSchema>;