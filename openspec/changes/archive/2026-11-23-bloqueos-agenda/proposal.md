# Proposal

## Why

La agenda actual impide solapar turnos, pero no permite reservar un rango de un profesional o de un sillón por cirugía, reunión o mantenimiento (US-007, RN-AG-11). Sin bloqueos, la única forma de preservar ese tiempo es crear un turno ficticio, y no existe una excepción auditada para urgencias que un Administrador decida autorizar. Además, C-08 (sobreturnos) y C-11 (disponibilidad) necesitan que el modelo de bloqueo y sus reglas existan antes de extenderse.

## What Changes

- Se agrega el modelo de dominio `Bloqueo` con `id`, `profesionalId?`, `sillonId?`, `inicio`, `fin`, `motivo`, `creadoPor` y `createdAt`; se exige al menos un recurso (`profesionalId` o `sillonId`) y `fin > inicio`, con intervalos semiabiertos `[inicio, fin)`.
- Se agrega el puerto `BloqueoRepository` y su implementación `InMemoryBloqueoRepository` (crear, buscar por id, listar por rango y recurso, buscar solapados por profesional/sillón y eliminar). Se integra como `Repositorios.bloqueos`, en `buildServer` y en `main.ts`.
- Se agregan los endpoints `POST /api/bloqueos` (Administrador o Recepcionista), `GET /api/bloqueos?desde&hasta` (Administrador o Recepcionista) y `DELETE /api/bloqueos/:id` (Administrador, borrado físico).
- Se agregan códigos de error estables: `BLOQUEO_INTERVALO_INVALIDO` (400), `BLOQUEO_RECURSO_REQUERIDO` (400), `BLOQUEO_NO_ENCONTRADO` (404) y `TURNO_BLOQUEADO` (409 con `details.bloqueo`). Se reutilizan `PROFESIONAL_NO_ENCONTRADO`, `SILLON_NO_ENCONTRADO` y `RECURSO_INACTIVO` para los recursos referenciados.
- `CrearTurno` verifica bloqueos del profesional y del sillón después de los solapamientos de turno y antes de persistir. Un conflicto responde `409 TURNO_BLOQUEADO`; la precedencia entre validaciones queda definida y documentada.
- Se agrega `forzar?: boolean` al body de `POST /api/turnos`. Solo un Administrador puede forzar un bloqueo; sin permiso se responde `403 SIN_PERMISO`. Cuando la excepción se aplica, el turno registra `autorizadoPor` con el id del usuario.
- Se agregan tests unitarios de dominio, repositorio y caso de uso, y tests de integración HTTP para bloqueos, rechazos de turno, contigüidad, excepción autorizada y roles.
- Quedan fuera de alcance C-08 (sobreturnos), la implementación de autenticación/RBAC (C-09) y la persistencia SQLite (C-10).

## Capabilities

### New Capabilities

- `bloqueos`: gestión de bloqueos de agenda por profesional o sillón, incluida su creación, consulta por rango, eliminación y validaciones de recursos e intervalo.

### Modified Capabilities

- `turnos`: la creación de turnos incorpora el rechazo por bloqueo vigente del profesional o del sillón, la excepción autorizada por Administrador con registro de `autorizadoPor`, la precedencia de validaciones de agenda y la contigüidad respecto de bloqueos.

## Impact

- Código afectado:
  - Nuevo: `src/domain/bloqueo/bloqueo.ts`, `src/domain/bloqueo/bloqueo.errors.ts`, `src/application/ports/bloqueo-repository.ts`, `src/infrastructure/persistence/in-memory-bloqueo-repository.ts`, `src/application/bloqueos/crear-bloqueo.ts`, `listar-bloqueos.ts`, `eliminar-bloqueo.ts`, `src/http/routes/bloqueos.ts`, `src/http/schemas/bloqueo.schema.ts`.
  - Modificado: `src/application/ports/repositorios.ts`, `src/application/crear-turno.ts`, `src/domain/turno/turno.errors.ts`, `src/http/routes/turnos.ts`, `src/http/schemas/turno.ts`, `src/http/error-handler.ts`, `src/http/server.ts`, `src/main.ts`.
- APIs: nuevos `POST/GET/DELETE /api/bloqueos`; `POST /api/turnos` acepta `forzar` y puede responder `403 SIN_PERMISO` o `409 TURNO_BLOQUEADO`.
- Tests: nuevos unitarios de dominio, repositorio y casos de uso; nuevo `tests/integration/bloqueos.test.ts`; ampliación de `tests/unit/application/crear-turno.test.ts` y `tests/integration/turnos.test.ts`; actualización de fixtures de `Repositorios` en los tests existentes.
- Dependencias: C-03 `turno-creation` (mergeado) y C-09 `auth-rbac` (necesario para `request.usuario`, `requireRole` y el error `SIN_PERMISO`). C-08 `sobreturnos` depende de este change.
- Riesgos: C-09 se implementa antes en la misma rama (`feat/c-09-c-07-c-08-seguridad-agenda`), por lo que la integración HTTP de roles y `forzar` se prueba sobre ese estado; la concurrencia en memoria no es atómica (aceptable en v0.1); US-007 menciona al profesional como actor, pero el contrato de este change limita la creación de bloqueos a Administrador y Recepcionista según la matriz RBAC.
