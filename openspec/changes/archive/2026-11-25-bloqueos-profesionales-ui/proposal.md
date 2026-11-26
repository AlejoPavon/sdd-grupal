# Proposal

## Why

El cliente web incorporado en C-20/Task C-20 permite consultar bloqueos, pero solo en modo de lectura: recepción y administración deben recurrir a la API para dar de alta un bloqueo y no pueden gestionarlo desde la interfaz. Este change extiende la pestaña de bloqueos para que las operaciones ya disponibles en el servidor se puedan realizar desde la UI, sin mover reglas de negocio al cliente ni modificar contratos HTTP.

## What Changes

- Se agrega en `vistaBloqueos()` un formulario para crear bloqueos de profesional: selector obligatorio de profesionales del catálogo, fechas `desde`/`hasta` con valor por defecto `hoyEnZona()`, `motivo` y envío a `POST /api/bloqueos` con el rango del día convertido a ISO 8601 UTC.
- Se valida en el cliente solo que `desde <= hasta`, con mensaje de error visible; la autorización, el intervalo válido y el resto de reglas de negocio siguen siendo responsabilidad del servidor.
- Se incorpora una acción de eliminación visible solo para `administrador`, que invoca `DELETE /api/bloqueos/:id`, informa resultado y recarga el listado; `recepcionista` puede crear y consultar, pero no eliminar.
- Se muestra un bloqueo ilustrativo etiquetado `Ejemplo` con el primer profesional del catálogo y fechas demo fijas, visible incluso cuando la API devuelve una lista vacía. El ejemplo es solo de UI: no se persiste ni se agrega al seed.
- Se amplían las utilidades puras del cliente con el cálculo del rango de fechas del formulario y se ajustan las cargas de la vista `bloqueos` para poblar el selector desde `/api/profesionales`.
- Se extienden los tests unitarios del cliente con Vitest para las nuevas utilidades y las cargas por vista.

## Capabilities

### New Capabilities

- (ninguna; se reutiliza `interfaz-web`, que ya cubre el comportamiento observable del cliente)

### Modified Capabilities

- `interfaz-web`: se extiende el requisito de visualización de bloqueos según el rol con alta de bloqueos, selector de profesionales, rango de fechas, bloqueo de ejemplo y eliminación restringida a administración.

## Impact

- Código existente tocado: `web/app.js`, `web/helpers.js` y `tests/unit/web/helpers.test.js`.
- Sin cambios en `src/`: permanecen intactos esquemas, rutas, repositorios, dominio, seed y migraciones de bloqueos; no se agregan endpoints ni dependencias.
- Sin cambios en `src/http/routes/frontend.ts`: la lista estática permitida sigue siendo la misma y no se agregan assets.
- Se revierte explícitamente el no-goal registrado en `openspec/changes/archive/2026-11-25-frontend-basico-profesional/design.md`: «Alta/edición/borrado de bloqueos desde la UI (solo lectura)». La edición de bloqueos sigue fuera de alcance.
- Riesgo controlado: la validación local de fechas es solo una ayuda al usuario; el servidor continúa siendo la autoridad para `BLOQUEO_INTERVALO_INVALIDO`, `SIN_PERMISO` y cualquier otra regla.
