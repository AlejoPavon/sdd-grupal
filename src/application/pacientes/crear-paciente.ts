import { randomUUID } from "node:crypto";

import { PacienteDuplicadoError } from "../../domain/paciente/paciente.errors.js";
import type { Paciente } from "../../domain/paciente/paciente.js";
import type { PacienteRepository } from "../ports/paciente-repository.js";

export interface CrearPacienteInput {
  nombre: string;
  apellido: string;
  documento?: string;
  telefono?: string;
  email?: string;
  fechaNacimiento?: Date;
  notas?: string;
}

export class CrearPaciente {
  constructor(private readonly pacientes: PacienteRepository) {}

  async execute(input: CrearPacienteInput): Promise<Paciente> {
    if (input.email) {
      const existente = await this.pacientes.buscarPorEmailODocumento({ email: input.email });
      if (existente) {
        throw new PacienteDuplicadoError("email");
      }
    }
    if (input.documento) {
      const existente = await this.pacientes.buscarPorEmailODocumento({ documento: input.documento });
      if (existente) {
        throw new PacienteDuplicadoError("documento");
      }
    }

    const ahora = new Date();
    const paciente: Paciente = {
      id: randomUUID(),
      nombre: input.nombre,
      apellido: input.apellido,
      documento: input.documento,
      telefono: input.telefono,
      email: input.email,
      fechaNacimiento: input.fechaNacimiento,
      notas: input.notas,
      activo: true,
      createdAt: ahora,
      updatedAt: ahora,
    };
    return this.pacientes.crear(paciente);
  }
}