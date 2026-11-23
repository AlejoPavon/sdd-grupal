import { NoAutenticadoError } from "../../domain/usuario/usuario.errors.js";
import type { Usuario, UsuarioAutenticado } from "../../domain/usuario/usuario.js";
import type { UsuarioRepository } from "../ports/usuario-repository.js";
import type { SessionRepository } from "../ports/session-repository.js";
import { toUsuarioPublico, type UsuarioPublico } from "./usuario-publico.js";

export class ObtenerSesion {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly sesiones: SessionRepository,
  ) {}

  async execute(token: string): Promise<UsuarioAutenticado> {
    const usuario = await this.resolver(token);
    const autenticado: UsuarioAutenticado = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };
    if (usuario.profesionalId !== undefined) {
      autenticado.profesionalId = usuario.profesionalId;
    }
    return autenticado;
  }

  async executePublico(token: string): Promise<UsuarioPublico> {
    return toUsuarioPublico(await this.resolver(token));
  }

  private async resolver(token: string): Promise<Usuario> {
    const sesion = await this.sesiones.buscar(token);
    if (!sesion) throw new NoAutenticadoError();

    const usuario = await this.usuarios.buscarPorId(sesion.usuarioId);
    if (!usuario || !usuario.activo) throw new NoAutenticadoError();
    return usuario;
  }
}
