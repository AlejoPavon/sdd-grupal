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

/** Días completos de la zona de negocio como intervalo UTC con el último día inclusive. */
export function rangoDeBloqueo(desde, hasta) {
  const { desde: inicio } = rangoDelDia(desde);
  const { hasta: fin } = rangoDelDia(hasta);
  if (desde >= hasta) throw new Error("Revisá las fechas: la fecha hasta debe ser posterior a la fecha desde.");
  return { inicio, fin };
}

/** Cuerpo exacto de POST /api/bloqueos; los días del formulario se convierten al rango UTC. */
export function cuerpoBloqueo(datos) {
  const { inicio, fin } = rangoDeBloqueo(datos.desde, datos.hasta);
  return { profesionalId: datos.profesionalId, inicio, fin, motivo: datos.motivo };
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
      return ["catalogos", "bloqueos"];
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

export function persona(item) {
  return `${item.nombre} ${item.apellido ?? ""}`.trim();
}

export function opcionesSelect(items, seleccionado, textoVacio, etiqueta = (item) => item.nombre) {
  const inicio = textoVacio ? `<option value="">${escapar(textoVacio)}</option>` : "";
  return (
    inicio +
    items
      .map((item) => {
        const marcado = item.id === seleccionado ? " selected" : "";
        return `<option value="${escapar(item.id)}"${marcado}>${escapar(etiqueta(item))}</option>`;
      })
      .join("")
  );
}

export function htmlFormularioBloqueo(profesionales, hoy) {
  return `<form class="card form" data-formulario="nuevo-bloqueo">
    <h2>Nuevo bloqueo</h2>
    <label>Profesional
      <select name="profesionalId" required>${opcionesSelect(profesionales, "", "Seleccioná un profesional", persona)}</select>
    </label>
    <label>Desde
      <input name="desde" type="date" value="${escapar(hoy)}" required />
    </label>
    <label>Hasta
      <input name="hasta" type="date" value="${escapar(hoy)}" required />
    </label>
    <label>Motivo
      <input name="motivo" required />
    </label>
    <button class="primary" type="submit">Guardar bloqueo</button>
  </form>`;
}

function nombreEnCatalogo(items, id) {
  return items.find((item) => item.id === id)?.nombre ?? id;
}

export function rutaEliminarBloqueo(id) {
  return `/api/bloqueos/${encodeURIComponent(id)}`;
}

/** Solo administración puede borrar; el servidor sigue siendo la autoridad. */
export function puedeEliminarBloqueo(rol) {
  return esGestion(rol) && rol === "administrador";
}

/** Ejemplo de presentación: nunca se envía a la API ni se agrega al estado. */
export function bloqueoEjemplo(profesionales) {
  const primero = profesionales[0];
  if (!primero) return null;
  return {
    id: "ejemplo",
    profesionalId: primero.id,
    sillonId: null,
    inicio: "2027-03-15T03:00:00.000Z",
    fin: "2027-03-17T12:00:00.000Z",
    motivo: "Ejemplo: bloqueo de profesional del 15 al 17 de marzo",
    ejemplo: true,
  };
}

export function htmlFilaBloqueo(bloqueo, opciones = {}) {
  const { profesionales = [], sillones = [], puedeEliminar = false } = opciones;
  const profesional = bloqueo.profesionalId ? nombreEnCatalogo(profesionales, bloqueo.profesionalId) : "—";
  const sillon = bloqueo.sillonId ? nombreEnCatalogo(sillones, bloqueo.sillonId) : "—";
  const etiqueta = bloqueo.ejemplo ? '<span class="badge">Ejemplo</span> ' : "";
  const accion =
    puedeEliminar && !bloqueo.ejemplo
      ? `<button class="danger" data-accion="eliminar-bloqueo" data-id="${escapar(bloqueo.id)}">Eliminar</button>`
      : "—";
  return `<tr${bloqueo.ejemplo ? ' class="muted"' : ""}>
    <td>${escapar(formatearFecha(bloqueo.inicio))}</td>
    <td>${escapar(formatearHora(bloqueo.inicio))} – ${escapar(formatearHora(bloqueo.fin))}</td>
    <td>${etiqueta}${escapar(profesional)}</td>
    <td>${escapar(sillon)}</td>
    <td>${escapar(bloqueo.motivo)}</td>
    <td>${accion}</td>
  </tr>`;
}

/** Cuerpo de la tabla: el ejemplo va primero y no altera los bloqueos reales. */
export function htmlCuerpoBloqueos(bloqueos, profesionales, opciones = {}) {
  const ejemplo = bloqueoEjemplo(profesionales);
  return [
    ...(ejemplo ? [htmlFilaBloqueo(ejemplo, { profesionales, ...opciones })] : []),
    ...bloqueos.map((bloqueo) => htmlFilaBloqueo(bloqueo, { profesionales, ...opciones })),
  ].join("");
}
