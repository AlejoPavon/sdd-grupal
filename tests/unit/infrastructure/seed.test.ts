import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryPacienteRepository } from "../../../src/infrastructure/persistence/in-memory-paciente-repository.js";
import { InMemoryPrestacionRepository } from "../../../src/infrastructure/persistence/in-memory-prestacion-repository.js";
import { InMemoryProfesionalRepository } from "../../../src/infrastructure/persistence/in-memory-profesional-repository.js";
import { InMemorySillonRepository } from "../../../src/infrastructure/persistence/in-memory-sillon-repository.js";
import { InMemoryUsuarioRepository } from "../../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import {
  cargarSeed,
  PASSWORD_HASH_PLACEHOLDER,
  SEED_IDS,
  SUCURSAL_DEMO,
  type RepositoriosSeed,
} from "../../../src/infrastructure/seed.js";

describe("cargarSeed", () => {
  let repos: RepositoriosSeed;

  beforeEach(async () => {
    repos = {
      sillones: new InMemorySillonRepository(),
      profesionales: new InMemoryProfesionalRepository(),
      prestaciones: new InMemoryPrestacionRepository(),
      pacientes: new InMemoryPacienteRepository(),
      usuarios: new InMemoryUsuarioRepository(),
    };
    await cargarSeed(repos);
  });

  it("carga 2 sillones de la sucursal demo", async () => {
    const sillones = await repos.sillones.listar();
    expect(sillones).toHaveLength(2);
    expect(sillones.every((s) => s.sucursalId === SUCURSAL_DEMO.id)).toBe(true);
  });

  it("carga 2 profesionales con matrícula demo", async () => {
    const profesionales = await repos.profesionales.listar();
    expect(profesionales.map((p) => p.matricula).sort()).toEqual(["DEMO-001", "DEMO-002"]);
  });

  it("carga 4 prestaciones con la duración definida en la KB", async () => {
    const prestaciones = await repos.prestaciones.listar();
    const duraciones = Object.fromEntries(prestaciones.map((p) => [p.codigo, p.duracionMinutos]));
    expect(duraciones).toEqual({ CONSULTA: 30, LIMPIEZA: 45, ENDODONCIA: 90, CONTROL: 15 });
  });

  it("carga 3 pacientes ficticios", async () => {
    const pacientes = await repos.pacientes.listar();
    expect(pacientes).toHaveLength(3);
    expect(pacientes.every((p) => p.apellido.startsWith("Demo"))).toBe(true);
  });

  it("carga 3 usuarios demo con hash de relleno", async () => {
    const usuarios = await repos.usuarios.listar();
    expect(usuarios.map((u) => u.rol).sort()).toEqual([
      "administrador",
      "profesional",
      "recepcionista",
    ]);
    expect(usuarios.every((u) => u.passwordHash === PASSWORD_HASH_PLACEHOLDER)).toBe(true);
  });

  it("usa ids fijos y consultables", async () => {
    expect(await repos.sillones.buscarPorId(SEED_IDS.sillon2)).toBeDefined();
    expect((await repos.profesionales.buscarPorId(SEED_IDS.profesional1))?.matricula).toBe(
      "DEMO-001",
    );
  });

  it("usa solo emails de dominio .local", async () => {
    const usuarios = await repos.usuarios.listar();
    expect(usuarios.every((u) => u.email.endsWith("@demo.local"))).toBe(true);
  });

  it("deja todos los recursos activos", async () => {
    const [sillones, profesionales, prestaciones, pacientes] = await Promise.all([
      repos.sillones.listar(),
      repos.profesionales.listar(),
      repos.prestaciones.listar(),
      repos.pacientes.listar(),
    ]);
    const todos = [...sillones, ...profesionales, ...prestaciones, ...pacientes];
    expect(todos.every((recurso) => recurso.activo)).toBe(true);
  });
});