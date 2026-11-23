# Design

## Context

El dominio ya define `EstadoTurno`, `puedeTransicionarA`, `ocupaAgenda`, `TransicionInvalidaError` y el puerto `TurnoRepository` con `buscarPorId`/`actualizar` (C-02, C-03). El servidor Fastify ya expone las rutas de turnos y el error handler centralizado. No hay autenticación aún (C-09), por lo que la cancelación no registra un actor específico. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Exponer `PATCH /api/turnos/:id/cancelar` sin body.
- Implementar `CancelarTurno` reutilizando entidades, errores y repositorios existentes.
- Garantizar idempotencia (RN-EX-03) y liberación de agenda (RN-AG-07).
- Cubrir los escenarios de la spec con tests unitarios e integración.

**Non-Goals:**
- No se implementa autenticación/autorización del actor (C-09).
- No se persiste en base de datos (C-10).
- No se incluyen motivos de cancelación ni notificaciones (etapas posteriores).

## UI Mockups

Decision: no (project policy)

## Decisions

- **Caso de uso en capa de aplicación.** `CancelarTurno` recibe el repositorio de turnos (o el agregado `Repositorios`) y orquesta búsqueda, validación de transición, actualización y persistencia. Alternativa: lógica en el handler HTTP; se descarta para mantener el dominio aislado y testeable sin servidor.

- **Validación de transición con `puedeTransicionarA`.** Se reutiliza la función de dominio para decidir si `pendiente|confirmado → cancelado` es válido; cualquier otro estado (`atendido`, `ausente`, `cancelado`) se maneja por separado. Para `cancelado` se aplica idempotencia; para `atendido`/`ausente` se lanza `TransicionInvalidaError`. Alternativa: comparar estados con `if`; se descarta por duplicar la tabla de transiciones del dominio.

- **Idempotencia sin persistir.** Si el turno ya está `cancelado`, se devuelve tal cual sin llamar a `actualizar`, de modo que `cancelledAt` y `updatedAt` no cambian. Alternativa: persistir de nuevo; se descarta porque "sin cambios" implica no tocar el registro y evita falsos positivos en auditoría.

- **Registro de `cancelledAt` y `updatedAt` solo en la transición real.** Ambos timestamps se setean al momento de cancelar. Alternativa: solo `cancelledAt`; se descarta porque RN-TU-02 exige trazabilidad de actualización.

- **Mapeo de `TransicionInvalidaError` → 409.** Se agrega una rama en `error-handler.ts` (instancia) devolviendo `code: TRANSICION_INVALIDA`. Alternativa: mapear por código genérico en `DominioError`; se descarta para mantener el status HTTP explícito y consistente con `TurnoSolapadoError`.

- **Endpoint sin body.** El handler ignora el body y usa solo el `id` del path; no se define schema Zod de entrada. Alternativa: schema vacío; se descarta por simplicidad y porque no hay datos que validar.

- **`createdBy`/actor no se modifica.** La cancelación no registra un usuario cancelador en v0.1; al incorporar auth (C-09) se puede extender `CancelarTurno` con un parámetro `canceladoPor` sin romper la firma actual si se hace opcional. Riesgo aceptado y documentado.

## Risks / Trade-offs

- [Sin autenticación] no se registra quién cancela el turno → se resuelve en C-09 extendiendo el caso de uso con parámetro opcional.
- [Concurrencia] la validación de transición no es atómica entre request y persistencia en memoria → aceptable en v0.1; C-10 introduce transacción/índices.
- [Idempotencia] "sin cambios" se implementa no persistiendo; si el repositorio tuviera efectos secundarios (índices), habría que revisar. En memoria no hay efectos secundarios.
- [Zona horaria] no aplica; la cancelación no maneja fechas.

## Migration Plan

No aplica migración de datos (persistencia en memoria). El cambio se integra en la rama `feat/c-05-turno-cancellation` y se fusiona vía Pull Request tras pasar `npm run typecheck` y `npm test`.

## Open Questions

- (ninguna)