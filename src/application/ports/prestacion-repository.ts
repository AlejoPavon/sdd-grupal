import type { Prestacion } from "../../domain/prestacion/prestacion.js";

export interface PrestacionRepository {
  crear(prestacion: Prestacion): Promise<Prestacion>;
  buscarPorId(id: string): Promise<Prestacion | undefined>;
  listar(): Promise<Prestacion[]>;
}