/** Utilidades puras del cliente. Zona de negocio: America/Argentina/Buenos_Aires. */

export const ZONA_NEGOCIO = "America/Argentina/Buenos_Aires";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function offsetEnZona(fecha) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_NEGOCIO,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(fecha);

  const valores = {};
  for (const { type, value } of partes) {
    if (type !== "literal") valores[type] = value;
  }

  const enZonaComoUtc = Date.UTC(
    Number(valores.year),
    Number(valores.month) - 1,
    Number(valores.day),
    Number(valores.hour) % 24,
    Number(valores.minute),
    Number(valores.second),
  );
  return enZonaComoUtc - Math.floor(fecha.getTime() / 1000) * 1000;
}

function fechaDesdeComponentes(anio, mes, dia, hora = 0, minuto = 0) {
  const aproximada = Date.UTC(anio, mes - 1, dia, hora, minuto);
  const fecha = new Date(aproximada - offsetEnZona(new Date(aproximada)));
  if (Number.isNaN(fecha.getTime())) throw new Error("Fecha inválida");
  return fecha;
}

export function formatearHora(iso) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_NEGOCIO,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatearFecha(iso) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_NEGOCIO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function hoyEnZona(fecha = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_NEGOCIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

/** Un día de la zona de negocio como intervalo [inicio, fin) en ISO 8601 UTC. */
export function rangoDelDia(fecha) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha ?? "");
  if (!coincidencia) throw new Error("Fecha inválida");
  const [, anio, mes, dia] = coincidencia.map(Number);
  const desde = fechaDesdeComponentes(anio, mes, dia);
  return { desde: desde.toISOString(), hasta: new Date(desde.getTime() + MS_POR_DIA).toISOString() };
}

/** `YYYY-MM-DDTHH:mm` del formulario se interpreta en la zona de negocio. */
export function isoDesdeLocal(valor) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(valor ?? "");
  if (!coincidencia) throw new Error("Ingresá una fecha y hora válidas");
  const [, anio, mes, dia, hora, minuto] = coincidencia.map(Number);
  return fechaDesdeComponentes(anio, mes, dia, hora, minuto).toISOString();
}

export function mensajeError(datos, estado) {
  if (estado === 401) return "Tu sesión expiró. Iniciá sesión nuevamente.";
  if (estado === 403) return "No tenés permiso para realizar esta acción.";
  if (datos?.code === "VALIDACION_FALLIDA") return "Revisá los datos ingresados.";
  if (datos?.code === "TURNO_SOLAPADO_SILLON") return "El sillón ya tiene un turno en ese horario.";
  return datos?.message ?? "No se pudo completar la operación.";
}

export function detalleConflicto(datos) {
  const turno = datos?.details?.turnoEnConflicto;
  if (!turno?.inicio) return "";
  return `Conflicto con el turno de ${formatearHora(turno.inicio)} a ${formatearHora(turno.fin)}.`;
}

export function esGestion(rol) {
  return rol === "administrador" || rol === "recepcionista";
}

/** Datos que debe recargar cada vista; nuevo turno necesita el listado completo de pacientes. */
export function cargasPorVista(vista) {
  switch (vista) {
    case "agenda":
      return ["agenda"];
    case "pacientes":
      return ["pacientes"];
    case "nuevo-turno":
      return ["catalogos", "pacientes"];
    case "bloqueos":
      return ["bloqueos"];
    default:
      return [];
  }
}

export function escapar(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
