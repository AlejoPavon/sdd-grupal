# Design

## Context

C-04 implementó `GET /api/turnos` con `ListarTurnos`, que valida el rango, fuerza `estados: ["pendiente", "confirmado"]` y enriquece cada turno con paciente y prestación. `InMemoryTurnoRepository.listar` y `SqliteTurnoRepository.listar` ya soportan rango, profesional, sillón y estados, y ordenan por `inicio` ascendente. El filtro por paciente no existe en ninguna capa. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Agregar el filtro `pacienteId` a la consulta de agenda.
- Devolver todos los turnos registrados por defecto, ordenados por `inicio` ascendente.
- Mantener el comportamiento de la agenda del día en el cliente web.

**Non-Goals:**
- No se agrega paginación.
- No se agrega un filtro HTTP por estado (no fue pedido; el repositorio sigue aceptando `estados`).
- No se modifican reglas de creación, cancelación ni autenticación.

## UI Mockups

Decision: no (no UI nueva; solo se preserva la vista existente)

## Decisions

- **Filtro en el repositorio.** `pacienteId` se agrega a `FiltrosTurno` y se aplica en `InMemoryTurnoRepository.listar` y `SqliteTurnoRepository.listar`, junto a los filtros existentes. Alternativa: filtrar en `ListarTurnos`; se descarta para no duplicar lógica y mantener el orden en el repositorio.

- **Sin estados forzados.** `ListarTurnos` deja de pasar `estados: ["pendiente", "confirmado"]`; el repositorio devuelve todos los estados cuando no recibe `estados`. Alternativa: exponer un query param `estado`; se descarta por fuera de alcance. `FiltrosTurno.estados` se conserva para consumidores internos futuros.

- **Schema Zod.** `turnoQuerySchema` agrega `pacienteId: z.uuid().optional()`, igual que `profesionalId` y `sillonId`. El handler lo pasa a `ListarTurnosFiltros`.

- **Scoping de profesional.** No cambia: un usuario `profesional` sigue limitado a sus propios turnos y puede combinar ese scoping con `pacienteId`.

- **Agenda web.** `cargarAgenda` filtra en el cliente los turnos `pendiente`/`confirmado` antes de renderizar, para conservar la vista "Turnos del día" tal como estaba. Alternativa: mostrar todos los estados; se descarta porque cambia la UI sin pedido explícito.

- **Enriquecimiento.** Sin cambios: se sigue resolviendo paciente y prestación por id para cada turno.

## Risks / Trade-offs

- [Respuesta sin rango] → Puede devolver todos los turnos; aceptable con el seed actual. Si crece, C-10/paginación lo resuelve.
- [Filtro de estado solo en cliente] → Otros consumidores que quieran solo activos deben filtrar la respuesta. Se puede agregar `estado` al query más adelante sin romper el contrato actual.
- [Enriquecimiento N+1] → Igual que C-04; aceptable en v0.1.

## Migration Plan

No aplica migración de datos. El cambio se integra en una rama `feat/agenda-filtros` y se fusiona vía PR tras `npm run typecheck`, `npm run lint` y `npm test`.

## Open Questions

- (ninguna)
