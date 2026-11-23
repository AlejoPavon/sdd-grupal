import { CredencialesInvalidasError } from "../../domain/usuario/usuario.errors.js";
import type { UsuarioRepository } from "../ports/usuario-repository.js";
import type { SessionRepository } from "../ports/session-repository.js";
import { verifyPassword } from "./password.js";
import { toUsuarioPublico, type UsuarioPublico } from "./usuario-publico.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResultado {
  usuario: UsuarioPublico;
  token: string;
}

export class Login {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly sesiones: SessionRepository,
    private readonly ttlMs: number,
  ) {}

  async execute(input: LoginInput): Promise<LoginResultado> {
    const email = input.email.trim().toLowerCase();
    const usuario = await this.usuarios.buscarPorEmail(email);

    if (
      !usuario ||
      !usuario.activo ||
      !(await verifyPassword(input.password, usuario.passwordHash))
    ) {
      throw new CredencialesInvalidasError();
    }

    const sesion = await this.sesiones.crear(usuario.id, this.ttlMs);
    return { usuario: toUsuarioPublico(usuario), token: sesion.token };
  }
}
