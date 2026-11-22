import type { PrestacionRepository } from "../../application/ports/prestacion-repository.js";
import type { Prestacion } from "../../domain/prestacion/prestacion.js";
import { InMemoryRepositoryBase } from "./in-memory-repository-base.js";

export class InMemoryPrestacionRepository
  extends InMemoryRepositoryBase<Prestacion>
  implements PrestacionRepository {}