import { describe, expect, it } from "vitest";

import { ObtenerSesion } from "../../../../src/application/auth/obtener-sesion.js";
import type { Usuario } from "../../../../src/domain/usuario/usuario.js";
import { InMemoryUsuarioRepository } from "../../../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { InMemorySessionRepository } from "../../../../src/infrastructure/persistence/in-memory-session-repository.js";

const AHORA = new Date("2026-11-23T10:00:00.000Z");

function usuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: "u-1",
    email: "odonto1@demo.local",
    passwordHash: "hash",
    nombre: "Ana",
    apellido: "Demo",
    rol: "profesional",
    activo: true,
    profesionalId: "prof-1",
    ...overrides,
  };
}

function armar() {
  const usuarios = new InMemoryUsuarioRepository();
  const sesiones = new InMemorySessionRepository(() => AHORA);
  return { usuarios, sesiones, obtener: new ObtenerSesion(usuarios, sesiones) };
}

describe("ObtenerSesion", () => {
  it("devuelve la identidad autenticada con profesionalId", async () => {
    const { usuarios, sesiones, obtener } = armar();
    await usuarios.crear(usuario());
    const sesion = await sesiones.crear("u-1", 60_000);

    await expect(obtener.execute(sesion.token)).resolves.toEqual({
      id: "u-1",
      email: "odonto1@demo.local",
      rol: "profesional",
      profesionalId: "prof-1",
    });
  });

  it("omite profesionalId cuando el usuario no está vinculado", async () => {
    const sinVinculo = usuario({ profesionalId: undefined });
    const { usuarios, sesiones, obtener } = armar();
    await usuarios.crear(sinVinculo);
    const sesion = await sesiones.crear("u-1", 60_000);

    await expect(obtener.execute(sesion.token)).resolves.toEqual({
      id: "u-1",
      email: "odonto1@demo.local",
      rol: "profesional",
    });
  });

  it("lanza NO_AUTENTICADO para token desconocido", async () => {
    const { obtener } = armar();

    await expect(obtener.execute("no-existe")).rejects.toMatchObject({
      code: "NO_AUTENTICADO",
    });
  });

  it("rechaza un usuario desactivado después del login", async () => {
    const { usuarios, sesiones, obtener } = armar();
    await usuarios.crear(usuario({ activo: false }));
    const sesion = await sesiones.crear("u-1", 60_000);

    await expect(obtener.execute(sesion.token)).rejects.toMatchObject({
      code: "NO_AUTENTICADO",
    });
  });

  it("rechaza una sesión expirada", async () => {
    const usuarios = new InMemoryUsuarioRepository();
    await usuarios.crear(usuario());
    let ahora = AHORA;
    const sesiones = new InMemorySessionRepository(() => ahora);
    const sesion = await sesiones.crear("u-1", 60_000);
    ahora = new Date("2026-11-23T10:02:00.000Z");

    const obtener = new ObtenerSesion(usuarios, sesiones);
    await expect(obtener.execute(sesion.token)).rejects.toMatchObject({
      code: "NO_AUTENTICADO",
    });
  });

  it("executePublico devuelve el DTO sin datos sensibles", async () => {
    const { usuarios, sesiones, obtener } = armar();
    await usuarios.crear(usuario());
    const sesion = await sesiones.crear("u-1", 60_000);

    await expect(obtener.executePublico(sesion.token)).resolves.toEqual({
      id: "u-1",
      email: "odonto1@demo.local",
      nombre: "Ana",
      apellido: "Demo",
      rol: "profesional",
    });
  });
});
