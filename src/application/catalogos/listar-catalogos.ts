import type { PrestacionRepository } from "../ports/prestacion-repository.js";
import type { ProfesionalRepository } from "../ports/profesional-repository.js";
import type { SillonRepository } from "../ports/sillon-repository.js";
import type { Repositorios } from "../ports/repositorios.js";
import type { Prestacion } from "../../domain/prestacion/prestacion.js";
import type { Profesional } from "../../domain/profesional/profesional.js";
import type { Sillon } from "../../domain/sillon/sillon.js";

function normalizarRepo<T>(arg: unknown, key: keyof Repositorios): T {
  if (arg && typeof arg === "object" && key in (arg as Record<string, unknown>)) {
    return (arg as Record<string, unknown>)[key] as T;
  }
  return arg as T;
}

export class ListarProfesionales {
  private readonly repo: ProfesionalRepository;
  constructor(...args: unknown[]) {
    this.repo = normalizarRepo<ProfesionalRepository>(args[0], "profesionales");
  }
  async execute(): Promise<Profesional[]> {
    return this.repo.listar();
  }
}

export class ListarSillones {
  private readonly repo: SillonRepository;
  constructor(...args: unknown[]) {
    this.repo = normalizarRepo<SillonRepository>(args[0], "sillones");
  }
  async execute(): Promise<Sillon[]> {
    return this.repo.listar();
  }
}

export class ListarPrestaciones {
  private readonly repo: PrestacionRepository;
  constructor(...args: unknown[]) {
    this.repo = normalizarRepo<PrestacionRepository>(args[0], "prestaciones");
  }
  async execute(): Promise<Prestacion[]> {
    return this.repo.listar();
  }
}