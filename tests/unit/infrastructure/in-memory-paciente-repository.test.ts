import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import type { Paciente } from "../../../src/domain/paciente/paciente.js";
import { RecursoNoEncontradoError } from "../../../src/domain/turno/turno.errors.js";
import { InMemoryPacienteRepository } from "../../../src/infrastructure/persistence/in-memory-paciente-repository.js";

function crearPaciente(sobrescribir: Partial<Paciente> = {}): Paciente {
  return {
    id: randomUUID(),
    nombre: "Paciente",
    apellido: "Demo",
    activo: true,
    createdAt: new Date("2026-11-18T08:00:00.000Z"),
    updatedAt: new Date("2026-11-18T08:00:00.000Z"),
    ...sobrescribir,
  };
}

describe("InMemoryPacienteRepository", () => {
  let repo: InMemoryPacienteRepository;

  beforeEach(() => {
    repo = new InMemoryPacienteRepository();
  });

  it("guarda un paciente y lo recupera por id", async () => {
    const paciente = crearPaciente();
    await repo.crear(paciente);
    expect(await repo.buscarPorId(paciente.id)).toEqual(paciente);
  });

  describe("buscarActivoPorId", () => {
    it("devuelve el paciente si está activo", async () => {
      const paciente = crearPaciente();
      await repo.crear(paciente);
      expect(await repo.buscarActivoPorId(paciente.id)).toEqual(paciente);
    });

    it("devuelve undefined si el paciente está inactivo", async () => {
      const paciente = crearPaciente({ activo: false });
      await repo.crear(paciente);
      expect(await repo.buscarActivoPorId(paciente.id)).toBeUndefined();
    });
  });

  describe("buscarPorEmailODocumento", () => {
    it("encuentra por email", async () => {
      const paciente = crearPaciente({ email: "uno@demo.local" });
      await repo.crear(paciente);
      const resultado = await repo.buscarPorEmailODocumento({ email: "uno@demo.local" });
      expect(resultado?.id).toBe(paciente.id);
    });

    it("encuentra por documento", async () => {
      const paciente = crearPaciente({ documento: "00000001" });
      await repo.crear(paciente);
      const resultado = await repo.buscarPorEmailODocumento({ documento: "00000001" });
      expect(resultado?.id).toBe(paciente.id);
    });

    it("ignora a los pacientes inactivos", async () => {
      await repo.crear(crearPaciente({ email: "uno@demo.local", activo: false }));
      expect(await repo.buscarPorEmailODocumento({ email: "uno@demo.local" })).toBeUndefined();
    });

    it("sin criterios no devuelve nada, aunque haya pacientes sin email ni documento", async () => {
      await repo.crear(crearPaciente());
      expect(await repo.buscarPorEmailODocumento({})).toBeUndefined();
    });
  });

  describe("listar", () => {
    it("busca texto parcial sin distinguir mayúsculas", async () => {
      const demo = crearPaciente({ apellido: "Demo" });
      await repo.crear(demo);
      await repo.crear(crearPaciente({ apellido: "Prueba" }));

      const resultado = await repo.listar("dEm");

      expect(resultado.map((p) => p.id)).toEqual([demo.id]);
    });

    it("busca también por teléfono", async () => {
      const paciente = crearPaciente({ telefono: "1100000001" });
      await repo.crear(paciente);
      await repo.crear(crearPaciente({ telefono: "1100000002" }));

      const resultado = await repo.listar("0001");

      expect(resultado.map((p) => p.id)).toEqual([paciente.id]);
    });

    it("ordena por apellido y luego por nombre", async () => {
      const zetaAna = crearPaciente({ apellido: "Zeta", nombre: "Ana" });
      const alfaBruno = crearPaciente({ apellido: "Alfa", nombre: "Bruno" });
      const alfaAna = crearPaciente({ apellido: "Alfa", nombre: "Ana" });
      await repo.crear(zetaAna);
      await repo.crear(alfaBruno);
      await repo.crear(alfaAna);

      const resultado = await repo.listar();

      expect(resultado.map((p) => p.id)).toEqual([alfaAna.id, alfaBruno.id, zetaAna.id]);
    });

    it("sin texto devuelve solo los pacientes activos", async () => {
  const activo = crearPaciente();
  await repo.crear(activo);
  await repo.crear(crearPaciente({ activo: false }));

  const resultado = await repo.listar();

  expect(resultado.map((p) => p.id)).toEqual([activo.id]);
    });
    it("con texto no devuelve pacientes inactivos", async () => {
  await repo.crear(crearPaciente({ apellido: "Demo" }));
  await repo.crear(crearPaciente({ apellido: "Oculto", activo: false }));

  const resultado = await repo.listar("oc");

  expect(resultado).toEqual([]);
     });
    
  });

  describe("actualizar", () => {
    it("persiste el cambio", async () => {
      const paciente = crearPaciente();
      await repo.crear(paciente);

      await repo.actualizar({ ...paciente, activo: false });

      expect((await repo.buscarPorId(paciente.id))?.activo).toBe(false);
    });

    it("lanza RecursoNoEncontradoError si el paciente no existe", async () => {
      await expect(repo.actualizar(crearPaciente())).rejects.toBeInstanceOf(
        RecursoNoEncontradoError,
      );
    });
  });
});