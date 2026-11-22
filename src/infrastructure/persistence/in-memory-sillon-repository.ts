import type { SillonRepository } from "../../application/ports/sillon-repository.js";
import type { Sillon } from "../../domain/sillon/sillon.js";
import { InMemoryRepositoryBase } from "./in-memory-repository-base.js";

export class InMemorySillonRepository
  extends InMemoryRepositoryBase<Sillon>
  implements SillonRepository {}