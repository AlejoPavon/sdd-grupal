# Proposal

## Why

El proyecto tiene una API REST completa para gestionar agenda, pacientes y bloqueos, pero el único acceso es por HTTP. C-20 incorpora un cliente web sencillo y con acabado profesional para que recepción y administración operen el consultorio sin herramientas externas, sin mover ninguna regla de negocio fuera del dominio.

## What Changes

- Se sirve una SPA estática desde el propio servidor Fastify, con una lista explícita de archivos permitidos (`/`, `/index.html`, `/styles.css`, `/app.js`, `/helpers.js`). No se agregan dependencias de frontend ni se exponen archivos del repositorio.
- La interfaz gestiona login, restauración de sesión y logout con la cookie existente, y responde a `401` volviendo al acceso.
- Se agregan vistas de agenda con filtro por fecha y profesional, listado y búsqueda de pacientes, alta de pacientes, creación y cancelación de turnos, y consulta de bloqueos solo para roles de gestión.
- Las fechas del formulario se interpretan en `America/Argentina/Buenos_Aires` y se envían como ISO 8601 UTC; los intervalos presentados son semiabiertos `[inicio, fin)`.
- Los errores de negocio con `{ code, message, details }` se traducen a mensajes de usuario, incluido el detalle del turno en conflicto. La cancelación pide confirmación.
- La interfaz es responsive (390x844 y 1440x900), con foco visible, contraste suficiente y `prefers-reduced-motion`; los datos de paciente son ficticios.

## Capabilities

### New Capabilities

- `interfaz-web`: comportamiento observable del cliente web para operar la agenda: sesión, vistas, presentación en zona horaria del consultorio, estados vacíos y de error, y confines de visualización por rol.

### Modified Capabilities

- (ninguna; `auth`, `turnos`, `pacientes`, `catalogos` y `bloqueos` conservan sus requisitos y contratos HTTP)

## Impact

- Código nuevo: `web/index.html`, `web/styles.css`, `web/app.js`, `web/helpers.js` y `src/http/routes/frontend.ts`.
- Código existente tocado: `src/http/server.ts` (registro de las rutas estáticas) y `vitest.config.ts` (incluir tests `.js` del cliente).
- Tests nuevos: `tests/unit/web/helpers.test.js` y `tests/integration/frontend.test.ts`.
- Sin cambios en dependencias, esquemas de la API, reglas de negocio ni persistencia. `/health` sigue público; `/package.json` devuelve `404`.
- Fuera de alcance: alta/edición/eliminación de bloqueos desde la UI, reserva online, pagos, reportes y cualquier lógica de dominio en el cliente.
