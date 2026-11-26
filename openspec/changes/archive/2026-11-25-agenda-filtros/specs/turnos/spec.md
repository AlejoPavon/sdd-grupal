# Spec Delta

## REMOVED Requirements

### Requirement: Consultar agenda por rango

**Reason**: El requisito excluía los turnos no activos, pero la lista general debe devolver todos los turnos registrados (cualquier estado) y agregar el filtro por paciente.

**Migration**: Se reemplaza por el requisito "Consultar turnos registrados", que conserva los filtros por rango, profesional y sillón, agrega `pacienteId` y devuelve todos los estados por defecto.

## ADDED Requirements

### Requirement: Consultar turnos registrados

El sistema SHALL devolver, mediante `GET /api/turnos`, todos los turnos registrados (cualquier estado) cuyo intervalo intersecta el rango indicado cuando se envían `desde` y/o `hasta`, filtrables por `profesionalId`, `sillonId` y/o `pacienteId`, ordenados por `inicio` ascendente, incluyendo un resumen del paciente y de la prestación. Sin filtros, SHALL devolver todos los turnos registrados.

#### Scenario: Lista general

- **WHEN** se envía `GET /api/turnos` sin filtros
- **THEN** se responde `200` con todos los turnos registrados, de cualquier estado, ordenados por `inicio` ascendente

#### Scenario: Consulta por rango

- **WHEN** se envía `GET /api/turnos?desde=...&hasta=...` con un rango válido
- **THEN** se responde `200` con todos los turnos que intersectan el rango, de cualquier estado, ordenados por `inicio` ascendente

#### Scenario: Filtro por profesional

- **WHEN** se envía `GET /api/turnos` con `profesionalId`
- **THEN** la respuesta incluye solo los turnos de ese profesional

#### Scenario: Filtro por sillón

- **WHEN** se envía `GET /api/turnos` con `sillonId`
- **THEN** la respuesta incluye solo los turnos de ese sillón

#### Scenario: Filtro por paciente

- **WHEN** se envía `GET /api/turnos` con `pacienteId`
- **THEN** la respuesta incluye solo los turnos de ese paciente

#### Scenario: Filtros combinados

- **WHEN** se envían `pacienteId`, `profesionalId` y/o `sillonId` juntos
- **THEN** la respuesta incluye solo los turnos que cumplen todos los filtros

#### Scenario: Inclusión de turnos no activos

- **WHEN** existen turnos en estado `cancelado`, `atendido` o `ausente`
- **THEN** aparecen en la respuesta cuando no se filtra por otro criterio que los excluya

#### Scenario: Enriquecimiento de respuesta

- **WHEN** se devuelve la lista de turnos
- **THEN** cada item incluye un resumen del paciente (`id`, `nombre`, `apellido`) y de la prestación (`id`, `codigo`, `nombre`, `duracionMinutos`)
