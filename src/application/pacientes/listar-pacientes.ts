import { RecursoNoEncontradoError } from "../../domain/turno/turno.errors.js";
import type { Paciente } from "../../domain/paciente/paciente.js";
import type { PacienteRepository } from "../ports/paciente-repository.js";

export class ListarPacientes {
  constructor(private readonly pacientes: PacienteRepository) {}

  async execute(q?: string): Promise<Paciente[]> {
    return this.pacientes.listar(q);
  }
}

export class ObtenerPaciente {
  constructor(private readonly pacientes: PacienteRepository) {}

  async execute(id: string): Promise<Paciente> {
    const paciente = await this.pacientes.buscarPorId(id);
    if (!paciente) {
      throw new RecursoNoEncontradoError("paciente", id);
    }
    return paciente;
  }
}