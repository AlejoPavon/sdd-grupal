import type { Bloqueo } from "../../domain/bloqueo/bloqueo.js";
import { RangoInvalidoError } from "../../domain/turno/turno.errors.js";
import type { FiltrosBloqueo } from "../ports/bloqueo-repository.js";
import type { Repositorios } from "../ports/repositorios.js";

export type ListarBloqueosInput = FiltrosBloqueo;

export class ListarBloqueos {
  constructor(private readonly repos: Repositorios) {}

  async execute(filtros: ListarBloqueosInput = {}): Promise<Bloqueo[]> {
    const desde = filtros.desde?.getTime();
    const hasta = filtros.hasta?.getTime();

    if (desde !== undefined && Number.isNaN(desde)) throw new RangoInvalidoError();
    if (hasta !== undefined && Number.isNaN(hasta)) throw new RangoInvalidoError();
    if (desde !== undefined && hasta !== undefined && desde >= hasta) throw new RangoInvalidoError();

    return this.repos.bloqueos.listar(filtros);
  }
}
