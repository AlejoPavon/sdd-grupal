import type { FastifyInstance } from "fastify";

import { CrearPaciente } from "../../application/pacientes/crear-paciente.js";
import { ListarPacientes, ObtenerPaciente } from "../../application/pacientes/listar-pacientes.js";
import { ActualizarPaciente } from "../../application/pacientes/actualizar-paciente.js";
import { DesactivarPaciente } from "../../application/pacientes/desactivar-paciente.js";
import type { Repositorios } from "../../application/ports/repositorios.js";
import {
  actualizarPacienteSchema,
  crearPacienteSchema,
} from "../schemas/paciente.schema.js";

export function registrarRutasPacientes(app: FastifyInstance, repos: Repositorios): void {
  app.post("/api/pacientes", async (request, reply) => {
    const body = crearPacienteSchema.parse(request.body);
    const crear = new CrearPaciente(repos.pacientes);
    const paciente = await crear.execute({
      nombre: body.nombre,
      apellido: body.apellido,
      documento: body.documento,
      telefono: body.telefono,
      email: body.email,
      fechaNacimiento: body.fechaNacimiento ? new Date(body.fechaNacimiento) : undefined,
      notas: body.notas,
    });
    return reply.status(201).send(paciente);
  });

  app.get("/api/pacientes", async (request, reply) => {
    const q = (request.query as { q?: string }).q;
    const listar = new ListarPacientes(repos.pacientes);
    const pacientes = await listar.execute(q);
    return reply.send(pacientes);
  });

  app.get("/api/pacientes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const obtener = new ObtenerPaciente(repos.pacientes);
    const paciente = await obtener.execute(id);
    return reply.send(paciente);
  });

  app.patch("/api/pacientes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = actualizarPacienteSchema.parse(request.body);
    const actualizar = new ActualizarPaciente(repos.pacientes);
    const paciente = await actualizar.execute(id, {
      nombre: body.nombre,
      apellido: body.apellido,
      documento: body.documento,
      telefono: body.telefono,
      email: body.email,
      fechaNacimiento: body.fechaNacimiento ? new Date(body.fechaNacimiento) : undefined,
      notas: body.notas,
      activo: body.activo,
    });
    return reply.send(paciente);
  });

  app.delete("/api/pacientes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const desactivar = new DesactivarPaciente(repos.pacientes);
    const paciente = await desactivar.execute(id);
    return reply.send(paciente);
  });
}