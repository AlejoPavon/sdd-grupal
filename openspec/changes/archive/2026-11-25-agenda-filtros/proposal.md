# Proposal

## Why

La agenda de C-04 permite consultar por rango, profesional y sillón, pero no permite ver los turnos de un paciente. Además `ListarTurnos` fuerza los estados `pendiente` y `confirmado`, por lo que los turnos `cancelado`, `atendido` y `ausente` nunca aparecen: la lista general no refleja todos los turnos registrados. Se detectó al revisar el alcance de C-04 (US-005).

## What Changes

- `GET /api/turnos` agrega el filtro opcional `pacienteId`.
- `GET /api/turnos` deja de forzar estados activos: sin filtro de estado devuelve todos los turnos registrados (cualquier estado), ordenados por `inicio` ascendente.
- `FiltrosTurno` agrega `pacienteId` y ambos repositorios (memoria y SQLite) lo aplican.
- La vista de agenda del día del cliente web conserva su comportamiento actual (solo turnos activos) filtrando en el cliente, porque ahora la API devuelve todos los estados.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `turnos`: el requisito "Consultar agenda por rango" pasa a devolver todos los turnos registrados (cualquier estado), agrega el filtro por paciente y elimina la exclusión de turnos no activos.

## Impact

- Código afectado: `src/application/turnos/listar-turnos.ts`, `src/application/ports/turno-repository.ts`, `src/infrastructure/persistence/in-memory-turno-repository.ts`, `src/infrastructure/persistence/sqlite/sqlite-turno-repository.ts`, `src/http/schemas/turno.ts`, `src/http/routes/turnos.ts`, `web/app.js`.
- APIs: `GET /api/turnos` acepta `pacienteId` y devuelve todos los estados por defecto.
- Tests afectados: `tests/unit/application/listar-turnos.test.ts`, `tests/integration/turnos.test.ts`, `tests/integration/sqlite-turno.test.ts`.
- Dependencias: C-04 `agenda-queries` (DONE). Sin dependencias externas nuevas.
- Riesgo: sin rango, la respuesta puede crecer con todos los turnos; aceptable en v0.1 (seed chico, sin paginación todavía).
