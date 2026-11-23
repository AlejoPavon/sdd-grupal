import { describe, expect, it } from "vitest";

import { InMemorySessionRepository } from "../../../src/infrastructure/persistence/in-memory-session-repository.js";

const AHORA = new Date("2026-11-23T10:00:00.000Z");
const TTL_MS = 30 * 60 * 1000;

function repositorio(reloj: () => Date = () => AHORA) {
  return new InMemorySessionRepository(reloj);
}

describe("InMemorySessionRepository", () => {
  it("crea un token opaco de 32 bytes en base64url y vencimiento según TTL", async () => {
    const repos = repositorio();

    const sesion = await repos.crear("usuario-1", TTL_MS);

    expect(sesion.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(sesion.usuarioId).toBe("usuario-1");
    expect(sesion.expiresAt.toISOString()).toBe("2026-11-23T10:30:00.000Z");
  });

  it("busca una sesión vigente por token", async () => {
    const repos = repositorio();
    const sesion = await repos.crear("usuario-1", TTL_MS);

    await expect(repos.buscar(sesion.token)).resolves.toEqual(sesion);
  });

  it("descarta y elimina una sesión vencida", async () => {
    let ahora = AHORA;
    const repos = repositorio(() => ahora);
    const sesion = await repos.crear("usuario-1", TTL_MS);

    ahora = new Date("2026-11-23T10:31:00.000Z");

    await expect(repos.buscar(sesion.token)).resolves.toBeUndefined();
    ahora = AHORA;
    await expect(repos.buscar(sesion.token)).resolves.toBeUndefined();
  });

  it("el vencimiento límite (expiresAt igual a ahora) ya no es vigente", async () => {
    const repos = repositorio();
    const sesion = await repos.crear("usuario-1", 10_000);

    const relojLimite = new InMemorySessionRepository(() => sesion.expiresAt);
    await expect(relojLimite.buscar(sesion.token)).resolves.toBeUndefined();
  });

  it("un TTL no positivo crea una sesión inmediatamente vencida", async () => {
    const repos = repositorio();

    const sinTtl = await repos.crear("usuario-1", 0);
    const ttlNegativo = await repos.crear("usuario-1", -1);

    await expect(repos.buscar(sinTtl.token)).resolves.toBeUndefined();
    await expect(repos.buscar(ttlNegativo.token)).resolves.toBeUndefined();
  });

  it("eliminar es efectivo e idempotente", async () => {
    const repos = repositorio();
    const sesion = await repos.crear("usuario-1", TTL_MS);

    await repos.eliminar(sesion.token);
    await expect(repos.buscar(sesion.token)).resolves.toBeUndefined();

    await expect(repos.eliminar(sesion.token)).resolves.toBeUndefined();
  });

  it("dos sesiones del mismo usuario reciben tokens distintos", async () => {
    const repos = repositorio();

    const primera = await repos.crear("usuario-1", TTL_MS);
    const segunda = await repos.crear("usuario-1", TTL_MS);

    expect(primera.token).not.toBe(segunda.token);
    await expect(repos.buscar(primera.token)).resolves.toEqual(primera);
    await expect(repos.buscar(segunda.token)).resolves.toEqual(segunda);
  });
});
