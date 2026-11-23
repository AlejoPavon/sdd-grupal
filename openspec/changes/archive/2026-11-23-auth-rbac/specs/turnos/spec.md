# Spec Delta

## ADDED Requirements

### Requirement: Autenticación obligatoria en rutas de turnos

El sistema SHALL exigir una sesión válida en todas las rutas de turnos y SHALL responder `401` con código `NO_AUTENTICADO` cuando la request no incluye una sesión válida.

#### Scenario: Consulta sin sesión

- **WHEN** se envía `GET /api/turnos` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Creación sin sesión

- **WHEN** se envía `POST /api/turnos` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`
- **AND** no se persiste ningún turno

#### Scenario: Consulta por id sin sesión

- **WHEN** se envía `GET /api/turnos/:id` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`

### Requirement: Mutaciones de turnos reservadas a administrador y recepcionista

El sistema SHALL permitir crear turnos y cancelarlos solo a usuarios con rol `administrador` o `recepcionista`, y SHALL responder `403` con código `SIN_PERMISO` a cualquier otro rol autenticado.

#### Scenario: Profesional intenta crear un turno

- **WHEN** un usuario autenticado con rol `profesional` envía `POST /api/turnos`
- **THEN** se responde `403` con código `SIN_PERMISO`
- **AND** no se persiste ningún turno

#### Scenario: Profesional intenta cancelar un turno

- **WHEN** un usuario autenticado con rol `profesional` envía `PATCH /api/turnos/:id/cancelar`
- **THEN** se responde `403` con código `SIN_PERMISO`
- **AND** el turno no cambia de estado

#### Scenario: Recepcionista crea un turno

- **WHEN** un usuario autenticado con rol `recepcionista` envía `POST /api/turnos` con datos válidos
- **THEN** se responde `201` con el turno creado

#### Scenario: Administrador cancela un turno

- **WHEN** un usuario autenticado con rol `administrador` envía `PATCH /api/turnos/:id/cancelar` sobre un turno cancelable
- **THEN** se responde `200` con el turno en estado `cancelado`

### Requirement: Scoping de profesional en la consulta de agenda

El sistema SHALL limitar a un usuario con rol `profesional` a los turnos cuyo `profesionalId` coincide con su vínculo: en `GET /api/turnos` SHALL forzar ese filtro aunque la request pida otro profesional y en `GET /api/turnos/:id` SHALL responder `403` con código `SIN_PERMISO` si el turno pertenece a otro profesional. Si el usuario no tiene `profesionalId` vinculado, SHALL responder `403` con código `SIN_PERMISO`.

#### Scenario: Listado acotado a los turnos propios

- **GIVEN** un usuario `profesional` vinculado al profesional A y turnos de los profesionales A y B
- **WHEN** se envía `GET /api/turnos` sin filtros
- **THEN** la respuesta incluye solo los turnos del profesional A

#### Scenario: Intento de consultar la agenda de otro profesional

- **GIVEN** un usuario `profesional` vinculado al profesional A
- **WHEN** se envía `GET /api/turnos?profesionalId=<profesional B>`
- **THEN** la respuesta no incluye turnos del profesional B

#### Scenario: Turno ajeno por id

- **GIVEN** un turno del profesional B
- **WHEN** un usuario `profesional` vinculado al profesional A envía `GET /api/turnos/:id`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Turno propio por id

- **GIVEN** un turno del profesional A
- **WHEN** un usuario `profesional` vinculado al profesional A envía `GET /api/turnos/:id`
- **THEN** se responde `200` con el turno

#### Scenario: Profesional sin vínculo

- **GIVEN** un usuario con rol `profesional` y sin `profesionalId`
- **WHEN** se envía `GET /api/turnos` o `GET /api/turnos/:id`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Administrador y recepcionista sin scoping

- **GIVEN** un usuario con rol `administrador` o `recepcionista`
- **WHEN** se envía `GET /api/turnos`
- **THEN** la respuesta incluye los turnos de todos los profesionales

### Requirement: createdBy desde la sesión

El sistema SHALL registrar en `createdBy` de un turno nuevo el `id` del usuario autenticado que lo crea, en lugar de un identificador fijo.

#### Scenario: Turno creado por recepcionista

- **GIVEN** una sesión válida de `recepcion@demo.local`
- **WHEN** se crea un turno mediante `POST /api/turnos`
- **THEN** el turno persistido tiene `createdBy` igual al `id` del usuario autenticado

#### Scenario: Turno creado por administrador

- **GIVEN** una sesión válida de `admin@demo.local`
- **WHEN** se crea un turno mediante `POST /api/turnos`
- **THEN** el turno persistido tiene `createdBy` igual al `id` del usuario administrador autenticado
