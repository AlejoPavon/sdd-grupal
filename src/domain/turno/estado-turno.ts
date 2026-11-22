export const ESTADOS_TURNO = [
  "pendiente",
  "confirmado",
  "atendido",
  "cancelado",
  "ausente",
] as const;

export type EstadoTurno = (typeof ESTADOS_TURNO)[number];

const TRANSICIONES: Record<EstadoTurno, readonly EstadoTurno[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["atendido", "cancelado", "ausente"],
  atendido: [],
  cancelado: [],
  ausente: [],
};

export function puedeTransicionarA(desde: EstadoTurno, hacia: EstadoTurno): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

export function ocupaAgenda(estado: EstadoTurno): boolean {
  return estado === "pendiente" || estado === "confirmado";
}