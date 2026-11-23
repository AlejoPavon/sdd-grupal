# Tasks

## 1. Dominio

- [x] 1.1 Agregar `RangoInvalidoError` (code `RANGO_INVALIDO`) en `src/domain/turno/turno.errors.ts` extendiendo `DominioError` y verificar `npm run typecheck`

## 2. Casos de uso de turnos

- [x] 2.1 Crear `src/application/turnos/listar-turnos.ts` con `ListarTurnos` (validación de rango, estados por defecto `pendiente`/`confirmado`, orden por `inicio`, enriquecimiento con paciente y prestación) y verificar `npm run typecheck`
- [x] 2.2 Agregar `ObtenerTurno` en el mismo archivo (lanza `TURNO_NO_ENCONTRADO` si no existe) y verificar `npm run typecheck`
- [x] 2.3 Escribir tests unitarios en `tests/unit/application/listar-turnos.test.ts` (rango inválido `RANGO_INVALIDO`, filtros combinados, orden, exclusión de cancelados, enriquecimiento) y verificar `npm test`

## 3. Casos de uso de catálogos

- [x] 3.1 Crear `src/application/catalogos/listar-catalogos.ts` con `ListarProfesionales`, `ListarSillones` y `ListarPrestaciones` y verificar `npm run typecheck`
- [x] 3.2 Escribir tests unitarios en `tests/unit/application/catalogos.test.ts` (listado no vacío para cada catálogo) y verificar `npm test`

## 4. Capa HTTP

- [x] 4.1 Agregar `turnoQuerySchema` en `src/http/schemas/turno.ts` (`desde`, `hasta`, `profesionalId`, `sillonId` opcionales) y verificar `npm run typecheck`
- [x] 4.2 Actualizar `src/http/routes/turnos.ts` con `GET /api/turnos` y `GET /api/turnos/:id` (mapeo de query a filtros, conversión de fechas, enriquecimiento) y verificar `npm run typecheck`
- [x] 4.3 Crear `src/http/routes/catalogos.ts` con `GET /api/profesionales`, `GET /api/sillones` y `GET /api/prestaciones`, registrarlo en `src/http/server.ts`, y verificar `npm run typecheck` y `npm test`

## 5. Integración HTTP

- [x] 5.1 Escribir tests de integración en `tests/integration/turnos.test.ts` (GET list: filtros combinados, rango inválido `400 RANGO_INVALIDO`, orden, exclusión de cancelados, enriquecimiento; GET by id: existente `200`, inexistente `404 TURNO_NO_ENCONTRADO`) y verificar `npm test`
- [x] 5.2 Escribir tests de integración en `tests/integration/catalogos.test.ts` (los tres endpoints responden `200` con arreglos no vacíos) y verificar `npm test`

## 6. Verificación final

- [x] 6.1 Ejecutar `npm run typecheck` y `npm test` completos y verificar que pasan sin regresiones

## Workflow follow-up

- Archivar el change tras pasar la revisión del proyecto.