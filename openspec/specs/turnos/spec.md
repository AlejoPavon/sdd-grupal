# turnos Specification

## Purpose

Permite crear turnos de atención odontológica validando recursos, duración y solapamientos, persistiendo el turno en estado pendiente con trazabilidad.

## Requirements

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

### Requirement: Cálculo de fin desde la prestación

El sistema SHALL calcular `fin` como `inicio + duracionMinutos` de la prestación indicada.

#### Scenario: Fin calculado
- **WHEN** se crea un turno con una prestación de duración conocida
- **THEN** el `fin` del turno resulta de sumar la duración de la prestación al `inicio`

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

#### Scenario: Trazabilidad de la excepción
- **WHEN** un Administrador crea un turno con `forzar: true` sobre un bloqueo vigente
- **THEN** el turno persistido contiene `autorizadoPor` con el id del Administrador

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

### Requirement: Existencia de recursos

El sistema SHALL rechazar con `404` y código estable cuando el paciente, profesional, sillón o prestación no existen.

#### Scenario: Paciente inexistente
- **WHEN** se crea un turno con un `pacienteId` que no existe
- **THEN** el sistema responde `404` con código `PACIENTE_NO_ENCONTRADO`

#### Scenario: Profesional inexistente
- **WHEN** se crea un turno con un `profesionalId` que no existe
- **THEN** el sistema responde `404` con código `PROFESIONAL_NO_ENCONTRADO`

#### Scenario: Sillón inexistente
- **WHEN** se crea un turno con un `sillonId` que no existe
- **THEN** el sistema responde `404` con código `SILLON_NO_ENCONTRADO`

#### Scenario: Prestación inexistente
- **WHEN** se crea un turno con un `prestacionId` que no existe
- **THEN** el sistema responde `404` con código `PRESTACION_NO_ENCONTRADA`

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

### Requirement: Intervalo válido

El sistema SHALL rechazar con `400` y código `TURNO_INTERVALO_INVALIDO` cuando `fin` no es posterior a `inicio`.

#### Scenario: Fin no posterior
- **WHEN** el cálculo resulta en `fin <= inicio`
- **THEN** el sistema responde `400` con código `TURNO_INTERVALO_INVALIDO`

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

### Requirement: Turnos contiguos permitidos

El sistema SHALL permitir crear un turno que empieza exactamente cuando termina otro turno del mismo profesional y sillón.

#### Scenario: Contigüidad
- **WHEN** existe un turno `[09:00, 09:30)` y se crea otro `[09:30, 10:00)` del mismo profesional y sillón
- **THEN** ambos turnos se persisten sin error

### Requirement: Orden de validación profesional antes que sillón

El sistema SHALL validar primero el solapamiento por profesional y, si existe, responder `TURNO_SOLAPADO_PROFESIONAL` sin evaluar el sillón.

#### Scenario: Ambos solapan
- **WHEN** un turno nuevo solapa tanto con un turno del mismo profesional como con uno del mismo sillón
- **THEN** la respuesta es `TURNO_SOLAPADO_PROFESIONAL`

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
