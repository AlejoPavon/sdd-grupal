import { describe, expect, it } from "vitest";

import { Logout } from "../../../../src/application/auth/logout.js";
import { InMemorySessionRepository } from "../../../../src/infrastructure/persistence/in-memory-session-repository.js";

describe("Logout", () => {
  it("invalida la sesión indicada", async () => {
    const sesiones = new InMemorySessionRepository();
    const sesion = await sesiones.crear("u-1", 60_000);
    const logout = new Logout(sesiones);

    await logout.execute(sesion.token);

    await expect(sesiones.buscar(sesion.token)).resolves.toBeUndefined();
  });

  it("es idempotente: repetir logout no lanza", async () => {
    const sesiones = new InMemorySessionRepository();
    const sesion = await sesiones.crear("u-1", 60_000);
    const logout = new Logout(sesiones);

    await expect(logout.execute(sesion.token)).resolves.toBeUndefined();
    await expect(logout.execute(sesion.token)).resolves.toBeUndefined();
    await expect(logout.execute("token-desconocido")).resolves.toBeUndefined();
  });
});
