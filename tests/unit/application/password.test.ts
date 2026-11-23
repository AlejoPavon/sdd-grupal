import { describe, expect, it } from "vitest";

import {
  hashPassword,
  verifyPassword,
} from "../../../src/application/auth/password.js";

describe("hashPassword", () => {
  it("guarda salt:hash con 16 bytes de salt y 64 de key en base64url", async () => {
    const hash = await hashPassword("demo1234");
    const partes = hash.split(":");

    expect(partes).toHaveLength(2);
    expect(Buffer.from(partes[0] ?? "", "base64url")).toHaveLength(16);
    expect(Buffer.from(partes[1] ?? "", "base64url")).toHaveLength(64);
    expect(hash).not.toContain("demo1234");
  });

  it("usa salt aleatorio: dos hashes de la misma password son distintos", async () => {
    const primero = await hashPassword("demo1234");
    const segundo = await hashPassword("demo1234");

    expect(primero).not.toBe(segundo);
  });
});

describe("verifyPassword", () => {
  it("acepta la password correcta", async () => {
    const hash = await hashPassword("demo1234");

    await expect(verifyPassword("demo1234", hash)).resolves.toBe(true);
  });

  it("rechaza una password distinta", async () => {
    const hash = await hashPassword("demo1234");

    await expect(verifyPassword("otra-password", hash)).resolves.toBe(false);
  });

  it("rechaza un hash con el primer byte del key modificado (misma longitud)", async () => {
    const hash = await hashPassword("demo1234");
    const partes = hash.split(":");
    const key = partes[1] ?? "";
    const bytes = Buffer.from(key, "base64url");
    bytes[0] = (bytes[0] ?? 0) ^ 0x01;
    const corrupto = `${partes[0]}:${bytes.toString("base64url")}`;

    await expect(verifyPassword("demo1234", corrupto)).resolves.toBe(false);
  });

  it("devuelve false para formatos corruptos sin lanzar", async () => {
    const hash = await hashPassword("demo1234");
    const partes = hash.split(":");

    await expect(verifyPassword("demo1234", "")).resolves.toBe(false);
    await expect(verifyPassword("demo1234", "sin-dos-puntos")).resolves.toBe(false);
    await expect(verifyPassword("demo1234", `${hash}:extra`)).resolves.toBe(false);
    await expect(verifyPassword("demo1234", `:${partes[1]}`)).resolves.toBe(false);
    await expect(
      verifyPassword("demo1234", `${partes[0]}:${partes[1]?.slice(0, -2)}`),
    ).resolves.toBe(false);
  });
});
