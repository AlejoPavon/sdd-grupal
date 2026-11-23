# Spec Delta

## ADDED Requirements

### Requirement: Cancelar turno válido

El sistema SHALL cancelar un turno en estado `pendiente` o `confirmado` mediante `PATCH /api/turnos/:id/cancelar`, cambiando su estado a `cancelado`, registrando `cancelledAt` y `updatedAt`, y respondiendo `200` con el turno actualizado.

#### Scenario: Cancelación exitosa desde pendiente

- **WHEN** se envía `PATCH /api/turnos/:id/cancelar` para un turno en estado `pendiente`
- **THEN** el turno queda en estado `cancelado`
- **AND** `cancelledAt` y `updatedAt` quedan registrados
- **AND** se responde `200` con el turno actualizado

#### Scenario: Cancelación exitosa desde confirmado

- **WHEN** se envía `PATCH /api/turnos/:id/cancelar` para un turno en estado `confirmado`
- **THEN** el turno queda en estado `cancelado`
- **AND** se responde `200` con el turno actualizado

### Requirement: Idempotencia de cancelación

El sistema SHALL tratar como exitosa la cancelación de un turno ya `cancelado`, respondiendo `200` sin modificar el turno (RN-EX-03).

#### Scenario: Doble cancelación

- **WHEN** se envía `PATCH /api/turnos/:id/cancelar` para un turno ya `cancelado`
- **THEN** se responde `200` con el turno en estado `cancelado`
- **AND** el turno no se modifica (ni `cancelledAt` ni `updatedAt` cambian)

### Requirement: Transición inválida al cancelar

El sistema SHALL rechazar con `409` y código `TRANSICION_INVALIDA` la cancelación de un turno en estado `atendido` o `ausente`.

#### Scenario: Turno atendido

- **WHEN** se envía `PATCH /api/turnos/:id/cancelar` para un turno en estado `atendido`
- **THEN** se responde `409` con código `TRANSICION_INVALIDA`
- **AND** el estado del turno no cambia

#### Scenario: Turno ausente

- **WHEN** se envía `PATCH /api/turnos/:id/cancelar` para un turno en estado `ausente`
- **THEN** se responde `409` con código `TRANSICION_INVALIDA`

### Requirement: Turno inexistente al cancelar

El sistema SHALL responder `404` con código `TURNO_NO_ENCONTRADO` cuando se intenta cancelar un turno que no existe.

#### Scenario: Id inexistente

- **WHEN** se envía `PATCH /api/turnos/:id/cancelar` con un `id` que no existe
- **THEN** se responde `404` con código `TURNO_NO_ENCONTRADO`

### Requirement: Cancelación libera agenda

El sistema SHALL dejar de considerar ocupado el intervalo de un turno cancelado, permitiendo crear un nuevo turno en el mismo horario para el mismo profesional y sillón.

#### Scenario: Recreación en el mismo horario

- **GIVEN** un turno cancelado en el intervalo `[inicio, fin)` para un profesional y sillón
- **WHEN** se crea un nuevo turno en el mismo intervalo para el mismo profesional y sillón
- **THEN** la creación es exitosa y no genera `TURNO_SOLAPADO_PROFESIONAL` ni `TURNO_SOLAPADO_SILLON`