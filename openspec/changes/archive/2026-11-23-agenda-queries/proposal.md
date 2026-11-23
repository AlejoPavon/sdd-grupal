# Proposal

## Why

El MVP permite crear turnos, pero no consultar la agenda: la recepcionista y el profesional no pueden ver los turnos de un rango, ni abrir un turno por id, ni listar los recursos de referencia (profesionales, sillones, prestaciones) necesarios para armar la UI de agenda. Sin esta capacidad no se puede demostrar el flujo de consulta (US-005) ni alimentar los changes posteriores (disponibilidad, reserva online). Se implementa ahora que C-03 (creación) y C-06 (pacientes) están disponibles.

## What Changes

- Se agrega `GET /api/turnos?desde&hasta&profesionalId&sillonId` que devuelve los turnos activos (`pendiente` y `confirmado`) que intersectan el rango, filtrables por profesional y/o sillón, ordenados por `inicio` ascendente y enriquecidos con paciente y prestación resumidos.
- Se agrega validación de rango: si `desde` y `hasta` se envían y `desde >= hasta`, responde `400 RANGO_INVALIDO`.
- Se agrega `GET /api/turnos/:id` que devuelve el turno o `404 TURNO_NO_ENCONTRADO`.
- Se agregan `GET /api/profesionales`, `GET /api/sillones` y `GET /api/prestaciones` que listan los recursos de referencia del seed.
- Se agregan casos de uso de aplicación para listar/obtener turnos y listar catálogos, reutilizando los repositorios existentes.

## Capabilities

### New Capabilities

- `catalogos`: listado de recursos de referencia (profesionales, sillones, prestaciones) para la agenda.

### Modified Capabilities

- `turnos`: se agregan requisitos de consulta de agenda por rango/filtros, orden, exclusión de turnos no activos, enriquecimiento con paciente y prestación resumidos, consulta por id con 404 tipado y validación de rango (`RANGO_INVALIDO`).

## Impact

- Código afectado: `src/http/routes/turnos.ts` (nuevas rutas GET), nueva ruta de catálogos, `src/http/schemas/turno.ts` (schema de query), `src/http/server.ts` (registro), nuevos casos de uso en `src/application/turnos/` y `src/application/catalogos/`, `src/domain/turno/turno.errors.ts` (`RangoInvalidoError`).
- APIs: nuevos endpoints `GET /api/turnos`, `GET /api/turnos/:id`, `GET /api/profesionales`, `GET /api/sillones`, `GET /api/prestaciones`.
- Dependencias: C-03 `turno-creation` y C-06 `pacientes-crud` (DONE). Sin dependencias externas nuevas ni persistencia nueva (sigue en memoria).
- Riesgo: la consulta filtra en memoria; la validación de rango se resuelve en la capa de aplicación. La respuesta enriquecida depende de que paciente y prestación existan (seed garantizado).