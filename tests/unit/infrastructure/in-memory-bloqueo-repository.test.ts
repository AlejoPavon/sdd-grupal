import { describe, expect, it } from "vitest";

import { Intervalo } from "../../../src/domain/turno/intervalo.js";
import type { Bloqueo } from "../../../src/domain/bloqueo/bloqueo.js";
import { InMemoryBloqueoRepository } from "../../../src/infrastructure/persistence/in-memory-bloqueo-repository.js";

const PROFESIONAL_A = "00000000-0000-4000-8000-000000000021";
const PROFESIONAL_B = "00000000-0000-4000-8000-000000000022";
const SILLON_A = "00000000-0000-4000-8000-000000000011";
const SILLON_B = "00000000-0000-4000-8000-000000000012";

function bloqueo(
  id: string,
  profesionalId: string | undefined,
  sillonId: string | undefined,
  inicio: string,
  fin: string,
): Bloqueo {
  return {
    id,
    profesionalId,
    sillonId,
    inicio: new Date(inicio),
    fin: new Date(fin),
    motivo: "Mantenimiento",
    creadoPor: "00000000-0000-4000-8000-000000000051",
    createdAt: new Date("2026-11-17T12:00:00.000Z"),
  };
}

const BLOQUEO_A = bloqueo(
  "00000000-0000-4000-8000-000000000081",
  PROFESIONAL_A,
  SILLON_A,
  "2027-01-15T09:00:00.000Z",
  "2027-01-15T09:30:00.000Z",
);
const BLOQUEO_B = bloqueo(
  "00000000-0000-4000-8000-000000000082",
  PROFESIONAL_B,
  SILLON_B,
  "2027-01-15T10:00:00.000Z",
  "2027-01-15T10:30:00.000Z",
);

describe("InMemoryBloqueoRepository", () => {
  it("crea y busca por id devolviendo una copia desacoplada", async () => {
    const repo = new InMemoryBloqueoRepository();

    const creado = await repo.crear(BLOQUEO_A);
    const encontrado = await repo.buscarPorId(BLOQUEO_A.id);

    expect(creado).toEqual(BLOQUEO_A);
    expect(encontrado).toEqual(BLOQUEO_A);
    expect(encontrado).not.toBe(BLOQUEO_A);

    if (!encontrado) throw new Error("bloqueo no encontrado");
    encontrado.motivo = "modificado";
    expect((await repo.buscarPorId(BLOQUEO_A.id))?.motivo).toBe("Mantenimiento");
  });

  it("lista solo los bloqueos que intersectan el rango [desde, hasta) en orden de inicio", async () => {
    const repo = new InMemoryBloqueoRepository();
    await repo.crear(BLOQUEO_B);
    await repo.crear(BLOQUEO_A);

    const todos = await repo.listar();
    expect(todos.map((b) => b.id)).toEqual([BLOQUEO_A.id, BLOQUEO_B.id]);

    const intersectantes = await repo.listar({
      desde: new Date("2027-01-15T09:15:00.000Z"),
      hasta: new Date("2027-01-15T10:15:00.000Z"),
    });
    expect(intersectantes.map((b) => b.id)).toEqual([BLOQUEO_A.id, BLOQUEO_B.id]);

    const contiguos = await repo.listar({
      desde: new Date("2027-01-15T09:30:00.000Z"),
      hasta: new Date("2027-01-15T10:00:00.000Z"),
    });
    expect(contiguos).toEqual([]);
  });

  it("busca solapados por profesional respetando contigüidad y recurso", async () => {
    const repo = new InMemoryBloqueoRepository();
    await repo.crear(BLOQUEO_A);
    await repo.crear(BLOQUEO_B);

    const intervalo = new Intervalo(
      new Date("2027-01-15T09:15:00.000Z"),
      new Date("2027-01-15T09:45:00.000Z"),
    );
    const solapados = await repo.buscarSolapadoPorProfesional(PROFESIONAL_A, intervalo);
    expect(solapados.map((b) => b.id)).toEqual([BLOQUEO_A.id]);

    const contiguo = new Intervalo(
      new Date("2027-01-15T09:30:00.000Z"),
      new Date("2027-01-15T10:00:00.000Z"),
    );
    expect(await repo.buscarSolapadoPorProfesional(PROFESIONAL_A, contiguo)).toEqual([]);
    expect(await repo.buscarSolapadoPorProfesional(PROFESIONAL_B, intervalo)).toEqual([]);
  });

  it("admite rangos con un solo límite y filtros por recurso", async () => {
    const repo = new InMemoryBloqueoRepository();
    await repo.crear(BLOQUEO_A);
    await repo.crear(BLOQUEO_B);

    expect((await repo.listar({ desde: new Date("2027-01-15T09:30:00.000Z") })).map((b) => b.id)).toEqual([
      BLOQUEO_B.id,
    ]);
    expect((await repo.listar({ hasta: new Date("2027-01-15T10:00:00.000Z") })).map((b) => b.id)).toEqual([
      BLOQUEO_A.id,
    ]);
    expect((await repo.listar({ profesionalId: PROFESIONAL_A })).map((b) => b.id)).toEqual([BLOQUEO_A.id]);
    expect((await repo.listar({ sillonId: SILLON_B })).map((b) => b.id)).toEqual([BLOQUEO_B.id]);
    expect(await repo.listar({ profesionalId: "00000000-0000-4000-8000-000000000099" })).toEqual([]);
  });

  it("busca solapados por sillón y elimina físicamente", async () => {
    const repo = new InMemoryBloqueoRepository();
    await repo.crear(BLOQUEO_A);
    await repo.crear(BLOQUEO_B);

    const intervalo = new Intervalo(
      new Date("2027-01-15T10:15:00.000Z"),
      new Date("2027-01-15T10:45:00.000Z"),
    );
    expect((await repo.buscarSolapadoPorSillon(SILLON_B, intervalo)).map((b) => b.id)).toEqual([
      BLOQUEO_B.id,
    ]);
    expect(await repo.buscarSolapadoPorSillon(SILLON_A, intervalo)).toEqual([]);

    await repo.eliminar(BLOQUEO_A.id);
    expect(await repo.buscarPorId(BLOQUEO_A.id)).toBeUndefined();
    expect((await repo.listar()).map((b) => b.id)).toEqual([BLOQUEO_B.id]);
    expect(await repo.buscarSolapadoPorProfesional(PROFESIONAL_A, intervalo)).toEqual([]);
  });

  it("eliminar un id inexistente no altera el repositorio", async () => {
    const repo = new InMemoryBloqueoRepository();
    await repo.crear(BLOQUEO_A);

    await expect(repo.eliminar("00000000-0000-4000-8000-000000000099")).resolves.toBeUndefined();
    expect(await repo.listar()).toHaveLength(1);
  });
});
