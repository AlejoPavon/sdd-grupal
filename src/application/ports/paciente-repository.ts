import type { Paciente } from "../../domain/paciente/paciente.js";

export interface PacienteRepository {
  crear(paciente: Paciente): Promise<Paciente>;
  buscarPorId(id: string): Promise<Paciente | undefined>;
  buscarActivoPorId(id: string): Promise<Paciente | undefined>;
  buscarPorEmailODocumento(criterios: {
    email?: string;
    documento?: string;
  }): Promise<Paciente | undefined>;
  listar(q?: string): Promise<Paciente[]>;
  actualizar(paciente: Paciente): Promise<Paciente>;
}