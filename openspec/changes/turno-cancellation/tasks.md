# Tasks

## 1. Caso de uso CancelarTurno

- [x] 1.1 Crear `src/application/cancelar-turno.ts` con `CancelarTurno` (búsqueda por id, validación de transición con `puedeTransicionarA`, idempotencia sin persistir, seteo de `cancelledAt`/`updatedAt`, persistencia) y verificar `npm run typecheck`
- [x] 1.2 Escribir tests unitarios en `tests/unit/application/cancelar-turno.test.ts` (cancelación feliz desde `pendiente` y `confirmado`, idempotencia, turno `atendido`/`ausente`, turno inexistente) y verificar `npm test`

## 2. Capa HTTP

- [x] 2.1 Agregar handler `PATCH /api/turnos/:id/cancelar` en `src/http/routes/turnos.ts` (sin body, usa `id` del path) y verificar `npm run typecheck`
- [x] 2.2 Mapear `TransicionInvalidaError` a `409` en `src/http/error-handler.ts` y verificar `npm run typecheck`

## 3. Integración HTTP

- [ ] 3.1 Ampliar `tests/integration/turnos.test.ts` con casos de cancelación: feliz `200` con `cancelledAt`, doble cancelación idempotente, turno `atendido` → `409 TRANSICION_INVALIDA`, turno inexistente → `404`, recreación en el mismo horario tras cancelar, y verificar `npm test`
- [ ] 3.2 Ejecutar `npm run typecheck` y `npm test` completos y verificar que pasan sin regresiones