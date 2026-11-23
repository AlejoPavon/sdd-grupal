import { beforeEach, describe, expect, it } from "vitest";

import {
  ListarPrestaciones,
  ListarProfesionales,
  ListarSillones,
} from "../../../src/application/catalogos/listar-catalogos.js";
import type { Repositorios } from "../../../src/application/ports/repositorios.js";
import { InMemoryPacienteRepository } from "../../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySillonRepository } from "../../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryTurnoRepository } from "../../../src/infrastructure/persistence/in-memory-turno-repository.js";
import { InMemoryUsuarioRepository } from "../../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { cargarSeed } from "../../../src/infrastructure/seed.js";

describe("catalogos", () => {
  let repos: Repositorios;
  beforeEach(async () => {
    repos = {
      pacientes: new InMemoryPacienteRepository(),
      profesionales: new InMemoryProfesionalRepository(),
      sillones: new InMemorySillonRepository(),
      prestaciones: new InMemoryPrestacionRepository(),
      turnos: new InMemoryTurnoRepository(),
      usuarios: new InMemoryUsuarioRepository(),
    };
    await cargarSeed(repos);
  });

  it("lista profesionales no vacío", async () => {
    const listar = new ListarProfesionales(repos);
    const result = await listar.execute();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("lista sillones no vacío", async () => {
    const listar = new ListarSillones(repos);
    const result = await listar.execute();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("lista prestaciones no vacío", async () => {
    const listar = new ListarPrestaciones(repos);
    const result = await listar.execute();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});