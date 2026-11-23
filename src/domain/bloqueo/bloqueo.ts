import { Intervalo } from "../turno/intervalo.js";
import { IntervaloInvalidoError } from "../turno/turno.errors.js";
import {
  BloqueoIntervaloInvalidoError,
  BloqueoMotivoRequeridoError,
  BloqueoRecursoRequeridoError,
} from "./bloqueo.errors.js";

/** Reserva de un rango de agenda de un profesional y/o un sillón. */
export interface Bloqueo {
  id: string;
  profesionalId?: string;
  sillonId?: string;
  inicio: Date;
  fin: Date;
  motivo: string;
  creadoPor: string;
  createdAt: Date;
}

export type DatosBloqueo = Bloqueo;

/**
 * Crea un bloqueo validando que exista al menos un recurso y que el intervalo
 * sea válido. La regla temporal se delega en `Intervalo` ([inicio, fin)).
 */
export function crearBloqueo(datos: DatosBloqueo): Bloqueo {
  if (!datos.profesionalId && !datos.sillonId) {
    throw new BloqueoRecursoRequeridoError();
  }
  if (datos.motivo.trim().length === 0) {
    throw new BloqueoMotivoRequeridoError();
  }

  try {
    new Intervalo(datos.inicio, datos.fin);
  } catch (error) {
    if (error instanceof IntervaloInvalidoError) {
      throw new BloqueoIntervaloInvalidoError(error.message);
    }
    throw error;
  }

  return { ...datos };
}

/** Vista del bloqueo como intervalo semiabierto, para reutilizar su lógica temporal. */
export function intervaloDelBloqueo(bloqueo: Bloqueo): Intervalo {
  return new Intervalo(bloqueo.inicio, bloqueo.fin);
}

/** Un bloqueo se superpone con un intervalo cuando comparten tiempo abierto. */
export function bloqueoSeSuperponeConIntervalo(bloqueo: Bloqueo, intervalo: Intervalo): boolean {
  return intervaloDelBloqueo(bloqueo).seSuperponeCon(intervalo);
}
