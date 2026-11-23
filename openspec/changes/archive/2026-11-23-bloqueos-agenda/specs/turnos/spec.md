# Spec Delta

## ADDED Requirements

### Requirement: Rechazo por bloqueo del profesional

El sistema SHALL rechazar con `409` y código `TURNO_BLOQUEADO` un turno cuyo intervalo `[inicio, fin)` se superpone con un bloqueo del mismo profesional, incluyendo en `details.bloqueo` el bloqueo en conflicto.

#### Scenario: Superposición con bloqueo del profesional

- **GIVEN** un bloqueo `[09:00, 10:00)` del profesional
- **WHEN** se envía `POST /api/turnos` para ese profesional con un turno `[09:30, 10:00)`
- **THEN** el sistema responde `409` con código `TURNO_BLOQUEADO`
- **AND** `details.bloqueo` identifica el bloqueo en conflicto (`id`, `inicio`, `fin`)
- **AND** no se persiste ningún turno

#### Scenario: Bloqueo de otro profesional no afecta

- **GIVEN** un bloqueo del profesional B en `[09:00, 10:00)`
- **WHEN** se crea un turno del profesional A en `[09:00, 09:30)` con un sillón libre
- **THEN** la creación es exitosa

### Requirement: Rechazo por bloqueo del sillón

El sistema SHALL rechazar con `409` y código `TURNO_BLOQUEADO` un turno cuyo intervalo `[inicio, fin)` se superpone con un bloqueo del mismo sillón, incluyendo en `details.bloqueo` el bloqueo en conflicto.

#### Scenario: Superposición con bloqueo del sillón

- **GIVEN** un bloqueo `[09:00, 10:00)` del sillón
- **WHEN** se envía `POST /api/turnos` para ese sillón con un turno `[09:30, 10:00)`
- **THEN** el sistema responde `409` con código `TURNO_BLOQUEADO`
- **AND** `details.bloqueo` identifica el bloqueo en conflicto
- **AND** no se persiste ningún turno

#### Scenario: Bloqueo de otro sillón no afecta

- **GIVEN** un bloqueo del sillón B en `[09:00, 10:00)`
- **WHEN** se crea un turno en el sillón A en `[09:00, 09:30)` con el profesional libre
- **THEN** la creación es exitosa

### Requirement: Excepción de bloqueo autorizada por Administrador

El sistema SHALL permitir crear un turno superpuesto con uno o más bloqueos cuando la request incluye `forzar: true` y el usuario autenticado tiene rol Administrador, registrando `autorizadoPor` con el id de ese usuario cuando la excepción evita al menos un bloqueo.

#### Scenario: Administrador fuerza un bloqueo del profesional

- **GIVEN** un bloqueo vigente del profesional en el horario solicitado
- **WHEN** un Administrador envía `POST /api/turnos` con `forzar: true`
- **THEN** el sistema responde `201` con el turno creado
- **AND** el turno persistido registra `autorizadoPor` con el id del Administrador

#### Scenario: Administrador fuerza bloqueos de profesional y sillón

- **GIVEN** bloqueos vigentes del profesional y del sillón en el horario solicitado
- **WHEN** un Administrador envía `POST /api/turnos` con `forzar: true`
- **THEN** el sistema responde `201` con el turno creado
- **AND** el turno persistido registra `autorizadoPor` con el id del Administrador

#### Scenario: Forzar sin bloqueo en conflicto

- **GIVEN** un horario sin bloqueos
- **WHEN** un Administrador envía `POST /api/turnos` con `forzar: true`
- **THEN** el sistema responde `201` con el turno creado
- **AND** el turno no registra `autorizadoPor`

### Requirement: Forzar bloqueo sin permiso

El sistema SHALL rechazar con `403` y código `SIN_PERMISO` cualquier request a `POST /api/turnos` con `forzar: true` realizada por un usuario que no tenga rol Administrador, sin persistir el turno.

#### Scenario: Recepcionista intenta forzar un bloqueo

- **GIVEN** un bloqueo vigente en el horario solicitado
- **WHEN** una Recepcionista envía `POST /api/turnos` con `forzar: true`
- **THEN** el sistema responde `403` con código `SIN_PERMISO`
- **AND** no se persiste ningún turno

#### Scenario: Profesional intenta forzar sin bloqueo

- **GIVEN** un horario sin bloqueos
- **WHEN** un Profesional envía `POST /api/turnos` con `forzar: true`
- **THEN** el sistema responde `403` con código `SIN_PERMISO`
- **AND** no se persiste ningún turno

### Requirement: Precedencia de validaciones de agenda

El sistema SHALL evaluar las validaciones de agenda en el orden: existencia y estado de recursos, solapamiento por profesional, solapamiento por sillón, bloqueo por profesional y bloqueo por sillón; el primer conflicto encontrado determina la respuesta.

#### Scenario: Turno solapado y bloqueo simultáneos

- **GIVEN** un turno existente del profesional y un bloqueo del profesional que se superponen con el turno nuevo
- **WHEN** se envía `POST /api/turnos` sin `forzar`
- **THEN** el sistema responde `409 TURNO_SOLAPADO_PROFESIONAL` antes de evaluar el bloqueo

#### Scenario: Sillón solapado y profesional bloqueado

- **GIVEN** un turno existente del sillón y un bloqueo del profesional que se superponen con el turno nuevo
- **WHEN** se envía `POST /api/turnos` sin `forzar`
- **THEN** el sistema responde `409 TURNO_SOLAPADO_SILLON`

#### Scenario: Bloqueos de profesional y sillón simultáneos

- **GIVEN** bloqueos vigentes del profesional y del sillón que se superponen con el turno nuevo
- **WHEN** se envía `POST /api/turnos` sin `forzar`
- **THEN** el sistema responde `409 TURNO_BLOQUEADO`
- **AND** `details.bloqueo` corresponde al bloqueo del profesional

### Requirement: Contigüidad con bloqueos

El sistema SHALL permitir un turno que comienza exactamente cuando termina un bloqueo, o que termina exactamente cuando comienza, porque los intervalos son semiabiertos.

#### Scenario: Turno comienza al terminar el bloqueo

- **GIVEN** un bloqueo `[09:00, 09:30)` del profesional y del sillón
- **WHEN** se crea un turno `[09:30, 10:00)` para ese profesional y sillón
- **THEN** la creación es exitosa

#### Scenario: Turno termina al comenzar el bloqueo

- **GIVEN** un bloqueo `[10:00, 11:00)` del profesional y del sillón
- **WHEN** se crea un turno `[09:30, 10:00)` para ese profesional y sillón
- **THEN** la creación es exitosa

#### Scenario: Superposición mínima se rechaza

- **GIVEN** un bloqueo `[09:30, 10:00)` del profesional
- **WHEN** se crea un turno `[09:00, 09:31)` para ese profesional
- **THEN** el sistema responde `409` con código `TURNO_BLOQUEADO`

### Requirement: Eliminar un bloqueo libera la agenda

El sistema SHALL permitir crear un turno en un intervalo previamente bloqueado una vez que el bloqueo fue eliminado.

#### Scenario: Recreación tras eliminar el bloqueo

- **GIVEN** un bloqueo eliminado previamente en `[09:00, 09:30)` para un profesional y sillón
- **WHEN** se crea un turno `[09:00, 09:30)` para ese profesional y sillón
- **THEN** la creación es exitosa y no responde `TURNO_BLOQUEADO`

## MODIFIED Requirements

### Requirement: Crear turno válido

El sistema SHALL crear un turno cuando se envían datos válidos, el horario está libre de turnos y no existe un bloqueo vigente del profesional o del sillón, salvo una excepción autorizada, persistiendo el turno en estado `pendiente` y respondiendo `201` con el turno creado.

#### Scenario: Creación exitosa
- **WHEN** se envía `POST /api/turnos` con paciente, profesional, sillón, prestación y `inicio` válidos, y no existe solapamiento ni bloqueo vigente
- **THEN** el sistema persiste el turno en estado `pendiente`
- **AND** responde `201` con el turno creado incluyendo su `id`, `inicio`, `fin` y `estado`

### Requirement: Trazabilidad del turno creado

El sistema SHALL registrar `createdBy`, `createdAt` y `updatedAt` en todo turno creado, y `autorizadoPor` cuando se aplicó una excepción autorizada de bloqueo.

#### Scenario: Trazabilidad presente
- **WHEN** se crea un turno válido
- **THEN** el turno persistido contiene `createdBy`, `createdAt` y `updatedAt` no nulos

#### Scenario: Trazabilidad de la excepción
- **WHEN** un Administrador crea un turno con `forzar: true` sobre un bloqueo vigente
- **THEN** el turno persistido contiene `autorizadoPor` con el id del Administrador
