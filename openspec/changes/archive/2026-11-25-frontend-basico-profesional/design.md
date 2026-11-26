# Design

## Context

La API Fastify ya expone autenticación, catálogos, pacientes, turnos y bloqueos con validación Zod y reglas en el dominio. No hay cliente web ni dependencias de frontend, y la política de diseño visual del proyecto está en `off`. La interfaz debe consumir la API tal cual está, sin agregar reglas de negocio ni cambiar contratos.

## UI Mockups

- Decision: no (project policy), 2026-11-25.
- Motivo: `visual_design` en `off` y sin carpeta `design-system/`; no hay gate de sistema visual ni de mockups para este change.

## Goals / Non-Goals

**Goals:**

- Servir la SPA desde el mismo proceso Fastify sin dependencias nuevas.
- Mantener todas las reglas de negocio en el servidor; el cliente solo orquesta requests y presenta resultados.
- Presentar fechas en la zona del consultorio y enviarlas en ISO 8601 UTC.
- Cubrir las vistas y estados descritos en `specs/interfaz-web/spec.md` con tests ejecutables.

**Non-Goals:**

- Alta, edición o borrado de bloqueos desde la UI (solo lectura).
- Sobreturnos, excepción `forzar` y nuevas operaciones de API.
- Build step, frameworks, gestor de estado ni store externo.

## Decisions

- **SPA vanilla ESM en `web/`**: el proyecto es Node/ESM y la UI es acotada; módulos nativos evitan un pipeline de build. Alternativa descartada: framework con bundler (agregaría dependencias y configuración sin beneficio para este alcance).
- **Lista explícita de archivos estáticos en `src/http/routes/frontend.ts`**: se sirven solo cinco rutas conocidas con `Content-Type` correcto. Alternativa descartada: `@fastify/static` con directorio completo, que podría exponer archivos del repo.
- **Estado en un objeto único en memoria y render por plantillas string**: suficiente para una sesión de escritorio; el DOM se escapa con una utilidad dedicada antes de interpolar datos. Alternativa descartada: librería reactiva externa.
- **Fechas puras en `web/helpers.js`**: `Intl.DateTimeFormat` con `America/Argentina/Buenos_Aires` para mostrar y cálculo del offset de zona para convertir `datetime-local` a UTC; se prueban con cases fijos. Alternativa descartada: depender del `Date` local del navegador, que variaría por equipo.
- **Traducción centralizada de errores**: un mapa de códigos y estados a mensajes de usuario, con el intervalo de `details.turnoEnConflicto` cuando existe. Alternativa descartada: mostrar el cuerpo JSON crudo.
- **Permisos en la UI por rol**: se ocultan las acciones de gestión y la sección de bloqueos para `profesional`; la autoridad real sigue siendo el `preHandler` de Fastify.
- **Tokens visuales locales en `styles.css`**: colores, radios, sombras, foco visible y `prefers-reduced-motion` en un solo archivo, sin servicio remoto ni fuente externa.

## Risks / Trade-offs

- [La UI no recarga automáticamente datos de otros usuarios] → se recarga la vista tras cada mutación; suficiente para la demo.
- [El chequeo de sesión al arrancar produce un `401` esperado en consola si no hay cookie] → la interfaz lo intercepta y muestra el acceso; se documenta como respuesta normal de la API.
- [Render por plantillas string puede insertar datos no confiables] → todo dato dinámico pasa por `escapar()`.
- [Sin persistencia de filtros entre vistas] → se recarga el listado completo de pacientes al abrir "Nuevo turno", cubierto por test.
- [Sin build step] → el navegador cargará los archivos exactamente como están en `web/`; se sirven con tipos MIME explícitos.

## Migration Plan

1. Agregar las rutas estáticas al servidor y verificar que `/health` y la protección `/api/*` siguen intactos.
2. Publicar `web/` y ejecutar la suite con el servidor en memoria y en SQLite.
3. Verificar el flujo completo en navegador a 390x844 y 1440x900; guardar capturas como evidencia local.
4. Rollback: retirar el registro de rutas estáticas y el directorio `web/`; la API queda sin cambios.
