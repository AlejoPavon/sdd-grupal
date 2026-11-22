import type { PacienteRepository } from "./paciente-repository.js";
import type { PrestacionRepository } from "./prestacion-repository.js";
import type { ProfesionalRepository } from "./profesional-repository.js";
import type { SillonRepository } from "./sillon-repository.js";
import type { TurnoRepository } from "./turno-repository.js";
import type { UsuarioRepository } from "./usuario-repository.js";

export interface Repositorios {
  pacientes: PacienteRepository;
  profesionales: ProfesionalRepository;
  sillones: SillonRepository;
  prestaciones: PrestacionRepository;
  turnos: TurnoRepository;
  usuarios?: UsuarioRepository;
}