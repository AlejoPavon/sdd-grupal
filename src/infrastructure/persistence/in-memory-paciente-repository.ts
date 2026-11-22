import type { PacienteRepository } from "../../application/ports/paciente-repository.js";
import type { Paciente } from "../../domain/paciente/paciente.js";
import { RecursoNoEncontradoError } from "../../domain/turno/turno.errors.js";
import { InMemoryRepositoryBase } from "./in-memory-repository-base.js";

export class InMemoryPacienteRepository
  extends InMemoryRepositoryBase<Paciente>
  implements PacienteRepository
{
  async buscarActivoPorId(id: string): Promise<Paciente | undefined> {
    const paciente = this.items.get(id);
    return paciente?.activo ? { ...paciente } : undefined;
  }

  async buscarPorEmailODocumento(criterios: {
    email?: string;
    documento?: string;
  }): Promise<Paciente | undefined> {
    const { email, documento } = criterios;
    if (email === undefined && documento === undefined) {
      return undefined;
    }
    const encontrado = [...this.items.values()].find(
      (p) =>
        p.activo &&
        ((email !== undefined && p.email === email) ||
          (documento !== undefined && p.documento === documento)),
    );
    return encontrado ? { ...encontrado } : undefined;
  }

  override async listar(q?: string): Promise<Paciente[]> {
    const texto = q?.trim().toLowerCase();
    const todos = [...this.items.values()];
    const filtrados = texto
      ? todos.filter((p) =>
          [p.apellido, p.nombre, p.telefono, p.documento].some((campo) =>
            campo?.toLowerCase().includes(texto),
          ),
        )
      : todos;
    return filtrados
      .sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre))
      .map((p) => ({ ...p }));
  }

  async actualizar(paciente: Paciente): Promise<Paciente> {
    if (!this.items.has(paciente.id)) {
      throw new RecursoNoEncontradoError("paciente", paciente.id);
    }
    this.items.set(paciente.id, { ...paciente });
    return { ...paciente };
  }
}