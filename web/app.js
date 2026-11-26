import {
  cargasPorVista,
  detalleConflicto,
  escapar,
  esGestion,
  formatearFecha,
  formatearHora,
  hoyEnZona,
  isoDesdeLocal,
  mensajeError,
  rangoDelDia,
} from "./helpers.js";

const ROL = {
  administrador: "Administrador",
  recepcionista: "Recepcionista",
  profesional: "Profesional",
};

const ESTADO_TURNO = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  atendido: "Atendido",
  cancelado: "Cancelado",
  ausente: "Ausente",
};

const estado = {
  usuario: null,
  vista: "login",
  filtros: { fecha: hoyEnZona(), profesionalId: "" },
  profesionales: [],
  sillones: [],
  prestaciones: [],
  pacientes: [],
  turnos: [],
  bloqueos: [],
};

const app = () => document.querySelector("#app");

async function api(ruta, opciones = {}) {
  const cabeceras = { Accept: "application/json" };
  if (opciones.body !== undefined) cabeceras["Content-Type"] = "application/json";

  const respuesta = await fetch(ruta, {
    credentials: "same-origin",
    ...opciones,
    headers: { ...cabeceras, ...opciones.headers },
  });
  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(mensajeError(datos, respuesta.status));
    error.datos = datos;
    error.estado = respuesta.status;
    throw error;
  }
  return datos;
}

function notificar(texto, tipo = "info") {
  const area = document.querySelector("#mensaje");
  area.textContent = texto;
  area.className = `mensaje visible ${tipo}`;
  if (tipo === "exito") {
    window.setTimeout(() => {
      if (area.textContent === texto) {
        area.textContent = "";
        area.className = "mensaje";
      }
    }, 5000);
  }
}

function manejarError(error) {
  const detalle = detalleConflicto(error.datos);
  notificar(detalle ? `${error.message} ${detalle}` : error.message, "error");
  if (error.estado === 401) {
    estado.usuario = null;
    estado.vista = "login";
  }
}

function persona(item) {
  return `${item.nombre} ${item.apellido ?? ""}`.trim();
}

function nombreProfesional(id) {
  return estado.profesionales.find((item) => item.id === id)?.nombre ?? id;
}

function nombreSillon(id) {
  return estado.sillones.find((item) => item.id === id)?.nombre ?? id;
}

function opcionesSelect(items, seleccionado, textoVacio, etiqueta = (item) => item.nombre) {
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

function navegacion() {
  const items = [
    ["agenda", "Agenda"],
    ["pacientes", "Pacientes"],
    ["nuevo-turno", "Nuevo turno"],
  ];
  if (esGestion(estado.usuario.rol)) items.push(["bloqueos", "Bloqueos"]);

  return `<nav class="tabs" aria-label="Secciones">
    ${items
      .map(
        ([vista, texto]) =>
          `<button class="${estado.vista === vista ? "primary" : "ghost"}" data-accion="nav" data-vista="${vista}" aria-current="${estado.vista === vista ? "page" : "false"}">${texto}</button>`,
      )
      .join("")}
  </nav>`;
}

function renderSesion() {
  const area = document.querySelector("#sesion");
  if (!estado.usuario) {
    area.innerHTML = '<span class="muted">Sin sesión</span>';
    return;
  }
  const inicial = estado.usuario.nombre?.[0] ?? "?";
  area.innerHTML = `
    <span class="avatar" aria-hidden="true">${escapar(inicial)}</span>
    <span><strong>${escapar(persona(estado.usuario))}</strong><small>${escapar(ROL[estado.usuario.rol] ?? estado.usuario.rol)}</small></span>
    <button class="ghost" data-accion="logout">Salir</button>`;
}

function vistaLogin() {
  return `<section class="card login">
    <div>
      <p class="eyebrow">Acceso al consultorio</p>
      <h1>Agenda de turnos</h1>
      <p class="muted">Gestioná pacientes, turnos y bloqueos desde una sola pantalla, sin perder el control de los horarios.</p>
      <p class="demo">Demo: <code>admin@demo.local</code> / <code>demo1234</code></p>
    </div>
    <form class="form" data-formulario="login">
      <label>Correo electrónico
        <input name="email" type="email" value="admin@demo.local" autocomplete="username" required />
      </label>
      <label>Contraseña
        <input name="password" type="password" value="demo1234" autocomplete="current-password" required />
      </label>
      <button class="primary" type="submit">Ingresar</button>
    </form>
  </section>`;
}

function tablaTurnos() {
  if (estado.turnos.length === 0) {
    return '<p class="empty">No hay turnos para la fecha y el profesional seleccionados.</p>';
  }
  const puedeCancelar = esGestion(estado.usuario.rol);
  const filas = estado.turnos
    .map((turno) => {
      const cancelable = puedeCancelar && ["pendiente", "confirmado"].includes(turno.estado);
      const paciente = turno.paciente ? persona(turno.paciente) : turno.pacienteId;
      return `<tr>
        <td><strong>${escapar(formatearHora(turno.inicio))}</strong><br /><span class="muted">${escapar(formatearHora(turno.fin))}</span></td>
        <td>${escapar(paciente)}</td>
        <td>${escapar(turno.prestacion?.nombre ?? "—")}</td>
        <td>${escapar(nombreProfesional(turno.profesionalId))}</td>
        <td>${escapar(nombreSillon(turno.sillonId))}</td>
        <td><span class="badge ${escapar(turno.estado)}">${escapar(ESTADO_TURNO[turno.estado] ?? turno.estado)}</span></td>
        <td>${cancelable ? `<button class="danger" data-accion="cancelar" data-id="${escapar(turno.id)}">Cancelar</button>` : "—"}</td>
      </tr>`;
    })
    .join("");

  return `<table>
    <thead><tr><th>Hora</th><th>Paciente</th><th>Prestación</th><th>Profesional</th><th>Sillón</th><th>Estado</th><th>Acciones</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}

function vistaAgenda() {
  return `${navegacion()}
  <section class="page">
    <div class="page-head">
      <p class="eyebrow">Agenda</p>
      <h1>Turnos del día</h1>
      <p class="muted">Los turnos se muestran en la zona horaria del consultorio.</p>
    </div>
    <form class="toolbar card" data-formulario="filtro-agenda">
      <label>Fecha
        <input type="date" name="fecha" value="${escapar(estado.filtros.fecha)}" required />
      </label>
      <label>Profesional
        <select name="profesionalId">${opcionesSelect(estado.profesionales, estado.filtros.profesionalId, "Todos los profesionales")}</select>
      </label>
      <button class="primary" type="submit">Buscar</button>
    </form>
    <div class="card table-card">${tablaTurnos()}</div>
  </section>`;
}

function tablaPacientes() {
  if (estado.pacientes.length === 0) {
    return '<p class="empty">Todavía no hay pacientes para mostrar.</p>';
  }
  const filas = estado.pacientes
    .map(
      (paciente) => `<tr>
        <td><strong>${escapar(persona(paciente))}</strong></td>
        <td>${escapar(paciente.documento ?? "—")}</td>
        <td>${escapar(paciente.email ?? "—")}</td>
        <td>${escapar(paciente.telefono ?? "—")}</td>
        <td>${paciente.activo ? '<span class="badge">Activo</span>' : '<span class="badge cancelado">Inactivo</span>'}</td>
      </tr>`,
    )
    .join("");
  return `<table>
    <thead><tr><th>Paciente</th><th>Documento</th><th>Correo</th><th>Teléfono</th><th>Estado</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}

function vistaPacientes() {
  return `${navegacion()}
  <section class="page">
    <div class="page-head">
      <p class="eyebrow">Pacientes</p>
      <h1>Pacientes del consultorio</h1>
      <p class="muted">Usá solo datos ficticios en las demostraciones.</p>
    </div>
    <form class="card form" data-formulario="buscar-paciente">
      <label>Buscar por nombre, apellido o documento
        <input name="q" placeholder="Ej.: Demo" autocomplete="off" />
      </label>
      <button type="submit">Buscar</button>
    </form>
    <div class="stack" style="margin-top:16px">
      <form class="card form" data-formulario="nuevo-paciente">
        <h2>Nuevo paciente</h2>
        <label>Nombre <input name="nombre" required /></label>
        <label>Apellido <input name="apellido" required /></label>
        <label>Documento <input name="documento" /></label>
        <label>Correo electrónico <input name="email" type="email" /></label>
        <label>Teléfono <input name="telefono" /></label>
        <button class="primary" type="submit">Guardar paciente</button>
      </form>
      <div class="card table-card">${tablaPacientes()}</div>
    </div>
  </section>`;
}

function vistaNuevoTurno() {
  return `${navegacion()}
  <section class="page">
    <div class="page-head">
      <p class="eyebrow">Recepción</p>
      <h1>Nuevo turno</h1>
      <p class="muted">La agenda rechaza solapamientos de profesional y de sillón.</p>
    </div>
    <form class="card form" data-formulario="nuevo-turno">
      <label>Paciente
        <select name="pacienteId" required>${opcionesSelect(estado.pacientes, "", "Seleccioná un paciente", persona)}</select>
      </label>
      <label>Profesional
        <select name="profesionalId" required>${opcionesSelect(estado.profesionales, "", "Seleccioná un profesional", persona)}</select>
      </label>
      <label>Sillón
        <select name="sillonId" required>${opcionesSelect(estado.sillones, "", "Seleccioná un sillón")}</select>
      </label>
      <label>Prestación
        <select name="prestacionId" required>${opcionesSelect(estado.prestaciones, "", "Seleccioná una prestación", (item) => `${item.nombre} (${item.duracionMinutos} min)`)}</select>
      </label>
      <label>Fecha y hora
        <input name="inicio" type="datetime-local" value="${hoyEnZona()}T09:00" required />
      </label>
      <button class="primary" type="submit">Guardar turno</button>
    </form>
  </section>`;
}

function vistaBloqueos() {
  if (!esGestion(estado.usuario.rol)) {
    return `${navegacion()}<section class="page"><div class="card"><h1>Sin permiso</h1><p class="muted">Solo administración y recepción pueden ver los bloqueos.</p></div></section>`;
  }

  if (estado.bloqueos.length === 0) {
    return `${navegacion()}<section class="page"><div class="page-head"><p class="eyebrow">Agenda</p><h1>Bloqueos</h1></div><div class="card"><p class="empty">No hay bloqueos registrados.</p></div></section>`;
  }

  const filas = estado.bloqueos
    .map(
      (bloqueo) => `<tr>
        <td>${escapar(formatearFecha(bloqueo.inicio))}</td>
        <td>${escapar(formatearHora(bloqueo.inicio))} – ${escapar(formatearHora(bloqueo.fin))}</td>
        <td>${escapar(bloqueo.profesionalId ? nombreProfesional(bloqueo.profesionalId) : "—")}</td>
        <td>${escapar(bloqueo.sillonId ? nombreSillon(bloqueo.sillonId) : "—")}</td>
        <td>${escapar(bloqueo.motivo)}</td>
      </tr>`,
    )
    .join("");

  return `${navegacion()}
  <section class="page">
    <div class="page-head"><p class="eyebrow">Agenda</p><h1>Bloqueos</h1></div>
    <div class="card table-card"><table>
      <thead><tr><th>Fecha</th><th>Horario</th><th>Profesional</th><th>Sillón</th><th>Motivo</th></tr></thead>
      <tbody>${filas}</tbody>
    </table></div>
  </section>`;
}

function render() {
  renderSesion();
  if (!estado.usuario) {
    estado.vista = "login";
    app().innerHTML = vistaLogin();
    return;
  }
  const vistas = {
    agenda: vistaAgenda,
    pacientes: vistaPacientes,
    "nuevo-turno": vistaNuevoTurno,
    bloqueos: vistaBloqueos,
  };
  app().innerHTML = (vistas[estado.vista] ?? vistaAgenda)();
}

async function cargarCatalogos() {
  const [profesionales, sillones, prestaciones] = await Promise.all([
    api("/api/profesionales"),
    api("/api/sillones"),
    api("/api/prestaciones"),
  ]);
  estado.profesionales = profesionales;
  estado.sillones = sillones;
  estado.prestaciones = prestaciones;
}

async function cargarPacientes(q = "") {
  const sufijo = q ? `?q=${encodeURIComponent(q)}` : "";
  estado.pacientes = await api(`/api/pacientes${sufijo}`);
}

async function cargarAgenda() {
  const { desde, hasta } = rangoDelDia(estado.filtros.fecha);
  const parametros = new URLSearchParams({ desde, hasta });
  if (estado.filtros.profesionalId) parametros.set("profesionalId", estado.filtros.profesionalId);
  estado.turnos = await api(`/api/turnos?${parametros}`);
}

async function cargarBloqueos() {
  estado.bloqueos = await api("/api/bloqueos");
}

async function cargarVista() {
  const cargas = {
    catalogos: cargarCatalogos,
    pacientes: () => cargarPacientes(),
    agenda: cargarAgenda,
    bloqueos: cargarBloqueos,
  };
  try {
    await Promise.all(cargasPorVista(estado.vista).map((nombre) => cargas[nombre]()));
  } catch (error) {
    manejarError(error);
  }
  render();
}

function cuerpoPaciente(datos) {
  const cuerpo = { nombre: datos.nombre.trim(), apellido: datos.apellido.trim() };
  for (const campo of ["documento", "email", "telefono"]) {
    const valor = datos[campo]?.trim();
    if (valor) cuerpo[campo] = valor;
  }
  return cuerpo;
}

document.addEventListener("click", async (evento) => {
  const boton = evento.target instanceof Element ? evento.target.closest("[data-accion]") : null;
  if (!boton) return;

  if (boton.dataset.accion === "nav") {
    estado.vista = boton.dataset.vista ?? "agenda";
    await cargarVista();
    return;
  }

  if (boton.dataset.accion === "logout") {
    try {
      await api("/api/auth/logout", { method: "POST" });
      notificar("Sesión cerrada", "exito");
    } catch (error) {
      manejarError(error);
    }
    estado.usuario = null;
    estado.vista = "login";
    render();
    return;
  }

  if (boton.dataset.accion === "cancelar") {
    if (!window.confirm("¿Cancelar este turno? El horario quedará libre.")) return;
    const id = encodeURIComponent(boton.dataset.id ?? "");
    try {
      await api(`/api/turnos/${id}/cancelar`, { method: "PATCH" });
      notificar("Turno cancelado", "exito");
      await cargarAgenda();
    } catch (error) {
      manejarError(error);
    }
    render();
  }
});

document.addEventListener("submit", async (evento) => {
  const formulario = evento.target instanceof HTMLFormElement ? evento.target : null;
  if (!formulario?.dataset.formulario) return;
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(formulario));

  try {
    switch (formulario.dataset.formulario) {
      case "login": {
        estado.usuario = await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: datos.email, password: datos.password }),
        });
        await Promise.all([cargarCatalogos(), cargarPacientes()]);
        if (esGestion(estado.usuario.rol)) await cargarBloqueos();
        await cargarAgenda();
        estado.vista = "agenda";
        notificar(`Bienvenido/a, ${estado.usuario.nombre}`, "exito");
        break;
      }
      case "filtro-agenda": {
        estado.filtros.fecha = datos.fecha;
        estado.filtros.profesionalId = datos.profesionalId ?? "";
        await cargarAgenda();
        break;
      }
      case "buscar-paciente": {
        await cargarPacientes(datos.q?.trim() ?? "");
        break;
      }
      case "nuevo-paciente": {
        await api("/api/pacientes", { method: "POST", body: JSON.stringify(cuerpoPaciente(datos)) });
        notificar("Paciente guardado", "exito");
        await cargarPacientes();
        break;
      }
      case "nuevo-turno": {
        const cuerpo = {
          pacienteId: datos.pacienteId,
          profesionalId: datos.profesionalId,
          sillonId: datos.sillonId,
          prestacionId: datos.prestacionId,
          inicio: isoDesdeLocal(datos.inicio),
        };
        await api("/api/turnos", { method: "POST", body: JSON.stringify(cuerpo) });
        notificar("Turno guardado", "exito");
        estado.vista = "agenda";
        await cargarAgenda();
        break;
      }
    }
  } catch (error) {
    manejarError(error);
  }
  render();
});

async function iniciar() {
  render();
  try {
    estado.usuario = await api("/api/auth/me");
  } catch {
    estado.usuario = null;
  }

  if (estado.usuario) {
    try {
      await Promise.all([cargarCatalogos(), cargarPacientes()]);
      if (esGestion(estado.usuario.rol)) await cargarBloqueos();
      await cargarAgenda();
      estado.vista = "agenda";
    } catch (error) {
      manejarError(error);
    }
  }
  render();
}

iniciar();
