import { z } from "zod";

export const crearPacienteSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  documento: z.string().optional(),
  telefono: z.string().optional(),
  email: z.email().optional(),
  fechaNacimiento: z.iso.datetime().optional(),
  notas: z.string().optional(),
});

export const actualizarPacienteSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  documento: z.string().optional(),
  telefono: z.string().optional(),
  email: z.email().optional(),
  fechaNacimiento: z.iso.datetime().optional(),
  notas: z.string().optional(),
  activo: z.boolean().optional(),
});

export type CrearPacienteBody = z.infer<typeof crearPacienteSchema>;
export type ActualizarPacienteBody = z.infer<typeof actualizarPacienteSchema>;