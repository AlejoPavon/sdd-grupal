# Spec Delta

## ADDED Requirements

### Requirement: Autorización para crear sobreturnos

El sistema SHALL aceptar `esSobreturno: true` en `POST /api/turnos` solo de usuarios autenticados con rol `administrador` o `recepcionista`; cualquier otro rol autenticado SHALL recibir `403 SIN_PERMISO` sin que se persista el turno.

#### Scenario: Sobreturno creado por un rol autorizado

- **GIVEN** una sesión válida de `administrador` o `recepcionista` y datos de turno válidos
- **WHEN** se envía `POST /api/turnos` con `esSobreturno: true`
- **THEN** se responde `201` con el turno persistido y `esSobreturno: true`

#### Scenario: Profesional intenta crear un sobreturno

- **GIVEN** una sesión válida de un usuario con rol `profesional`
- **WHEN** se envía `POST /api/turnos` con `esSobreturno: true`
- **THEN** se responde `403` con código `SIN_PERMISO`
- **AND** no se persiste ningún turno

#### Scenario: Flag ausente o falso

- **WHEN** se envía `POST /api/turnos` sin `esSobreturno` o con `esSobreturno: false`
- **THEN** el turno se crea con `esSobreturno: false` y se aplican todas las validaciones habituales

### Requirement: Auditoría del sobreturno

El sistema SHALL registrar `autorizadoPor` con el `id` del usuario de la sesión en todo turno creado con `esSobreturno: true`, sin aceptar ese valor desde el cuerpo de la request.

#### Scenario: Sobreturno autorizado por administrador

- **GIVEN** una sesión válida de `admin@demo.local` y un horario sin conflictos
- **WHEN** se envía `POST /api/turnos` con `esSobreturno: true`
- **THEN** el turno persistido contiene `autorizadoPor` igual al id del usuario de la sesión

#### Scenario: Sobreturno autorizado por recepcionista

- **GIVEN** una sesión válida de `recepcion@demo.local`
- **WHEN** se envía `POST /api/turnos` con `esSobreturno: true`
- **THEN** el turno persistido contiene `autorizadoPor` igual al id de la recepcionista

#### Scenario: Turno normal sin auditoría de excepción

- **WHEN** se crea un turno sin `esSobreturno` y sin `forzar`
- **THEN** el turno persistido no contiene `autorizadoPor`

### Requirement: Omisión del bloqueo del profesional en sobreturnos

El sistema SHALL omitir la validación de bloqueo vigente del profesional cuando el turno se crea como sobreturno, siempre que el sillón no tenga bloqueos ni turnos en conflicto.

#### Scenario: Sobreturno sobre un bloqueo del profesional

- **GIVEN** un bloqueo `[09:00, 10:00)` del profesional y un sillón libre
- **WHEN** un rol autorizado envía `POST /api/turnos` con `esSobreturno: true` para `[09:30, 10:00)`
- **THEN** se responde `201` con el turno creado
- **AND** el turno registra `autorizadoPor` con el id del usuario de la sesión

#### Scenario: Turno normal respeta el bloqueo del profesional

- **GIVEN** un bloqueo `[09:00, 10:00)` del profesional
- **WHEN** se envía `POST /api/turnos` sin `esSobreturno` para `[09:30, 10:00)`
- **THEN** se responde `409` con código `TURNO_BLOQUEADO` y `details.bloqueo`

#### Scenario: Bloqueo de otro profesional no afecta al sobreturno

- **GIVEN** un bloqueo del profesional B en `[09:00, 10:00)`
- **WHEN** un rol autorizado crea un sobreturno del profesional A en `[09:00, 09:30)`
- **THEN** la creación es exitosa

### Requirement: Límites de las excepciones de sobreturno

El sistema SHALL mantener las validaciones de solapamiento y bloqueo del sillón aun con `esSobreturno: true`, SHALL conservar la precedencia de validaciones de C-07 y SHALL seguir exigiendo rol `administrador` para `forzar`, sin permitir que `esSobreturno` salte el solapamiento de sillón.

#### Scenario: Sobreturno con sillón solapado

- **GIVEN** un turno activo del mismo sillón que se superpone con `[inicio, fin)`
- **WHEN** un rol autorizado envía `POST /api/turnos` con `esSobreturno: true`
- **THEN** se responde `409` con código `TURNO_SOLAPADO_SILLON`
- **AND** no se persiste ningún turno

#### Scenario: Sobreturno con bloqueo del sillón

- **GIVEN** un bloqueo vigente del sillón en el horario solicitado
- **WHEN** un rol autorizado envía `POST /api/turnos` con `esSobreturno: true`
- **THEN** se responde `409` con código `TURNO_BLOQUEADO`
- **AND** `details.bloqueo` identifica el bloqueo del sillón

#### Scenario: Sobreturno y forzar no saltan el solapamiento de sillón

- **GIVEN** un turno activo del mismo sillón en el horario solicitado y una sesión de administrador
- **WHEN** se envía `POST /api/turnos` con `esSobreturno: true` y `forzar: true`
- **THEN** se responde `409` con código `TURNO_SOLAPADO_SILLON`

#### Scenario: Precedencia entre solapamientos

- **GIVEN** un turno activo del profesional y un turno activo del sillón que se superponen con el turno nuevo
- **WHEN** un rol autorizado envía `POST /api/turnos` con `esSobreturno: true`
- **THEN** se responde `409` con código `TURNO_SOLAPADO_SILLON`
- **AND** no se evalúa el solapamiento del profesional

## MODIFIED Requirements

### Requirement: Crear turno válido

El sistema SHALL crear un turno cuando se envían datos válidos, no existe solapamiento ni bloqueo vigente del sillón y no existe solapamiento ni bloqueo del profesional salvo las excepciones `esSobreturno` y `forzar`, persistiendo el turno en estado `pendiente` y respondiendo `201` con el turno creado.

#### Scenario: Creación exitosa

- **WHEN** se envía `POST /api/turnos` con paciente, profesional, sillón, prestación y `inicio` válidos, y no existe solapamiento ni bloqueo vigente
- **THEN** el sistema persiste el turno en estado `pendiente`
- **AND** responde `201` con el turno creado incluyendo su `id`, `inicio`, `fin` y `estado`

#### Scenario: Creación de sobreturno

- **GIVEN** un turno activo del mismo profesional y un sillón libre
- **WHEN** un rol autorizado envía `POST /api/turnos` con `esSobreturno: true`
- **THEN** el sistema persiste el turno en estado `pendiente` con `esSobreturno: true`
- **AND** responde `201` con el turno creado

### Requirement: No solapamiento por profesional

El sistema SHALL rechazar con `409` y código `TURNO_SOLAPADO_PROFESIONAL` cuando existe un turno activo (`pendiente` o `confirmado`) del mismo profesional que se superpone con `[inicio, fin)`, incluyendo en `details.turnoEnConflicto` el turno en conflicto, salvo que el turno se cree como sobreturno con un rol autorizado.

#### Scenario: Solapamiento parcial

- **WHEN** se crea un turno cuyo intervalo se superpone parcialmente con un turno activo del mismo profesional
- **THEN** el sistema responde `409` con código `TURNO_SOLAPADO_PROFESIONAL`
- **AND** `details.turnoEnConflicto` identifica el turno en conflicto (`id`, `inicio`, `fin`)
- **AND** no se persiste ningún turno nuevo

#### Scenario: Turno cancelado no bloquea

- **WHEN** existe un turno `cancelado` del mismo profesional en el mismo horario
- **THEN** la creación del nuevo turno no genera conflicto por profesional

#### Scenario: Sobreturno con solapamiento profesional

- **GIVEN** un turno activo del mismo profesional que se superpone con `[inicio, fin)`
- **WHEN** un `administrador` o `recepcionista` envía `POST /api/turnos` con `esSobreturno: true`
- **THEN** se responde `201` y ambos turnos quedan persistidos
- **AND** el turno nuevo registra `autorizadoPor` con el id de la sesión

#### Scenario: Sobreturno con flag falso mantiene el rechazo

- **GIVEN** un turno activo del mismo profesional que se superpone con `[inicio, fin)`
- **WHEN** se envía `POST /api/turnos` con `esSobreturno: false`
- **THEN** se responde `409` con código `TURNO_SOLAPADO_PROFESIONAL`

### Requirement: No solapamiento por sillón

El sistema SHALL rechazar con `409` y código `TURNO_SOLAPADO_SILLON` cuando existe un turno activo del mismo sillón que se superpone con `[inicio, fin)`, incluyendo en `details.turnoEnConflicto` el turno en conflicto; esta validación SHALL aplicarse también a los sobreturnos y a los turnos creados con `forzar`.

#### Scenario: Solapamiento por sillón

- **WHEN** se crea un turno cuyo intervalo se superpone con un turno activo del mismo sillón
- **THEN** el sistema responde `409` con código `TURNO_SOLAPADO_SILLON`
- **AND** `details.turnoEnConflicto` identifica el turno en conflicto
- **AND** no se persiste ningún turno nuevo

#### Scenario: Profesional distinto en sillón libre

- **WHEN** se crea un turno para un profesional distinto en un sillón sin conflicto
- **THEN** la creación es exitosa

#### Scenario: Sobreturno no omite el solapamiento por sillón

- **GIVEN** un turno activo del mismo sillón que se superpone con `[inicio, fin)`
- **WHEN** un rol autorizado envía `POST /api/turnos` con `esSobreturno: true`
- **THEN** el sistema responde `409` con código `TURNO_SOLAPADO_SILLON`
- **AND** no se persiste ningún turno

#### Scenario: Forzar tampoco omite el solapamiento por sillón

- **GIVEN** un turno activo del mismo sillón que se superpone con `[inicio, fin)` y una sesión de administrador
- **WHEN** se envía `POST /api/turnos` con `esSobreturno: true` y `forzar: true`
- **THEN** el sistema responde `409` con código `TURNO_SOLAPADO_SILLON`

### Requirement: Trazabilidad del turno creado

El sistema SHALL registrar `createdBy`, `createdAt` y `updatedAt` en todo turno creado, y `autorizadoPor` con el id del usuario de la sesión cuando el turno se crea como sobreturno o cuando se aplica la excepción `forzar` de C-07.

#### Scenario: Trazabilidad presente

- **WHEN** se crea un turno válido
- **THEN** el turno persistido contiene `createdBy`, `createdAt` y `updatedAt` no nulos

#### Scenario: Trazabilidad del sobreturno

- **WHEN** un `administrador` o `recepcionista` crea un turno con `esSobreturno: true`
- **THEN** el turno persistido contiene `autorizadoPor` con el id del usuario autenticado

#### Scenario: Trazabilidad sin excepción

- **WHEN** se crea un turno sin `esSobreturno` y sin `forzar`
- **THEN** el turno persistido no contiene `autorizadoPor`

### Requirement: Validación de entrada HTTP

El sistema SHALL rechazar con `400` cualquier request con campos obligatorios faltantes o inválidos, incluyendo el detalle por campo, y SHALL rechazar un `esSobreturno` que no sea booleano.

#### Scenario: Campo faltante

- **WHEN** se envía `POST /api/turnos` sin un campo obligatorio
- **THEN** el sistema responde `400` con el detalle del campo faltante

#### Scenario: Fecha inválida

- **WHEN** se envía un `inicio` que no es una fecha ISO 8601 válida
- **THEN** el sistema responde `400` con el detalle del campo

#### Scenario: Flag de sobreturno inválido

- **WHEN** se envía `POST /api/turnos` con `esSobreturno` distinto de `true` o `false`
- **THEN** el sistema responde `400` con código `VALIDACION_FALLIDA`
- **AND** `details` identifica el campo `esSobreturno`
