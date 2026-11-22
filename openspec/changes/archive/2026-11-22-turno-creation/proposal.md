# Proposal

## Why

El núcleo del producto es la agenda de turnos: hoy no existe un caso de uso ni un endpoint que permita a la recepcionista reservar un turno validando que no se superponga con otro del mismo profesional ni del mismo sillón. Sin esta capacidad no es posible demostrar el MVP ni habilitar los changes posteriores (consulta, cancelación, bloqueos). Se implementa ahora que el modelo de dominio (C-02) está disponible.

## What Changes

- Se agrega `POST /api/turnos` con body `{ pacienteId, profesionalId, sillonId, prestacionId, inicio }` y validación Zod (fechas ISO 8601, IDs UUID), rechazando `400` con detalle por campo.
- Se implementa el caso de uso `CrearTurno`: valida existencia y estado activo de paciente, profesional, sillón y prestación; calcula `fin = inicio + duracionMinutos`; valida `fin > inicio`.
- Se valida doble solapamiento: profesional (`409 TURNO_SOLAPADO_PROFESIONAL`) y sillón (`409 TURNO_SOLAPADO_SILLON`), incluyendo `details.turnoEnConflicto` con el turno en conflicto.
- Se persiste el turno en estado `pendiente` con `createdBy`, `createdAt` y `updatedAt`.
- Se agrega un mapeador centralizado de errores de dominio a HTTP (`error-handler.ts`).
- Se agregan tests unitarios de dominio y de integración HTTP: caso feliz, solapamiento por profesional, solapamiento por sillón, contiguo, recurso inactivo, recurso inexistente.

## Capabilities

### New Capabilities

- `turnos`: creación de turnos con validación de existencia/actividad de recursos, cálculo de duración desde la prestación, doble validación de solapamiento (profesional y sillón) y persistencia en estado `pendiente`.

### Modified Capabilities

- (ninguna)

## Impact

- Código afectado: `src/application/crear-turno.ts` (nuevo), `src/http/routes/turnos.ts` (nuevo), `src/http/schemas/turno.ts` (nuevo), `src/http/error-handler.ts` (nuevo), `src/http/server.ts` (registro de rutas y handler).
- APIs: nuevo endpoint `POST /api/turnos`.
- Dependencias: C-02 `core-domain-models` (DONE). Sin dependencias externas nuevas.
- Riesgo: la persistencia sigue siendo en memoria; la validación de solapamiento depende de `ocupaAgenda` y del repositorio en memoria ya existentes.