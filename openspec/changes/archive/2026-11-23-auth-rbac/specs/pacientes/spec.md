# Spec Delta

## ADDED Requirements

### Requirement: Autenticación obligatoria en rutas de pacientes

El sistema SHALL exigir una sesión válida en todas las rutas de pacientes y SHALL responder `401` con código `NO_AUTENTICADO` cuando la request no incluye una sesión válida.

#### Scenario: Listado sin sesión

- **WHEN** se envía `GET /api/pacientes` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Alta sin sesión

- **WHEN** se envía `POST /api/pacientes` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`
- **AND** no se persiste ningún paciente

#### Scenario: Baja sin sesión

- **WHEN** se envía `DELETE /api/pacientes/:id` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`

### Requirement: Mutaciones de pacientes reservadas a administrador y recepcionista

El sistema SHALL permitir crear, actualizar y dar de baja pacientes solo a usuarios con rol `administrador` o `recepcionista`, y SHALL responder `403` con código `SIN_PERMISO` a cualquier otro rol autenticado.

#### Scenario: Profesional intenta crear un paciente

- **WHEN** un usuario autenticado con rol `profesional` envía `POST /api/pacientes`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Profesional intenta actualizar un paciente

- **WHEN** un usuario autenticado con rol `profesional` envía `PATCH /api/pacientes/:id`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Profesional intenta dar de baja un paciente

- **WHEN** un usuario autenticado con rol `profesional` envía `DELETE /api/pacientes/:id`
- **THEN** se responde `403` con código `SIN_PERMISO`
- **AND** el paciente sigue activo

#### Scenario: Recepcionista crea un paciente

- **WHEN** un usuario autenticado con rol `recepcionista` envía `POST /api/pacientes` con datos válidos
- **THEN** se responde `201` con el paciente creado

### Requirement: Scoping de profesional a sus pacientes asociados

El sistema SHALL limitar a un usuario con rol `profesional` a los pacientes que tienen al menos un turno, en cualquier estado, con su `profesionalId`; en `GET /api/pacientes` SHALL filtrar el listado y en `GET /api/pacientes/:id` SHALL responder `403` con código `SIN_PERMISO` si el paciente no está asociado. Si el usuario no tiene `profesionalId` vinculado, SHALL responder `403` con código `SIN_PERMISO`.

#### Scenario: Listado acotado a pacientes asociados

- **GIVEN** un usuario `profesional` vinculado al profesional A, un paciente con turno del profesional A y otro paciente solo con turnos del profesional B
- **WHEN** se envía `GET /api/pacientes`
- **THEN** la respuesta incluye solo al paciente asociado al profesional A

#### Scenario: Búsqueda acotada a pacientes asociados

- **GIVEN** un usuario `profesional` vinculado al profesional A
- **WHEN** se envía `GET /api/pacientes?q=<texto>` que coincide con pacientes propios y ajenos
- **THEN** la respuesta incluye solo los pacientes propios que coinciden con la búsqueda

#### Scenario: Paciente no asociado por id

- **GIVEN** un paciente sin turnos del profesional A
- **WHEN** un usuario `profesional` vinculado al profesional A envía `GET /api/pacientes/:id`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Paciente asociado por id

- **GIVEN** un paciente con al menos un turno del profesional A
- **WHEN** un usuario `profesional` vinculado al profesional A envía `GET /api/pacientes/:id`
- **THEN** se responde `200` con el paciente

#### Scenario: Asociación derivada de un turno cancelado

- **GIVEN** un paciente cuyo único turno con el profesional A está cancelado
- **WHEN** un usuario `profesional` vinculado al profesional A envía `GET /api/pacientes`
- **THEN** el paciente aparece en la respuesta

#### Scenario: Profesional sin vínculo

- **GIVEN** un usuario con rol `profesional` y sin `profesionalId`
- **WHEN** se envía `GET /api/pacientes` o `GET /api/pacientes/:id`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Administrador y recepcionista sin scoping

- **GIVEN** un usuario con rol `administrador` o `recepcionista`
- **WHEN** se envía `GET /api/pacientes`
- **THEN** la respuesta incluye los pacientes activos sin restricción por profesional
