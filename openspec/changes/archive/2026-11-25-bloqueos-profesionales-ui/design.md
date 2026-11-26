# Design

## Context

La SPA vanilla en `web/` ya consume la API de bloqueos en modo de lectura: `vistaBloqueos()` solo renderiza una tabla y `cargasPorVista("bloqueos")` recarga únicamente `GET /api/bloqueos`. El servidor ya expone `POST /api/bloqueos` para gestión, `GET /api/bloqueos` con filtros opcionales y `DELETE /api/bloqueos/:id` restringido a administración, con validación Zod y reglas en el dominio. La política visual del proyecto está en `off` y no hay sistema de diseño ni mockups para este cambio. Ver `proposal.md` para la motivación y los requisitos en `specs/interfaz-web/spec.md`.

## UI Mockups

- Decision: no (project policy), 2026-11-25.
- Motivo: `foundation.phases.visual-design.variant = off` en `.active-orchestrator-state.json`, sin carpeta `design-system/`; no se aplica el gate de sistema visual ni el de mockups por cambio. El precedente archivado `2026-11-25-frontend-basico-profesional` registró la misma decisión.
- No se crea carpeta `mockups/` ni se agregan assets: se reutilizan `.form`, `.card`, `.toolbar` y los estilos existentes de `web/styles.css`.

## Goals / Non-Goals

**Goals:**

- Permitir el alta y la consulta de bloqueos de profesional desde la pestaña existente, con el profesional obtenido del catálogo.
- Interpretar `desde`/`hasta` como días completos de `America/Argentina/Buenos_Aires` y enviar el intervalo en ISO 8601 UTC.
- Mostrar una acción de eliminación condicionada al rol, apoyándose en la autoridad real del `preHandler` de Fastify.
- Mostrar un ejemplo ilustrativo etiquetado cuando la lista real esté vacía, sin tocar el seed ni la persistencia.
- Cubrir las utilidades nuevas con tests unitarios y dejar la verificación TDD lista para la fase de apply.

**Non-Goals:**

- Modificar contratos HTTP, esquemas Zod, dominio, repositorios, rutas, seed ni migraciones de bloqueos.
- Agregar edición de bloqueos, bloqueos de sillón desde la UI, endpoints nuevos o dependencias.
- Agregar jsdom, un framework de frontend, un build step ni archivos nuevos a la lista estática permitida.
- Reintroducir reglas de negocio en el cliente: la validación local de `desde <= hasta` es solo una ayuda de entrada.

**Precedente revertido:** el no-goal «Alta/edición/borrado de bloqueos desde la UI (solo lectura)» de `openspec/changes/archive/2026-11-25-frontend-basico-profesional/design.md` queda explícitamente reversed para alta y borrado por este change. La edición de bloqueos permanece fuera de alcance.

## Decisions

- **Reutilizar `vistaBloqueos()` en lugar de crear una vista nueva**: la pestaña ya existe para los roles de gestión; se agrega el formulario encima de la tabla actual y se conserva la navegación. Alternativa descartada: una pantalla separada, que duplicaría permisos y cargas.
- **Selector con `GET /api/profesionales`, `opcionesSelect()` y `persona()`**: mantiene el mismo formato de opciones que "Nuevo turno" y evita un catálogo paralelo. `cargasPorVista("bloqueos")` pasa a `["catalogos", "bloqueos"]` para que el selector esté listo al navegar por pestañas, no solo al iniciar sesión. Alternativa descartada: consultar profesionales dentro de la vista de bloqueos con una request ad-hoc.
- **Utilidad pura para el rango de fechas**: una función nueva en `web/helpers.js`, testeable sin DOM, calcula el inicio del primer día y el fin del último con `rangoDelDia()`, y rechaza rangos invertidos o iguales. Alternativa descartada: calcular las fechas dentro del manejador del formulario, sin tests unitarios ni reutilización.
- **Conversión local con helpers existentes**: `hoyEnZona()` provee el valor por defecto de ambos inputs y `rangoDelDia()` hace la conversión de zona a UTC; la interfaz solo arma `{ profesionalId, inicio, fin, motivo }`. Alternativa descartada: usar el `Date` local del navegador, que varía según el equipo.
- **Eliminación con control de rol en la UI + autoridad del servidor**: el botón `data-accion` solo se renderiza para `administrador`; el `DELETE` sigue protegido por `SOLO_ADMINISTRADOR`. Alternativa descartada: mostrar el botón a todos y ocultar el error `403`, que daría una experiencia engañosa.
- **Ejemplo solo de presentación**: una fila o tarjeta señalizada como `Ejemplo`, armada con el primer profesional del catálogo y fechas demo fijas, se renderiza junto al estado vacío. Alternativa descartada: insertar un bloqueo de prueba en el seed, que rompería los tests que esperan la lista vacía.
- **Sin gate visual ni mockups**: se respeta la política `off` del proyecto; se usan exclusivamente clases CSS ya existentes, por lo que no cambia la lista permitida de `src/http/routes/frontend.ts`.

## Risks / Trade-offs

- [El ejemplo podría confundirse con un bloqueo real] → se etiqueta visiblemente como `Ejemplo`, se muestra de forma diferenciada y nunca se envía ni se persiste.
- [El catálogo puede no estar cargado al abrir la pestaña] → `cargasPorVista("bloqueos")` incluye `catalogos`; si no hay profesionales, el selector queda vacío y el ejemplo se omite en lugar de inventar un dato.
- [Validación local incompleta frente al servidor] → solo se chequea el orden de fechas; errores de intervalo, permisos o existencia se muestran mediante el traductor de errores existente.
- [Recarga manual tras mutaciones] → se vuelve a consultar la lista después de crear o eliminar; suficiente para la demo y consistente con el resto de la UI.
- [Sin DOM en tests unitarios] → el alcance de tests es `web/helpers.js`; el comportamiento del formulario se verifica en la fase de apply con la suite existente y revisión manual de la vista.

## Migration Plan

1. Verificar la línea base de tests (`npm test`: 403/403) antes de tocar archivos; cualquier fallo previo se documenta como preexistente.
2. En TDD, agregar tests RED para el helper de rango y las cargas de `bloqueos`, implementar GREEN, triangulate y refactorizar sin cambiar la API.
3. Extender `vistaBloqueos()` y los manejadores de eventos para alta y borrado, reutilizando `.form`/`.card`, `notificar()`, `opcionesSelect()` y `persona()`.
4. Verificar `npm test`, `npm run typecheck` y `npm run lint`; comprobar que el ejemplo aparece con lista vacía y que el botón de borrado solo existe para administración.
5. Rollback: revertir los cambios en `web/app.js`, `web/helpers.js` y `tests/unit/web/helpers.test.js`; la API y la persistencia quedan intactas.
