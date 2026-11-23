# Proposal

## Why

La agenda actual rechaza cualquier superposición de turnos del mismo profesional, pero la operación real necesita atender urgencias o pacientes habituales en el horario ya ocupado sin liberar el sillón (US-008, RN-AG-12). C-07 `bloqueos-agenda` ya introdujo la excepción `forzar` para bloqueos con auditoría de administrador; este change agrega la excepción equivalente para el solapamiento y el bloqueo del profesional, manteniendo protegido el sillón y la trazabilidad de quién autoriza.

## What Changes

- Se acepta el campo opcional `esSobreturno?: boolean` en el body de `POST /api/turnos`; cuando es `true`, el turno se persiste con `esSobreturno: true`.
- La creación de sobreturnos queda reservada a `administrador` y `recepcionista`; cualquier otro rol autenticado recibe `403 SIN_PERMISO` y no se persiste el turno.
- Un sobreturno omite la validación de solapamiento con turnos activos del mismo profesional y la validación de bloqueo vigente del profesional.
- Un sobreturno **nunca** omite el solapamiento con turnos activos del mismo sillón ni el bloqueo vigente del sillón: estos se rechazan con `TURNO_SOLAPADO_SILLON` y `TURNO_BLOQUEADO` respectivamente.
- Todo sobreturno registra `autorizadoPor` con el `id` del usuario autenticado de la sesión; el campo no puede ser suplantado desde el body.
- La excepción `forzar` de C-07 sigue vigente y es exclusiva de `administrador`: si ambas flags se envían juntas, se aplican las reglas más restrictivas (precedencia de recursos → solapamiento profesional → solapamiento sillón → bloqueo profesional → bloqueo sillón; el solapamiento de sillón nunca se salta).
- Se actualizan los schemas Zod, la ruta HTTP, el caso de uso `CrearTurno` y las reglas de validación, con tests unitarios y de integración nuevos y ajustes a las fixtures existentes.
- **BREAKING** (solo en el contrato interno de validación, no en la API existente): `POST /api/turnos` acepta un campo opcional nuevo y un valor `esSobreturno: true` cambia las validaciones aplicadas; las requests sin el campo conservan el comportamiento actual.

## Capabilities

### New Capabilities

Ninguna: no se introduce una capacidad nueva.

### Modified Capabilities

- `turnos`: la creación de turnos incorpora el flag `esSobreturno`, la autorización por rol para usarlo, la omisión controlada de solapamiento y bloqueo del profesional, la preservación de las validaciones del sillón y el registro de `autorizadoPor` desde la sesión.

## Impact

- **Dependencias**: C-09 `auth-rbac` aporta la sesión, `request.usuario` y `SIN_PERMISO`; C-07 `bloqueos-agenda` aporta los bloqueos, `forzar` y `TURNO_BLOQUEADO`. Los tres changes se aplican secuencialmente en la misma rama `feat/c-09-c-07-c-08-seguridad-agenda` (C-09 → C-07 → C-08), sin branches separadas.
- **Código afectado**: `src/http/schemas/turno.ts` (`esSobreturno` opcional), `src/http/routes/turnos.ts` (chequeo de rol y `autorizadoPor` desde la sesión), `src/application/crear-turno.ts` (omisiones y auditoría), y políticas de autorización de `src/application/auth/politicas.ts`. `Turno` ya expone `esSobreturno: boolean` y `autorizadoPor?: string`, por lo que no cambia el modelo.
- **APIs**: `POST /api/turnos` acepta `esSobreturno`; responde `201` con el turno, `403 SIN_PERMISO` sin rol habilitado, `400 VALIDACION_FALLIDA` con el flag inválido y las respuestas existentes de solapamiento/bloqueo del sillón.
- **Tests**: nuevos tests unitarios de `CrearTurno` y de la política de roles, nuevos tests de integración HTTP, y actualización de `tests/unit/application/crear-turno.test.ts`, `tests/integration/turnos.test.ts` y las fixtures de `Repositorios` con bloqueos y sesiones (C-07/C-09).
- **Riesgos**: combinar `esSobreturno` con `forzar` puede relajar demasiadas validaciones si no se centraliza la precedencia; se mitiga con tests de precedencia y con el chequeo de permiso en la ruta. No se agrega UI ni persistencia nueva.
