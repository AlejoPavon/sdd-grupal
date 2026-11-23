# Proposal

## Why

El MVP exige poder cancelar un turno para liberar el horario del profesional y del sillón (US-006, Flujo 3). Hoy existe la creación y consulta de turnos (C-03, C-04), pero no hay caso de uso ni endpoint de cancelación, por lo que un horario reservado no se libera y no se puede recrear un turno en el mismo slot. El dominio ya define las transiciones válidas (RN-TU-01) y el error `TransicionInvalidaError`, por lo que es el momento de exponer esta capacidad.

## What Changes

- Se agrega `PATCH /api/turnos/:id/cancelar` sin body.
- Se implementa el caso de uso `CancelarTurno`: busca el turno por `id` (404 `TURNO_NO_ENCONTRADO`), valida la transición `pendiente|confirmado → cancelado` (409 `TRANSICION_INVALIDA` para `atendido`/`ausente`), cambia el estado a `cancelado` y registra `cancelledAt` y `updatedAt`.
- Idempotencia: cancelar un turno ya `cancelado` devuelve `200` con el turno sin modificarlo (RN-EX-03).
- Al cancelar, el intervalo deja de ocupar agenda (RN-AG-06, RN-AG-07), habilitando la creación de un nuevo turno en el mismo horario.
- Se mapea `TransicionInvalidaError` a `409` en `error-handler.ts`.
- Se agregan tests unitarios del caso de uso y de integración HTTP: cancelación feliz, doble cancelación, turno atendido, recreación en el mismo horario.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- `turnos`: se agregan los requisitos de cancelación de turno (transición válida, idempotencia, registro de `cancelledAt`, liberación de agenda y endpoint `PATCH /api/turnos/:id/cancelar`).

## Impact

- Código afectado: `src/application/cancelar-turno.ts` (nuevo), `src/http/routes/turnos.ts` (nuevo handler `PATCH`), `src/http/error-handler.ts` (mapeo de `TransicionInvalidaError`).
- APIs: nuevo endpoint `PATCH /api/turnos/:id/cancelar`.
- Tests: `tests/unit/application/cancelar-turno.test.ts` (nuevo) y ampliación de `tests/integration/turnos.test.ts`.
- Dependencias: C-03 `turno-creation` (DONE). Sin dependencias externas nuevas. Persistencia en memoria (C-10 posterior).
- Riesgo: concurrencia no atómica en memoria (aceptable en v0.1); auth aún no implementada (C-09), por lo que no se valida actor.