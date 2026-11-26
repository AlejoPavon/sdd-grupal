import { describe, expect, it } from "vitest";
import {
  bloqueoEjemplo,
  cargasPorVista,
  cuerpoBloqueo,
  detalleConflicto,
  escapar,
  esGestion,
  formatearFecha,
  formatearHora,
  hoyEnZona,
  htmlCuerpoBloqueos,
  htmlFilaBloqueo,
  htmlFormularioBloqueo,
  isoDesdeLocal,
  mensajeError,
  puedeEliminarBloqueo,
  rangoDeBloqueo,
  rangoDelDia,
  rutaEliminarBloqueo,
} from "../../../web/helpers.js";

describe("helpers del frontend", () => {
  it("muestra hora y fecha en la zona de negocio", () => {
    const iso = "2027-03-01T12:00:00.000Z";
    expect(formatearHora(iso)).toBe("09:00");
    expect(formatearFecha(iso)).toBe("01/03/2027");
  });

  it("convierte un día de la zona en un rango UTC semiabierto", () => {
    expect(rangoDelDia("2027-03-01")).toEqual({
      desde: "2027-03-01T03:00:00.000Z",
      hasta: "2027-03-02T03:00:00.000Z",
    });
  });

  it("interpreta la fecha del formulario como hora local de la zona", () => {
    expect(isoDesdeLocal("2027-03-01T09:00")).toBe("2027-03-01T12:00:00.000Z");
  });

  it("rechaza fechas mal formadas", () => {
    expect(() => isoDesdeLocal("no-es-fecha")).toThrow("fecha y hora válidas");
    expect(() => rangoDelDia("2027-2-1")).toThrow("Fecha inválida");
  });

  it("calcula el día actual en la zona", () => {
    expect(hoyEnZona(new Date("2027-03-01T02:00:00.000Z"))).toBe("2027-02-28");
  });

  it("traduce códigos de error a mensajes de usuario", () => {
    expect(mensajeError({}, 401)).toBe("Tu sesión expiró. Iniciá sesión nuevamente.");
    expect(mensajeError({}, 403)).toBe("No tenés permiso para realizar esta acción.");
    expect(mensajeError({ code: "VALIDACION_FALLIDA" }, 400)).toBe("Revisá los datos ingresados.");
    expect(mensajeError({ code: "TURNO_SOLAPADO_SILLON", message: "Ocupado" }, 409)).toBe(
      "El sillón ya tiene un turno en ese horario.",
    );
    expect(mensajeError({ message: "Recurso no encontrado" }, 404)).toBe("Recurso no encontrado");
  });

  it("describe el turno en conflicto", () => {
    expect(
      detalleConflicto({
        details: {
          turnoEnConflicto: {
            inicio: "2027-03-01T12:00:00.000Z",
            fin: "2027-03-01T12:30:00.000Z",
          },
        },
      }),
    ).toBe("Conflicto con el turno de 09:00 a 09:30.");
    expect(detalleConflicto({ details: {} })).toBe("");
  });

  it("restringe las acciones de gestión por rol", () => {
    expect(esGestion("administrador")).toBe(true);
    expect(esGestion("recepcionista")).toBe(true);
    expect(esGestion("profesional")).toBe(false);
  });

  it("escapa datos dinámicos antes de insertarlos en el DOM", () => {
    expect(escapar('<b>"&\'</b>')).toBe("&lt;b&gt;&quot;&amp;&#39;&lt;/b&gt;");
  });

  it("recarga pacientes sin filtro al abrir nuevo turno", () => {
    expect(cargasPorVista("nuevo-turno")).toEqual(["catalogos", "pacientes"]);
    expect(cargasPorVista("pacientes")).toEqual(["pacientes"]);
    expect(cargasPorVista("agenda")).toEqual(["catalogos", "pacientes", "agenda"]);
    expect(cargasPorVista("bloqueos")).toEqual(["catalogos", "bloqueos"]);
    expect(cargasPorVista("desconocida")).toEqual([]);
  });
});

describe("rango de bloqueo del formulario", () => {
  it("convierte días completos en un intervalo UTC con el último día inclusive", () => {
    expect(rangoDeBloqueo("2027-03-01", "2027-03-03")).toEqual({
      inicio: "2027-03-01T03:00:00.000Z",
      fin: "2027-03-04T03:00:00.000Z",
    });
  });

  it("rechaza un rango invertido o de un solo día", () => {
    expect(() => rangoDeBloqueo("2027-03-03", "2027-03-01")).toThrow(/posterior/i);
    expect(() => rangoDeBloqueo("2027-03-01", "2027-03-01")).toThrow(/posterior/i);
  });

  it("mantiene el extremo final inclusive al cruzar mes y año", () => {
    expect(rangoDeBloqueo("2027-06-15", "2027-07-02")).toEqual({
      inicio: "2027-06-15T03:00:00.000Z",
      fin: "2027-07-03T03:00:00.000Z",
    });
    expect(rangoDeBloqueo("2027-12-31", "2028-01-02")).toEqual({
      inicio: "2027-12-31T03:00:00.000Z",
      fin: "2028-01-03T03:00:00.000Z",
    });
  });

  it("rechaza fechas mal formadas antes de comparar el rango", () => {
    expect(() => rangoDeBloqueo("2027-2-1", "2027-03-03")).toThrow("Fecha inválida");
    expect(() => rangoDeBloqueo("2027-03-01", undefined)).toThrow("Fecha inválida");
  });
});

describe("formulario de alta de bloqueos", () => {
  const profesionales = [
    { id: "pro-1", nombre: "Ana", apellido: "Pérez" },
    { id: "pro-2", nombre: "Luis", apellido: "Gómez" },
  ];

  it("muestra el formulario y el selector con opción inicial aunque no haya profesionales", () => {
    const html = htmlFormularioBloqueo([], "2027-03-01");
    expect(html).toContain('data-formulario="nuevo-bloqueo"');
    expect(html).toContain('name="profesionalId"');
    expect(html).toContain('<option value="">Seleccioná un profesional</option>');
    expect(html).not.toContain('<option value="pro-1"');
  });

  it("muestra el catálogo con nombre y apellido sin preseleccionar nadie", () => {
    const html = htmlFormularioBloqueo(profesionales, "2027-03-01");
    expect(html).toContain('<option value="pro-1">Ana Pérez</option>');
    expect(html).toContain('<option value="pro-2">Luis Gómez</option>');
    expect(html).not.toContain(" selected");
  });

  it("inicializa desde y hasta con el día de la zona y exige un motivo", () => {
    const html = htmlFormularioBloqueo(profesionales, "2027-03-01");
    expect(html).toMatch(/name="desde"\s+type="date"\s+value="2027-03-01"\s+required/);
    expect(html).toMatch(/name="hasta"\s+type="date"\s+value="2027-03-01"\s+required/);
    expect(html).toMatch(/name="motivo"[^>]*required/);
    expect(html).toContain("Guardar bloqueo");
  });

  it("respeta otro día inicial aunque el catálogo esté vacío", () => {
    const html = htmlFormularioBloqueo([], "2027-12-31");
    expect(html).toContain('name="desde" type="date" value="2027-12-31"');
    expect(html).toContain('name="hasta" type="date" value="2027-12-31"');
    expect(html).toMatch(/name="motivo"[^>]*required/);
  });
});

describe("cuerpo del alta de bloqueos", () => {
  it("envía profesional, rango UTC y motivo al crear un bloqueo", () => {
    expect(
      cuerpoBloqueo({ profesionalId: "pro-1", desde: "2027-03-01", hasta: "2027-03-03", motivo: "Control" }),
    ).toEqual({
      profesionalId: "pro-1",
      inicio: "2027-03-01T03:00:00.000Z",
      fin: "2027-03-04T03:00:00.000Z",
      motivo: "Control",
    });
  });

  it("impide armar el cuerpo con un rango invertido o de un solo día", () => {
    expect(() =>
      cuerpoBloqueo({ profesionalId: "pro-1", desde: "2027-03-05", hasta: "2027-03-02", motivo: "Control" }),
    ).toThrow("Revisá las fechas: la fecha hasta debe ser posterior a la fecha desde.");
    expect(() =>
      cuerpoBloqueo({ profesionalId: "pro-1", desde: "2027-12-31", hasta: "2027-12-31", motivo: "Control" }),
    ).toThrow("Revisá las fechas: la fecha hasta debe ser posterior a la fecha desde.");
  });

  it("no propaga campos del ejemplo ni campos ajenos al cuerpo", () => {
    expect(
      cuerpoBloqueo({
        id: "ejemplo",
        ejemplo: true,
        profesionalId: "pro-2",
        desde: "2027-06-15",
        hasta: "2027-06-16",
        motivo: "Vacaciones",
        extra: "no-enviar",
      }),
    ).toEqual({
      profesionalId: "pro-2",
      inicio: "2027-06-15T03:00:00.000Z",
      fin: "2027-06-17T03:00:00.000Z",
      motivo: "Vacaciones",
    });
  });
});

describe("fila de bloqueo y acciones por rol", () => {
  const profesionales = [
    { id: "pro-1", nombre: "Ana", apellido: "Pérez" },
    { id: "pro-2", nombre: "Luis", apellido: "Gómez" },
  ];
  const bloqueo = {
    id: "blo-1",
    inicio: "2027-03-01T03:00:00.000Z",
    fin: "2027-03-01T12:00:00.000Z",
    profesionalId: "pro-1",
    sillonId: null,
    motivo: "Control",
  };

  it("muestra eliminar solo para administración", () => {
    expect(puedeEliminarBloqueo("administrador")).toBe(true);
    expect(puedeEliminarBloqueo("recepcionista")).toBe(false);
    expect(puedeEliminarBloqueo("profesional")).toBe(false);
    expect(puedeEliminarBloqueo(null)).toBe(false);

    const admin = htmlFilaBloqueo(bloqueo, {
      profesionales,
      puedeEliminar: puedeEliminarBloqueo("administrador"),
    });
    expect(admin).toContain('data-accion="eliminar-bloqueo"');
    expect(admin).toContain('data-id="blo-1"');

    const recepcion = htmlFilaBloqueo(bloqueo, {
      profesionales,
      puedeEliminar: puedeEliminarBloqueo("recepcionista"),
    });
    expect(recepcion).not.toContain("eliminar-bloqueo");
    expect(recepcion).toContain("Control");
  });

  it("codifica el id del bloqueo en la ruta de eliminación", () => {
    expect(rutaEliminarBloqueo("blo-1")).toBe("/api/bloqueos/blo-1");
    expect(rutaEliminarBloqueo("blo/1?x=2")).toBe("/api/bloqueos/blo%2F1%3Fx%3D2");
  });

  it("muestra fecha, profesional y sillón del catálogo y escapa el motivo", () => {
    const html = htmlFilaBloqueo(
      { ...bloqueo, motivo: "<Control>", sillonId: "si-1" },
      {
        profesionales,
        sillones: [{ id: "si-1", nombre: "Sillón 1" }],
        puedeEliminar: true,
      },
    );
    expect(html).toContain("01/03/2027");
    expect(html).toContain(">Ana<");
    expect(html).toContain("Sillón 1");
    expect(html).toContain("&lt;Control&gt;");
    expect(html).toContain("00:00");
  });
});

describe("bloqueo ilustrativo", () => {
  const profesionales = [
    { id: "pro-1", nombre: "Ana", apellido: "Pérez" },
    { id: "pro-2", nombre: "Luis", apellido: "Gómez" },
  ];
  const real = {
    id: "blo-1",
    inicio: "2027-03-20T03:00:00.000Z",
    fin: "2027-03-20T12:00:00.000Z",
    profesionalId: "pro-2",
    sillonId: null,
    motivo: "Control real",
  };

  it("usa el primer profesional y fechas demo fijas, etiquetado como ejemplo", () => {
    expect(bloqueoEjemplo(profesionales)).toEqual({
      id: "ejemplo",
      profesionalId: "pro-1",
      sillonId: null,
      inicio: "2027-03-15T03:00:00.000Z",
      fin: "2027-03-17T12:00:00.000Z",
      motivo: "Ejemplo: bloqueo de profesional del 15 al 17 de marzo",
      ejemplo: true,
    });

    const html = htmlCuerpoBloqueos([], profesionales, { puedeEliminar: true });
    expect(html).toContain("Ejemplo");
    expect(html).toContain('>Ejemplo</span> Ana</td>');
    expect(html).toContain("15/03/2027");
    expect(html).toContain("00:00 – 09:00");
    expect(html).not.toContain("eliminar-bloqueo");
  });

  it("se omite sin catálogo y nunca ofrece borrado ni se mezcla con los reales", () => {
    expect(bloqueoEjemplo([])).toBeNull();
    expect(htmlCuerpoBloqueos([], [], { puedeEliminar: true })).toBe("");

    const html = htmlCuerpoBloqueos([real], profesionales, { puedeEliminar: true });
    expect(html.match(/data-accion="eliminar-bloqueo"/g)).toHaveLength(1);
    expect(html).toContain('data-id="blo-1"');
    expect(html).toContain("Control real");
    expect(html.indexOf("Ejemplo")).toBeLessThan(html.indexOf("blo-1"));
    expect(html).toContain(">Luis<");
  });
});
