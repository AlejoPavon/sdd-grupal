# Spec Delta

## ADDED Requirements

### Requirement: Turno no puede crearse en el pasado

El sistema SHALL rechazar con 400 y c�digo TURNO_EN_EL_PASADO cuando el inicio del turno es anterior al momento actual, sin persistir ning�n turno.

#### Scenario: Inicio en el pasado

- **WHEN** se env�a POST /api/turnos con un inicio anterior al momento actual
- **THEN** el sistema responde 400 con c�digo TURNO_EN_EL_PASADO
- **AND** no se persiste ning�n turno

#### Scenario: Inicio igual al momento actual es v�lido

- **WHEN** se env�a POST /api/turnos con un inicio igual al momento actual y datos v�lidos
- **THEN** el turno puede crearse (no se rechaza por fecha pasada)
