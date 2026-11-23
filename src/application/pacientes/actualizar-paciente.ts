import { RecursoNoEncontradoError } from "../../domain/turno/turno.errors.js";
import { PacienteDuplicadoError } from "../../domain/paciente/paciente.errors.js";
import type { Paciente } from "../../domain/paciente/paciente.js";
import type { PacienteRepository } from "../ports/paciente-repository.js";

export interface ActualizarPacienteInput {
  nombre?: string;
  apellido?: string;
  documento?: string;
  telefono?: string;
  email?: string;
  fechaNacimiento?: Date;
  notas?: string;
  activo?: boolean;
}

export class ActualizarPaciente {
  constructor(private readonly pacientes: PacienteRepository) {}

  async execute(id: string, cambios: ActualizarPacienteInput): Promise<Paciente> {
    const actual = await this.pacientes.buscarPorId(id);
    if (!actual) {
      throw new RecursoNoEncontradoError("paciente", id);
    }

    // Validar duplicados solo para campos enviados y cambiados
    if (cambios.email !== undefined && cambios.email !== actual.email) {
      const existente = await this.pacientes.buscarPorEmailODocumento({ email: cambios.email });
      if (existente && existente.id !== id) {
        throw new PacienteDuplicadoError("email");
      }
    }
    if (cambios.documento !== undefined && cambios.documento !== actual.documento) {
      const existente = await this.pacientes.buscarPorEmailODocumento({ documento: cambios.documento });
      if (existente && existente.id !== id) {
        throw new PacienteDuplicadoError("documento");
      }
    }

    // Reactivación: validar email y documento actuales contra otros activos
    if (cambios.activo === true && !actual.activo) {
      if (actual.email) {
        const existente = await this.pacientes.buscarPorEmailODocumento({ email: actual.email });
        if (existente && existente.id !== id) {
          throw new PacienteDuplicadoError("email");
        }
      }
      if (actual.documento) {
        const existente = await this.pacientes.buscarPorEmailODocumento({ documento: actual.documento });
        if (existente && existente.id !== id) {
          throw new PacienteDuplicadoError("documento");
        }
      }
    }

    const actualizado: Paciente = {
      ...actual,
      ...cambios,
      updatedAt: new Date(),
    };
    return this.pacientes.actualizar(actualizado);
  }
}