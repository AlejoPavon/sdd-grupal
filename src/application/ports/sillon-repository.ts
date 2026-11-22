import type { Sillon } from "../../domain/sillon/sillon.js";

export interface SillonRepository {
  crear(sillon: Sillon): Promise<Sillon>;
  buscarPorId(id: string): Promise<Sillon | undefined>;
  listar(): Promise<Sillon[]>;
}