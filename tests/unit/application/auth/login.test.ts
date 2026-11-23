import { beforeAll, describe, expect, it, vi } from "vitest";

import { Login } from "../../../../src/application/auth/login.js";
import { hashPassword } from "../../../../src/application/auth/password.js";
import type { Usuario } from "../../../../src/domain/usuario/usuario.js";
import { InMemoryUsuarioRepository } from "../../../../src/infrastructure/persistence/in-memory-usuario-repository.js";
import { InMemorySessionRepository } from "../../../../src/infrastructure/persistence/in-memory-session-repository.js";

const AHORA = new Date("2026-11-23T10:00:00.000Z");
const TTL_MS = 8 * 60 * 60 * 1000;
let hash: string;

beforeAll(async () => {
  hash = await hashPassword("demo1234");
});

function usuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: "u-1",
    email: "admin@demo.local",
    passwordHash: hash,
    nombre: "Admin",
    apellido: "Demo",
    rol: "administrador",
    activo: true,
    ...overrides,
  };
}

function armar(ttlMs = TTL_MS) {
  const usuarios = new InMemoryUsuarioRepository();
  const sesiones = new InMemorySessionRepository(() => AHORA);
  return { usuarios, sesiones, login: new Login(usuarios, sesiones, ttlMs) };
}

describe("Login", () => {
  it("normaliza el email, devuelve el DTO público y crea la sesión con TTL", async () => {
    const { usuarios, sesiones, login } = armar();
    await usuarios.crear(usuario());

    const resultado = await login.execute({
      email: "  ADMIN@DEMO.LOCAL  ",
      password: "demo1234",
    });

    expect(resultado.usuario).toEqual({
      id: "u-1",
      email: "admin@demo.local",
      nombre: "Admin",
      apellido: "Demo",
      rol: "administrador",
    });
    expect(resultado.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const sesion = await sesiones.buscar(resultado.token);
    expect(sesion?.usuarioId).toBe("u-1");
    expect(sesion?.expiresAt.toISOString()).toBe("2026-11-23T18:00:00.000Z");
  });

  it("respeta un TTL configurado distinto al default", async () => {
    const { usuarios, sesiones, login } = armar(5 * 60 * 1000);
    await usuarios.crear(usuario());

    const resultado = await login.execute({ email: "admin@demo.local", password: "demo1234" });

    const sesion = await sesiones.buscar(resultado.token);
    expect(sesion?.expiresAt.toISOString()).toBe("2026-11-23T10:05:00.000Z");
  });

  it("busca el email almacenado sin distinguir mayúsculas ni espacios", async () => {
    const { usuarios, login } = armar();
    await usuarios.crear(usuario({ email: "  Admin@Demo.Local  " }));

    const resultado = await login.execute({ email: "admin@demo.local", password: "demo1234" });

    expect(resultado.usuario.email).toBe("  Admin@Demo.Local  ");
  });

  it("rechaza email inexistente sin revelar el motivo", async () => {
    const { login } = armar();

    await expect(login.execute({ email: "no@demo.local", password: "demo1234" })).rejects.toMatchObject({
      code: "CREDENCIALES_INVALIDAS",
      message: "Email o contraseña incorrectos",
    });
  });

  it("rechaza password incorrecta con el mismo código y mensaje", async () => {
    const { usuarios, login } = armar();
    await usuarios.crear(usuario());

    await expect(login.execute({ email: "admin@demo.local", password: "mala" })).rejects.toMatchObject({
      code: "CREDENCIALES_INVALIDAS",
      message: "Email o contraseña incorrectos",
    });
  });

  it("rechaza usuarios inactivos", async () => {
    const { usuarios, login } = armar();
    await usuarios.crear(usuario({ activo: false }));

    await expect(login.execute({ email: "admin@demo.local", password: "demo1234" })).rejects.toMatchObject({
      code: "CREDENCIALES_INVALIDAS",
    });
  });

  it("rechaza un passwordHash corrupto", async () => {
    const { usuarios, login } = armar();
    await usuarios.crear(usuario({ passwordHash: "corrupto" }));

    await expect(login.execute({ email: "admin@demo.local", password: "demo1234" })).rejects.toMatchObject({
      code: "CREDENCIALES_INVALIDAS",
    });
  });

  it("no crea sesión cuando falla el login", async () => {
    const { usuarios, sesiones, login } = armar();
    await usuarios.crear(usuario());
    const crearSesion = vi.spyOn(sesiones, "crear");

    await expect(login.execute({ email: "admin@demo.local", password: "mala" })).rejects.toMatchObject({
      code: "CREDENCIALES_INVALIDAS",
    });
    expect(crearSesion).not.toHaveBeenCalled();
  });
});
