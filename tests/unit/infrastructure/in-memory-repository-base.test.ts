import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import type { Profesional } from "../../../src/domain/profesional/profesional.js";
import { InMemoryProfesionalRepository } from "../../../src/infrastructure/persistence/in-memory-profesional-repository.js";

function crearProfesional(sobrescribir: Partial<Profesional> = {}): Profesional {
  return {
    id: randomUUID(),
    nombre: "Ana",
    apellido: "Demo",
    matricula: "DEMO-001",
    especialidades: ["clinica"],
    activo: true,
    ...sobrescribir,
  };
}

describe("InMemoryRepositoryBase (vía InMemoryProfesionalRepository)", () => {
  let repo: InMemoryProfesionalRepository;

  beforeEach(() => {
    repo = new InMemoryProfesionalRepository();
  });

  it("guarda y recupera por id", async () => {
    const profesional = crearProfesional();
    await repo.crear(profesional);
    expect(await repo.buscarPorId(profesional.id)).toEqual(profesional);
  });

  it("devuelve undefined si no existe", async () => {
    expect(await repo.buscarPorId("no-existe")).toBeUndefined();
  });

  it("lista todo lo guardado", async () => {
    await repo.crear(crearProfesional());
    await repo.crear(crearProfesional({ matricula: "DEMO-002" }));
    expect(await repo.listar()).toHaveLength(2);
  });

  it("no comparte referencia con el objeto guardado", async () => {
    const profesional = crearProfesional();
    await repo.crear(profesional);
    profesional.activo = false;
    expect((await repo.buscarPorId(profesional.id))?.activo).toBe(true);
  });
});