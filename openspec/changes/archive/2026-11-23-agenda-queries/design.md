# Design

## Context

El dominio, los repositorios en memoria y el servidor Fastify con `POST /api/turnos` y `/api/pacientes` ya existen (C-02, C-03, C-06). `InMemoryTurnoRepository.listar` ya soporta filtros por rango, profesional, sillón y estados, ordenando por `inicio`. No existe autenticación aún (C-09 posterior), por lo que no se aplica RBAC en esta etapa. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Exponer consulta de agenda por rango y por id, enriqueciendo la respuesta con paciente y prestación resumidos.
- Exponer listado de catálogos (profesionales, sillones, prestaciones).
- Reutilizar `InMemoryTurnoRepository.listar` y los repositorios existentes.
- Validar el rango en la capa de aplicación con código `RANGO_INVALIDO`.

**Non-Goals:**
- No se implementa autenticación/autorización (C-09).
- No se persiste en base de datos (C-10).
- No se incluyen bloqueos ni sobreturnos (C-07, C-08).
- No se agrega paginación ni ordenamiento configurable.

## UI Mockups

Decision: no (no UI)

## Decisions

- **Casos de uso en capa de aplicación.** `ListarTurnos` recibe repositorios y orquesta validación de rango, filtrado (estados por defecto `pendiente`/`confirmado`), orden y enriquecimiento. `ObtenerTurno` busca por id y lanza `RecursoNoEncontradoError("turno", id)`. `ListarProfesionales/Sillones/Prestaciones` delegan en sus repositorios. Alternativa: poner la lógica en los handlers; se descarta para mantener el dominio/aplicación aislados y testeables sin servidor.

- **Validación de rango en la aplicación.** Si se envían `desde` y `hasta` y `desde >= hasta`, se lanza `RangoInvalidoError` (código `RANGO_INVALIDO`), que el error handler mapea a `400`. Alternativa: validación Zod con refine (devolvería `VALIDACION_FALLIDA`); se descarta porque el spec exige el código `RANGO_INVALIDO`.

- **Estados por defecto.** `ListarTurnos` fuerza `estados = ["pendiente", "confirmado"]` salvo que se pase override; en esta etapa no se expone override por HTTP. Alternativa: permitir `estado` query param; se descarta por fuera de alcance.

- **Enriquecimiento en la aplicación.** `ListarTurnos` carga paciente y prestación por id para cada turno y arma un DTO de respuesta con `paciente { id, nombre, apellido }` y `prestacion { id, codigo, nombre, duracionMinutos }`. Si algún recurso falta (seed garantizado), se omite el resumen. Alternativa: exponer solo ids; se descarta por US-005 CA-4.

- **Rango como intersección.** Se reutiliza el filtro existente del repositorio (`t.fin > desde && t.inicio < hasta`), que implementa intersección semiabierta. Alternativa: filtrar en memoria en el caso de uso; se descarta por duplicación.

- **Catálogos como capability separada.** Se crea `catalogos` en lugar de extender `turnos`, porque profesionales/sillones/prestaciones son recursos de referencia reutilizables por otros changes (bloqueos, disponibilidad). Alternativa: extender `turnos`; se descarta para mantener una frontera cohesiva.

- **Schema Zod de query.** `turnoQuerySchema` valida `desde`/`hasta` como `z.string().datetime().optional()`, `profesionalId`/`sillonId` como `z.string().uuid().optional()`. El handler convierte a `Date`. El rango se valida en la aplicación (no en Zod) para emitir `RANGO_INVALIDO`.

- **Error handler.** Se agrega `RangoInvalidoError` en `src/domain/turno/turno.errors.ts` extendiendo `DominioError`; el handler ya mapea `DominioError` a `400` con `code`. No se requiere bloque nuevo.

- **Respuesta de `GET /api/turnos/:id`.** Devuelve el `Turno` persistido (sin enriquecimiento) para mantener paridad con `POST` y con C-05 (cancelación).

## Risks / Trade-offs

- [Enriquecimiento N+1 en memoria] → Aceptable en v0.1 con seed pequeño; C-10 introduce índices/SQL.
- [Sin autenticación] → No se filtra por profesional logueado; se reemplaza en C-09.
- [Catálogos sin filtros] → Se devuelven todos los recursos (incluidos inactivos); aceptable para v0.1.
- [Concurrencia] → La consulta no es atómica con creación; aceptable en v0.1.

## Migration Plan

No aplica migración de datos (persistencia en memoria). El cambio se integra en la rama `feat/c-04-agenda-queries` y se fusiona vía PR tras pasar `npm run typecheck` y `npm test`.

## Open Questions

- (ninguna)