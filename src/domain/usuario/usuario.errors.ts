import { DominioError } from "../errors/dominio-error.js";

export const MENSAJE_CREDENCIALES_INVALIDAS = "Email o contraseña incorrectos";

export class CredencialesInvalidasError extends DominioError {
  readonly code = "CREDENCIALES_INVALIDAS";

  constructor() {
    super(MENSAJE_CREDENCIALES_INVALIDAS);
  }
}

export class NoAutenticadoError extends DominioError {
  readonly code = "NO_AUTENTICADO";

  constructor() {
    super("Se requiere una sesión válida");
  }
}

export class SinPermisoError extends DominioError {
  readonly code = "SIN_PERMISO";

  constructor() {
    super("No tenés permiso para realizar esta acción");
  }
}
