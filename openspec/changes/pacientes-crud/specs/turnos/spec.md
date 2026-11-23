# Spec Delta

## MODIFIED Requirements

### Requirement: Recursos activos

El sistema SHALL rechazar con `409` y código `RECURSO_INACTIVO` cuando el paciente, profesional, sillón o prestación están inactivos.

#### Scenario: Recurso inactivo
- **GIVEN** un turno a crear con un profesional, sillón o prestación inactivo
- **WHEN** se envía `POST /api/turnos`
- **THEN** el sistema responde `409` con código `RECURSO_INACTIVO`
- **AND** no se persiste ningún turno

#### Scenario: Paciente inactivo
- **GIVEN** un paciente inactivo
- **WHEN** se crea un turno para ese paciente
- **THEN** el sistema responde `409` con código `RECURSO_INACTIVO`
- **AND** no se persiste ningún turno