import { z } from "zod";

const documento = z
  .string()
  .regex(/^\d{8}$/, "El documento debe tener exactamente 8 números (solo dígitos)");

const telefono = z
  .string()
  .regex(/^\d{10}$/, "El teléfono debe tener exactamente 10 números (solo dígitos)");

export const crearPacienteSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  documento: documento.optional(),
  telefono: telefono.optional(),
  email: z.email().optional(),
  fechaNacimiento: z.iso.datetime().optional(),
  notas: z.string().optional(),
});

export const actualizarPacienteSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  documento: documento.optional(),
  telefono: telefono.optional(),
  email: z.email().optional(),
  fechaNacimiento: z.iso.datetime().optional(),
  notas: z.string().optional(),
  activo: z.boolean().optional(),
});

export type CrearPacienteBody = z.infer<typeof crearPacienteSchema>;
export type ActualizarPacienteBody = z.infer<typeof actualizarPacienteSchema>;