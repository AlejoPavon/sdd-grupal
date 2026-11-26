# Tasks

## 1. Entrega estática desde Fastify

- [x] 1.1 Crear `web/index.html` con el entrypoint de la SPA, el favicon SVG inline y los enlaces a `styles.css`, `app.js` y `helpers.js`; verificar con `tests/integration/frontend.test.ts` que `/` y `/index.html` responden `200` con HTML.
- [x] 1.2 Crear `src/http/routes/frontend.ts` con lista explícita de archivos permitidos y tipos MIME; verificar con test de integración que `/styles.css`, `/app.js` y `/helpers.js` responden `200` y que `/package.json` responde `404`.
- [x] 1.3 Registrar `registrarFrontend(app)` en `src/http/server.ts` sin tocar `/health` ni el prefijo `/api`; verificar que los tests de health y auth siguen pasando.

## 2. Utilidades del cliente

- [x] 2.1 Implementar en `web/helpers.js` el formateo en `America/Argentina/Buenos_Aires` y la conversión de `datetime-local` a ISO 8601 UTC para intervalos `[inicio, fin)`; verificar con casos fijos en `tests/unit/web/helpers.test.js`.
- [x] 2.2 Implementar el escapado de HTML y la traducción de `{ code, message, details }` a mensajes de usuario, incluido el turno en conflicto; verificar con tests unitarios de helpers y con el flujo de `409` en navegador.
- [x] 2.3 Implementar `cargasPorVista()` para que el selector de "Nuevo turno" use el listado completo de pacientes y no el resultado de una búsqueda previa; verificar con test de regresión y con el flujo en navegador.
- [x] 2.4 Ampliar `vitest.config.ts` para incluir `tests/**/*.test.js` junto a los `.ts`; verificar que `npm test` descubre y ejecuta los tests del cliente.

## 3. Interfaz web

- [x] 3.1 Implementar login, restauración de sesión y logout sobre la cookie existente, con manejo de `401`; verificar el flujo completo en navegador y que la consola quede sin errores.
- [x] 3.2 Implementar la agenda con filtro por fecha y profesional, estados vacío y de carga, y cancelación con confirmación; verificar que la lista se actualice tras cancelar.
- [x] 3.3 Implementar alta, listado y búsqueda de pacientes con mensaje de confirmación; verificar que un paciente creado aparece en el listado y que la búsqueda filtra por nombre, apellido o documento.
- [x] 3.4 Implementar el formulario de nuevo turno con catálogos de profesionales, sillones y prestaciones, conversión local → UTC y retorno a la agenda; verificar guardado exitoso y detalle legible ante `409`.
- [x] 3.5 Implementar la consulta de bloqueos solo para `administrador` y `recepcionista`; verificar que un usuario `profesional` no ve la sección en la navegación.
- [x] 3.6 Implementar estilos responsive, foco visible, contraste suficiente y `prefers-reduced-motion`; verificar capturas a 390x844 y 1440x900 en `.playwright-mcp/c20-*.png`.

## 4. Verificación del change

- [x] 4.1 Ejecutar `npm test` y verificar la suite completa en verde, incluidos los tests nuevos de `web/` y del serving estático.
- [x] 4.2 Ejecutar `npm run typecheck` y `npm run lint` y verificar que ambos terminan sin errores.
- [x] 4.3 Verificar en navegador login, sesión restaurada, alta/búsqueda de pacientes, crear turno, conflicto `409`, cancelar con confirmación, logout y requests `/api/*` sin fallos; guardar las capturas mobile/desktop como evidencia local.
- [x] 4.4 Corregir el favicon 404 y el filtro de pacientes que se filtraba en "Nuevo turno"; verificar que no quedan requests fallidos ni errores de consola.

## Workflow follow-up

- Sincronizar la capability nueva `interfaz-web` al spec principal antes de archivar.
- Archivar el cambio como `2026-11-25-frontend-basico-profesional` y verificar el resultado.
- Cerrar la ficha C-20 en `CHANGES.md` y actualizar `docs/equipo/nathaniel-herrera.md`.
