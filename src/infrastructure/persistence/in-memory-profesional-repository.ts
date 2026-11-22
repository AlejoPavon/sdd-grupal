import type { ProfesionalRepository } from "../../application/ports/profesional-repository.js";
import type { Profesional } from "../../domain/profesional/profesional.js";
import { InMemoryRepositoryBase } from "./in-memory-repository-base.js";

export class InMemoryProfesionalRepository
  extends InMemoryRepositoryBase<Profesional>
  implements ProfesionalRepository {}