import { RecursoNoEncontradoError } from "../../domain/turno/turno.errors.js";
import type { Paciente } from "../../domain/paciente/paciente.js";
import type { PacienteRepository } from "../ports/paciente-repository.js";

export class DesactivarPaciente {
  constructor(private readonly pacientes: PacienteRepository) {}

  async execute(id: string): Promise<Paciente> {
    const actual = await this.pacientes.buscarPorId(id);
    if (!actual) {
      throw new RecursoNoEncontradoError("paciente", id);
    }
    const actualizado: Paciente = {
      ...actual,
      activo: false,
      updatedAt: new Date(),
    };
    return this.pacientes.actualizar(actualizado);
  }
}