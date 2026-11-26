# Spec Delta

## Purpose

Permite registrar, buscar, consultar, actualizar y desactivar pacientes, manteniendo el historial de turnos y bloqueando turnos nuevos para pacientes inactivos. Este delta agrega la validación de formato de `documento` y `telefono` en la API.

## ADDED Requirements

### Requirement: Formato de documento y teléfono

El sistema SHALL validar en el alta (`POST /api/pacientes`) y en la edición (`PATCH /api/pacientes/:id`) que `documento`, cuando venga informado, contenga exactamente 8 dígitos y solo números, y que `telefono`, cuando venga informado, contenga exactamente 10 dígitos y solo números. Ambos campos SHALL seguir siendo opcionales. Cuando un valor no cumpla el formato, el sistema SHALL responder `400` con código `VALIDACION_FALLIDA` y el detalle del campo inválido.

#### Scenario: Documento y teléfono válidos en el alta

- **GIVEN** un request de alta con `documento` `12345678` y `telefono` `1122334455`
- **WHEN** se envía `POST /api/pacientes` con esos datos
- **THEN** se responde `201` con el paciente creado

#### Scenario: Documento de 7 dígitos en el alta

- **GIVEN** un request de alta con `documento` `1234567`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `documento`

#### Scenario: Documento con letras en el alta

- **GIVEN** un request de alta con `documento` `1234abcd`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `documento`

#### Scenario: Teléfono de 9 dígitos en el alta

- **GIVEN** un request de alta con `telefono` `112233445`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `telefono`

#### Scenario: Teléfono con letras en el alta

- **GIVEN** un request de alta con `telefono` `11223abcd5`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `telefono`

#### Scenario: Alta sin documento ni teléfono

- **GIVEN** un request de alta con nombre y apellido y sin `documento` ni `telefono`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `201` con el paciente creado

#### Scenario: Edición con documento inválido

- **GIVEN** un paciente existente
- **WHEN** se envía `PATCH /api/pacientes/:id` con `documento` `1234567`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `documento`

#### Scenario: Edición con teléfono inválido

- **GIVEN** un paciente existente
- **WHEN** se envía `PATCH /api/pacientes/:id` con `telefono` `112233445`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `telefono`
