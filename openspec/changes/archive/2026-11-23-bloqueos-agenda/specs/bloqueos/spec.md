# Spec Delta

## Purpose

Permite reservar rangos de agenda de un profesional o de un sillón para que no se asignen turnos en ese período, y administrar esos bloqueos sin depender de turnos ficticios.

## ADDED Requirements

### Requirement: Crear bloqueo válido

El sistema SHALL crear un bloqueo mediante `POST /api/bloqueos` cuando reciba `profesionalId` o `sillonId`, `inicio`, `fin` y `motivo` válidos, respondiendo `201` con el bloqueo creado, su `id`, `creadoPor` y `createdAt`.

#### Scenario: Bloqueo de un profesional

- **WHEN** un Administrador o Recepcionista envía `POST /api/bloqueos` con `profesionalId`, `inicio`, `fin` y `motivo` válidos
- **THEN** el sistema responde `201` con el bloqueo creado
- **AND** el bloqueo persistido contiene `id`, `profesionalId`, `inicio`, `fin`, `motivo`, `creadoPor` y `createdAt`

#### Scenario: Bloqueo de un sillón

- **WHEN** se envía `POST /api/bloqueos` con `sillonId` en lugar de `profesionalId`
- **THEN** el sistema responde `201` con el bloqueo creado asociado a ese sillón

#### Scenario: Bloqueo de profesional y sillón a la vez

- **WHEN** se envía `POST /api/bloqueos` con `profesionalId` y `sillonId` juntos
- **THEN** el sistema responde `201` con ambos recursos asociados al bloqueo

### Requirement: Recurso obligatorio en el bloqueo

El sistema SHALL rechazar con `400` y código `BLOQUEO_RECURSO_REQUERIDO` un bloqueo que no incluya ni `profesionalId` ni `sillonId`, sin persistirlo.

#### Scenario: Sin recurso

- **WHEN** se envía `POST /api/bloqueos` sin `profesionalId` y sin `sillonId`
- **THEN** el sistema responde `400` con código `BLOQUEO_RECURSO_REQUERIDO`
- **AND** no se persiste ningún bloqueo

### Requirement: Intervalo de bloqueo válido

El sistema SHALL rechazar con `400` y código `BLOQUEO_INTERVALO_INVALIDO` un bloqueo cuyo `fin` no sea posterior a `inicio`, sin persistirlo.

#### Scenario: Fin anterior al inicio

- **WHEN** se envía `POST /api/bloqueos` con `fin` anterior a `inicio`
- **THEN** el sistema responde `400` con código `BLOQUEO_INTERVALO_INVALIDO`
- **AND** no se persiste ningún bloqueo

#### Scenario: Fin igual al inicio

- **WHEN** se envía `POST /api/bloqueos` con `fin` igual a `inicio`
- **THEN** el sistema responde `400` con código `BLOQUEO_INTERVALO_INVALIDO`

### Requirement: Existencia y estado de los recursos bloqueados

El sistema SHALL validar que el profesional y/o el sillón indicados existan y estén activos antes de crear el bloqueo, reutilizando `404 PROFESIONAL_NO_ENCONTRADO`, `404 SILLON_NO_ENCONTRADO` y `409 RECURSO_INACTIVO`.

#### Scenario: Profesional inexistente

- **WHEN** se envía `POST /api/bloqueos` con un `profesionalId` que no existe
- **THEN** el sistema responde `404` con código `PROFESIONAL_NO_ENCONTRADO`
- **AND** no se persiste ningún bloqueo

#### Scenario: Sillón inexistente

- **WHEN** se envía `POST /api/bloqueos` con un `sillonId` que no existe
- **THEN** el sistema responde `404` con código `SILLON_NO_ENCONTRADO`
- **AND** no se persiste ningún bloqueo

#### Scenario: Profesional inactivo

- **WHEN** se envía `POST /api/bloqueos` con un profesional inactivo
- **THEN** el sistema responde `409` con código `RECURSO_INACTIVO`
- **AND** no se persiste ningún bloqueo

#### Scenario: Sillón inactivo

- **WHEN** se envía `POST /api/bloqueos` con un sillón inactivo
- **THEN** el sistema responde `409` con código `RECURSO_INACTIVO`
- **AND** no se persiste ningún bloqueo

### Requirement: Validación de entrada HTTP de bloqueos

El sistema SHALL rechazar con `400` y código `VALIDACION_FALLIDA` un `POST /api/bloqueos` con campos faltantes o inválidos, indicando el detalle por campo.

#### Scenario: Campo obligatorio faltante

- **WHEN** se envía `POST /api/bloqueos` sin `motivo`, `inicio` o `fin`
- **THEN** el sistema responde `400` con código `VALIDACION_FALLIDA`
- **AND** `details` identifica el campo faltante

#### Scenario: Identificador inválido

- **WHEN** se envía `POST /api/bloqueos` con un `profesionalId` o `sillonId` que no es UUID
- **THEN** el sistema responde `400` con código `VALIDACION_FALLIDA`

#### Scenario: Fecha inválida

- **WHEN** se envía `POST /api/bloqueos` con `inicio` o `fin` que no es una fecha ISO 8601 válida
- **THEN** el sistema responde `400` con código `VALIDACION_FALLIDA`

### Requirement: Autorización de los endpoints de bloqueo

El sistema SHALL permitir crear y consultar bloqueos solo a usuarios autenticados con rol Administrador o Recepcionista, y eliminar bloqueos solo a Administrador, respondiendo `401 NO_AUTENTICADO` sin sesión y `403 SIN_PERMISO` con rol insuficiente.

#### Scenario: Recepcionista crea y consulta bloqueos

- **WHEN** un usuario autenticado con rol Recepcionista envía `POST /api/bloqueos` o `GET /api/bloqueos`
- **THEN** el sistema procesa la request con normalidad

#### Scenario: Profesional intenta crear un bloqueo

- **WHEN** un usuario autenticado con rol Profesional envía `POST /api/bloqueos`
- **THEN** el sistema responde `403` con código `SIN_PERMISO`
- **AND** no se persiste ningún bloqueo

#### Scenario: Profesional intenta consultar bloqueos

- **WHEN** un usuario autenticado con rol Profesional envía `GET /api/bloqueos`
- **THEN** el sistema responde `403` con código `SIN_PERMISO`

#### Scenario: Recepcionista intenta eliminar un bloqueo

- **WHEN** un usuario autenticado con rol Recepcionista envía `DELETE /api/bloqueos/:id`
- **THEN** el sistema responde `403` con código `SIN_PERMISO`
- **AND** el bloqueo continúa existiendo

#### Scenario: Request sin sesión

- **WHEN** se envía una request a cualquier endpoint de `/api/bloqueos` sin sesión válida
- **THEN** el sistema responde `401` con código `NO_AUTENTICADO`

### Requirement: Consultar bloqueos por rango

El sistema SHALL devolver mediante `GET /api/bloqueos?desde&hasta` los bloqueos cuyo intervalo intersecta `[desde, hasta)`, ordenados por `inicio` ascendente; ambos parámetros son opcionales y sin ellos se listan todos.

#### Scenario: Intersección con el rango

- **WHEN** se envía `GET /api/bloqueos?desde=...&hasta=...` y existe un bloqueo que intersecta el rango
- **THEN** el sistema responde `200` incluyendo ese bloqueo

#### Scenario: Bloqueo fuera del rango

- **WHEN** existe un bloqueo que no intersecta `[desde, hasta)`
- **THEN** el bloqueo no aparece en la respuesta

#### Scenario: Orden por inicio

- **WHEN** existen varios bloqueos dentro del rango
- **THEN** la respuesta los devuelve ordenados por `inicio` ascendente

#### Scenario: Sin filtros

- **WHEN** se envía `GET /api/bloqueos` sin `desde` ni `hasta`
- **THEN** el sistema responde `200` con todos los bloqueos

### Requirement: Validación del rango de consulta de bloqueos

El sistema SHALL rechazar con `400` y código `RANGO_INVALIDO` una consulta `GET /api/bloqueos` que envíe `desde` y `hasta` con `desde` mayor o igual a `hasta`.

#### Scenario: Rango inválido

- **WHEN** se envía `GET /api/bloqueos?desde=...&hasta=...` con `desde >= hasta`
- **THEN** el sistema responde `400` con código `RANGO_INVALIDO`

#### Scenario: Rango válido

- **WHEN** se envía `GET /api/bloqueos?desde=...&hasta=...` con `desde < hasta`
- **THEN** el sistema responde `200` con los bloqueos correspondientes

### Requirement: Eliminar bloqueo

El sistema SHALL eliminar físicamente un bloqueo existente mediante `DELETE /api/bloqueos/:id`, respondiendo `204` sin body, y dejar de devolverlo en las consultas posteriores.

#### Scenario: Eliminación exitosa

- **WHEN** un Administrador envía `DELETE /api/bloqueos/:id` para un bloqueo existente
- **THEN** el sistema responde `204` sin body
- **AND** el bloqueo deja de aparecer en `GET /api/bloqueos`

### Requirement: Eliminar bloqueo inexistente

El sistema SHALL responder `404` con código `BLOQUEO_NO_ENCONTRADO` al intentar eliminar un bloqueo que no existe.

#### Scenario: Id inexistente

- **WHEN** un Administrador envía `DELETE /api/bloqueos/:id` con un `id` que no existe
- **THEN** el sistema responde `404` con código `BLOQUEO_NO_ENCONTRADO`

### Requirement: Identificador y fechas del bloqueo

El sistema SHALL generar un `id` UUID para cada bloqueo y persistir `inicio` y `fin` como fechas ISO 8601 UTC que definen el intervalo semiabierto `[inicio, fin)`.

#### Scenario: Identificador generado

- **WHEN** se crea un bloqueo sin enviar `id`
- **THEN** el bloqueo persistido tiene un `id` con formato UUID generado por el sistema

#### Scenario: Bloqueos contiguos no se superponen

- **WHEN** existe un bloqueo `[09:00, 09:30)` y se crea otro bloqueo `[09:30, 10:00)` del mismo recurso
- **THEN** ambos bloqueos se persisten sin conflicto entre sí
