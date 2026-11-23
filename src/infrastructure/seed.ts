import type { PacienteRepository } from "../application/ports/paciente-repository.js";
import type { PrestacionRepository } from "../application/ports/prestacion-repository.js";
import type { ProfesionalRepository } from "../application/ports/profesional-repository.js";
import type { SillonRepository } from "../application/ports/sillon-repository.js";
import { hashPassword } from "../application/auth/password.js";
import type { UsuarioRepository } from "../application/ports/usuario-repository.js";
import type { Paciente } from "../domain/paciente/paciente.js";
import type { Prestacion } from "../domain/prestacion/prestacion.js";
import type { Profesional } from "../domain/profesional/profesional.js";
import type { Sillon } from "../domain/sillon/sillon.js";
import type { Sucursal } from "../domain/sucursal/sucursal.js";
import type { Usuario } from "../domain/usuario/usuario.js";

/** IDs fijos del seed. Todos los datos son ficticios (RN-PA-04, RN-SE-02). */
export const SEED_IDS = {
  sucursal: "00000000-0000-4000-8000-000000000001",
  sillon1: "00000000-0000-4000-8000-000000000011",
  sillon2: "00000000-0000-4000-8000-000000000012",
  profesional1: "00000000-0000-4000-8000-000000000021",
  profesional2: "00000000-0000-4000-8000-000000000022",
  consulta: "00000000-0000-4000-8000-000000000031",
  limpieza: "00000000-0000-4000-8000-000000000032",
  endodoncia: "00000000-0000-4000-8000-000000000033",
  control: "00000000-0000-4000-8000-000000000034",
  paciente1: "00000000-0000-4000-8000-000000000041",
  paciente2: "00000000-0000-4000-8000-000000000042",
  paciente3: "00000000-0000-4000-8000-000000000043",
  admin: "00000000-0000-4000-8000-000000000051",
  recepcion: "00000000-0000-4000-8000-000000000052",
  odonto1: "00000000-0000-4000-8000-000000000053",
} as const;

/** Password del seed, configurable para entornos demo (nunca para producción real). */
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo1234";

const FECHA_SEED = new Date("2026-11-18T00:00:00.000Z");

export const SUCURSAL_DEMO: Sucursal = {
  id: SEED_IDS.sucursal,
  nombre: "Consultorio Demo",
  direccion: "Av. Ficticia 123, CABA",
  timezone: "America/Argentina/Buenos_Aires",
  activa: true,
};

const SILLONES: Sillon[] = [
  { id: SEED_IDS.sillon1, nombre: "Sillón 1", sucursalId: SUCURSAL_DEMO.id, activo: true },
  { id: SEED_IDS.sillon2, nombre: "Sillón 2", sucursalId: SUCURSAL_DEMO.id, activo: true },
];

const PROFESIONALES: Profesional[] = [
  {
    id: SEED_IDS.profesional1,
    nombre: "Ana",
    apellido: "Demo",
    matricula: "DEMO-001",
    especialidades: ["odontologia general"],
    activo: true,
  },
  {
    id: SEED_IDS.profesional2,
    nombre: "Bruno",
    apellido: "Demo",
    matricula: "DEMO-002",
    especialidades: ["endodoncia"],
    activo: true,
  },
];

const PRESTACIONES: Prestacion[] = [
  { id: SEED_IDS.consulta, codigo: "CONSULTA", nombre: "Consulta", duracionMinutos: 30, activo: true },
  { id: SEED_IDS.limpieza, codigo: "LIMPIEZA", nombre: "Limpieza", duracionMinutos: 45, activo: true },
  { id: SEED_IDS.endodoncia, codigo: "ENDODONCIA", nombre: "Endodoncia", duracionMinutos: 90, activo: true },
  { id: SEED_IDS.control, codigo: "CONTROL", nombre: "Control", duracionMinutos: 15, activo: true },
];

const PACIENTES: Paciente[] = [
  { id: SEED_IDS.paciente1, nombre: "Paciente", apellido: "Demo Uno", activo: true, createdAt: FECHA_SEED, updatedAt: FECHA_SEED },
  { id: SEED_IDS.paciente2, nombre: "Paciente", apellido: "Demo Dos", activo: true, createdAt: FECHA_SEED, updatedAt: FECHA_SEED },
  { id: SEED_IDS.paciente3, nombre: "Paciente", apellido: "Demo Tres", activo: true, createdAt: FECHA_SEED, updatedAt: FECHA_SEED },
];

function usuariosSeed(passwordHash: string): Usuario[] {
  return [
    {
      id: SEED_IDS.admin,
      email: "admin@demo.local",
      passwordHash,
      nombre: "Admin",
      apellido: "Demo",
      rol: "administrador",
      activo: true,
    },
    {
      id: SEED_IDS.recepcion,
      email: "recepcion@demo.local",
      passwordHash,
      nombre: "Recepción",
      apellido: "Demo",
      rol: "recepcionista",
      activo: true,
    },
    {
      id: SEED_IDS.odonto1,
      email: "odonto1@demo.local",
      passwordHash,
      nombre: "Ana",
      apellido: "Demo",
      rol: "profesional",
      activo: true,
      profesionalId: SEED_IDS.profesional1,
    },
  ];
}

export interface RepositoriosSeed {
  sillones: SillonRepository;
  profesionales: ProfesionalRepository;
  prestaciones: PrestacionRepository;
  pacientes: PacienteRepository;
  usuarios: UsuarioRepository;
}

export async function cargarSeed(repos: RepositoriosSeed): Promise<void> {
  for (const sillon of SILLONES) await repos.sillones.crear(sillon);
  for (const profesional of PROFESIONALES) await repos.profesionales.crear(profesional);
  for (const prestacion of PRESTACIONES) await repos.prestaciones.crear(prestacion);
  for (const paciente of PACIENTES) await repos.pacientes.crear(paciente);

  // Credenciales de desarrollo con datos ficticios (RN-SE-01/RN-SE-02): nunca usar en producción.
  // Un único hash para los tres usuarios demo: se calcula una sola vez por seed.
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  for (const usuario of usuariosSeed(passwordHash)) await repos.usuarios.crear(usuario);
}