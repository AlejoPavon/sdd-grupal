import { describe, expect, it } from "vitest";

import { toUsuarioPublico } from "../../../src/application/auth/usuario-publico.js";
import type { Usuario } from "../../../src/domain/usuario/usuario.js";

const usuario: Usuario = {
  id: "u-1",
  email: "odonto1@demo.local",
  passwordHash: "hash-secreto",
  nombre: "Ana",
  apellido: "Demo",
  rol: "profesional",
  activo: true,
  profesionalId: "prof-1",
};

describe("toUsuarioPublico", () => {
  it("devuelve exactamente los cinco campos públicos", () => {
    expect(toUsuarioPublico(usuario)).toEqual({
      id: "u-1",
      email: "odonto1@demo.local",
      nombre: "Ana",
      apellido: "Demo",
      rol: "profesional",
    });
  });

  it("no expone passwordHash, activo ni profesionalId", () => {
    const dto = toUsuarioPublico(usuario) as Record<string, unknown>;

    expect(Object.keys(dto)).toEqual(["id", "email", "nombre", "apellido", "rol"]);
    expect(dto.passwordHash).toBeUndefined();
    expect(dto.activo).toBeUndefined();
    expect(dto.profesionalId).toBeUndefined();
  });
});
