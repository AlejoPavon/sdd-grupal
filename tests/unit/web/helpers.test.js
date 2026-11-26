import { describe, expect, it } from "vitest";
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
    expect(cargasPorVista("agenda")).toEqual(["agenda"]);
    expect(cargasPorVista("bloqueos")).toEqual(["bloqueos"]);
    expect(cargasPorVista("desconocida")).toEqual([]);
  });
});
