# Spec Delta

## ADDED Requirements

### Requirement: Consultar agenda por rango

El sistema SHALL devolver, mediante `GET /api/turnos`, los turnos activos (estado `pendiente` o `confirmado`) cuyo intervalo intersecta el rango indicado, filtrables por `profesionalId` y/o `sillonId`, ordenados por `inicio` ascendente, incluyendo un resumen del paciente y de la prestación.

#### Scenario: Consulta por rango

- **WHEN** se envía `GET /api/turnos?desde=...&hasta=...` con un rango válido
- **THEN** se responde `200` con la lista de turnos activos que intersectan el rango, ordenados por `inicio` ascendente

#### Scenario: Filtro por profesional

- **WHEN** se envía `GET /api/turnos` con `profesionalId`
- **THEN** la respuesta incluye solo los turnos de ese profesional

#### Scenario: Filtro por sillón

- **WHEN** se envía `GET /api/turnos` con `sillonId`
- **THEN** la respuesta incluye solo los turnos de ese sillón

#### Scenario: Filtros combinados

- **WHEN** se envían `profesionalId` y `sillonId` juntos
- **THEN** la respuesta incluye solo los turnos que cumplen ambos filtros

#### Scenario: Exclusión de turnos no activos

- **WHEN** existen turnos en estado `cancelado`, `atendido` o `ausente` en el rango
- **THEN** no aparecen en la respuesta

#### Scenario: Enriquecimiento de respuesta

- **WHEN** se devuelve la lista de turnos
- **THEN** cada item incluye un resumen del paciente (`id`, `nombre`, `apellido`) y de la prestación (`id`, `codigo`, `nombre`, `duracionMinutos`)

### Requirement: Validación de rango de consulta

El sistema SHALL rechazar con `400` y código `RANGO_INVALIDO` cuando se envían `desde` y `hasta` y `desde` es mayor o igual a `hasta`.

#### Scenario: Rango inválido

- **WHEN** se envía `GET /api/turnos?desde=...&hasta=...` con `desde >= hasta`
- **THEN** se responde `400` con código `RANGO_INVALIDO`

#### Scenario: Rango válido

- **WHEN** se envía `GET /api/turnos?desde=...&hasta=...` con `desde < hasta`
- **THEN** se responde `200` con la lista correspondiente

### Requirement: Consultar turno por id

El sistema SHALL devolver un turno por su `id` mediante `GET /api/turnos/:id`, respondiendo `404` con código `TURNO_NO_ENCONTRADO` cuando no existe.

#### Scenario: Turno existente

- **WHEN** se envía `GET /api/turnos/:id` con un id existente
- **THEN** se responde `200` con el turno

#### Scenario: Turno inexistente

- **WHEN** se envía `GET /api/turnos/:id` con un id que no existe
- **THEN** se responde `404` con código `TURNO_NO_ENCONTRADO`