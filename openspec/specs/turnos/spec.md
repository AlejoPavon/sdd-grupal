# turnos Specification

## Purpose

Permite crear turnos de atención odontológica validando recursos, duración y solapamientos, persistiendo el turno en estado pendiente con trazabilidad.

## Requirements

### Requirement: Crear turno válido

El sistema SHALL crear un turno cuando se envían datos válidos y el horario está libre, persistiendo el turno en estado `pendiente` y respondiendo `201` con el turno creado.

#### Scenario: Creación exitosa
- **WHEN** se envía `POST /api/turnos` con paciente, profesional, sillón, prestación y `inicio` válidos, y no existe solapamiento
- **THEN** el sistema persiste el turno en estado `pendiente`
- **AND** responde `201` con el turno creado incluyendo su `id`, `inicio`, `fin` y `estado`

### Requirement: Cálculo de fin desde la prestación

El sistema SHALL calcular `fin` como `inicio + duracionMinutos` de la prestación indicada.

#### Scenario: Fin calculado
- **WHEN** se crea un turno con una prestación de duración conocida
- **THEN** el `fin` del turno resulta de sumar la duración de la prestación al `inicio`

### Requirement: Trazabilidad del turno creado

El sistema SHALL registrar `createdBy`, `createdAt` y `updatedAt` en todo turno creado.

#### Scenario: Trazabilidad presente
- **WHEN** se crea un turno válido
- **THEN** el turno persistido contiene `createdBy`, `createdAt` y `updatedAt` no nulos

### Requirement: Validación de entrada HTTP

El sistema SHALL rechazar con `400` cualquier request con campos obligatorios faltantes o inválidos, incluyendo el detalle por campo.

#### Scenario: Campo faltante
- **WHEN** se envía `POST /api/turnos` sin un campo obligatorio
- **THEN** el sistema responde `400` con el detalle del campo faltante

#### Scenario: Fecha inválida
- **WHEN** se envía un `inicio` que no es una fecha ISO 8601 válida
- **THEN** el sistema responde `400` con el detalle del campo

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

El sistema SHALL rechazar con `409` y código `RECURSO_INACTIVO` cuando el profesional, sillón o prestación están inactivos.

#### Scenario: Recurso inactivo
- **WHEN** se crea un turno con un recurso inactivo
- **THEN** el sistema responde `409` con código `RECURSO_INACTIVO`
- **AND** no se persiste ningún turno

### Requirement: Intervalo válido

El sistema SHALL rechazar con `400` y código `TURNO_INTERVALO_INVALIDO` cuando `fin` no es posterior a `inicio`.

#### Scenario: Fin no posterior
- **WHEN** el cálculo resulta en `fin <= inicio`
- **THEN** el sistema responde `400` con código `TURNO_INTERVALO_INVALIDO`

### Requirement: No solapamiento por profesional

El sistema SHALL rechazar con `409` y código `TURNO_SOLAPADO_PROFESIONAL` cuando existe un turno activo (`pendiente` o `confirmado`) del mismo profesional que se superpone con `[inicio, fin)`, incluyendo en `details.turnoEnConflicto` el turno en conflicto.

#### Scenario: Solapamiento parcial
- **WHEN** se crea un turno cuyo intervalo se superpone parcialmente con un turno activo del mismo profesional
- **THEN** el sistema responde `409` con código `TURNO_SOLAPADO_PROFESIONAL`
- **AND** `details.turnoEnConflicto` identifica el turno en conflicto (`id`, `inicio`, `fin`)
- **AND** no se persiste ningún turno nuevo

#### Scenario: Turno cancelado no bloquea
- **WHEN** existe un turno `cancelado` del mismo profesional en el mismo horario
- **THEN** la creación del nuevo turno no genera conflicto por profesional

### Requirement: No solapamiento por sillón

El sistema SHALL rechazar con `409` y código `TURNO_SOLAPADO_SILLON` cuando existe un turno activo del mismo sillón que se superpone con `[inicio, fin)`, incluyendo en `details.turnoEnConflicto` el turno en conflicto.

#### Scenario: Solapamiento por sillón
- **WHEN** se crea un turno cuyo intervalo se superpone con un turno activo del mismo sillón
- **THEN** el sistema responde `409` con código `TURNO_SOLAPADO_SILLON`
- **AND** `details.turnoEnConflicto` identifica el turno en conflicto
- **AND** no se persiste ningún turno nuevo

#### Scenario: Profesional distinto en sillón libre
- **WHEN** se crea un turno para un profesional distinto en un sillón sin conflicto
- **THEN** la creación es exitosa

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
