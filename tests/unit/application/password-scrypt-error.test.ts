import { describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", async (importOriginal) => {
  const original = await importOriginal<typeof import("node:crypto")>();
  return {
    ...original,
    scrypt: () => {
      throw new Error("scrypt caído");
    },
  };
});

import { verifyPassword } from "../../../src/application/auth/password.js";

describe("verifyPassword cuando scrypt falla", () => {
  it("devuelve false sin lanzar", async () => {
    const almacenado = `${Buffer.alloc(16).toString("base64url")}:${Buffer.alloc(64).toString("base64url")}`;

    await expect(verifyPassword("demo1234", almacenado)).resolves.toBe(false);
  });
});
