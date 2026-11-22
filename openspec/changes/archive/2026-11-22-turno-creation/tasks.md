# Tasks

## 1. Caso de uso CrearTurno

- [x] 1.1 Crear `src/application/ports/repositorios.ts` con la interfaz agregada `Repositorios` y verificar `npm run typecheck`
- [x] 1.2 Crear `src/application/crear-turno.ts` con `CrearTurno` (validación de existencia/actividad, cálculo de `fin`, solapamiento por profesional y sillón, persistencia en `pendiente` con trazabilidad) y verificar `npm run typecheck`
- [x] 1.3 Escribir tests unitarios en `tests/unit/application/crear-turno.test.ts` (feliz, solapamiento por profesional, solapamiento por sillón, contiguo, recurso inactivo, recurso inexistente) y verificar `npm test`

## 2. Capa HTTP

- [x] 2.1 Crear `src/http/schemas/turno.ts` con schema Zod (`pacienteId`, `profesionalId`, `sillonId`, `prestacionId`, `inicio`) y verificar `npm run typecheck`
- [x] 2.2 Crear `src/http/error-handler.ts` con mapeo centralizado de `ZodError` y `DominioError` al shape `{ code, message, details }` y verificar `npm run typecheck`
- [x] 2.3 Crear `src/http/routes/turnos.ts` con `POST /api/turnos` (conversión de `inicio` a `Date`, `createdBy` demo) y verificar `npm run typecheck`
- [x] 2.4 Actualizar `src/http/server.ts` para aceptar repositorios opcionales, registrar rutas y error handler, y actualizar `src/main.ts` para crear repositorios, ejecutar seed y construir el servidor; verificar `npm run typecheck` y `npm test`

## 3. Integración HTTP

- [x] 3.1 Escribir tests de integración en `tests/integration/turnos.test.ts` (feliz `201`, solapamiento profesional `409`, solapamiento sillón `409`, contiguo, recurso inactivo `409`, recurso inexistente `404`, validación `400`) y verificar `npm test`
- [x] 3.2 Ejecutar `npm run typecheck` y `npm test` completos y verificar que pasan sin regresiones