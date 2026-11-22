# Design

## Context

El dominio y los repositorios en memoria ya existen (C-02). El servidor Fastify actual solo expone `/health`. No hay autenticación aún (C-09 posterior), por lo que `createdBy` se resuelve con un usuario demo hasta que se incorpore auth. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Implementar el caso de uso `CrearTurno` reutilizando entidades, errores y repositorios existentes.
- Exponer `POST /api/turnos` con validación Zod y mapeo centralizado de errores.
- Cubrir los escenarios de la spec con tests unitarios (caso de uso) y de integración (HTTP).

**Non-Goals:**
- No se implementa autenticación/autorización (C-09).
- No se persiste en base de datos (C-10).
- No se incluyen bloqueos ni sobreturnos (C-07, C-08).

## UI Mockups

Decision: no (no UI)

## Decisions

- **Caso de uso en capa de aplicación.** `CrearTurno` recibe un agregado de repositorios y orquesta carga, validación de existencia/actividad, cálculo de `fin`, validación de solapamiento y persistencia. Alternativa: poner la lógica en el handler HTTP; se descarta para mantener el dominio aislado y testeable sin servidor.

- **Validación de entrada con Zod en el borde.** El schema valida UUIDs e ISO 8601; el handler convierte `inicio` a `Date` antes de invocar el caso de uso. Alternativa: Fastify JSON Schema; se descarta por consistencia con el stack (Zod) y por mensajes por campo.

- **Orden de validación de solapamiento: profesional primero.** Si ambos recursos solapan, se responde `TURNO_SOLAPADO_PROFESIONAL`. Alternativa: evaluar ambos y devolver el primero por fecha; se descarta por simplicidad y predictibilidad.

- **Mapeo centralizado de errores.** `error-handler.ts` registra `setErrorHandler` y traduce `DominioError` (por código/instancia) y `ZodError` al shape `{ code, message, details }`. Alternativa: try/catch en cada ruta; se descarta para evitar duplicación.

- **Generación de identificadores.** El caso de uso genera el `id` con `randomUUID()` de `node:crypto` y los timestamps con `new Date()`. Alternativa: repositorio genera el id; se descarta porque el dominio ya define el turno completo.

- **Inyección de repositorios.** `buildServer(repos?)` acepta un agregado opcional; si no se provee, crea repositorios en memoria sin seed (útil para tests de health). `main.ts` crea los repositorios, ejecuta `cargarSeed` y luego construye el servidor. Alternativa: singleton global; se descarta por testabilidad.

- **`createdBy` hasta C-09.** El handler usa un id de usuario demo (`SEED_IDS.recepcion`) por defecto. El caso de uso recibe `creadoPor` como parámetro, por lo que al incorporar auth solo cambia el handler. Riesgo aceptado y documentado.

## Risks / Trade-offs

- [Sin autenticación] `createdBy` es un valor demo fijo → se reemplaza en C-09 sin tocar el caso de uso.
- [Concurrencia] la validación de solapamiento no es atómica entre request y persistencia en memoria → aceptable en v0.1; C-10 introduce transacción/índices.
- [Zona horaria] `inicio` se interpreta como UTC por el schema; la presentación local queda para el cliente.
- [Tests de integración] requieren seed manual en el test; documentado en tasks.

## Migration Plan

No aplica migración de datos (persistencia en memoria). El cambio se integra en la rama `feat/c-03-turno-creation` y se fusiona vía PR tras pasar `npm run typecheck` y `npm test`.

## Open Questions

- (ninguna)