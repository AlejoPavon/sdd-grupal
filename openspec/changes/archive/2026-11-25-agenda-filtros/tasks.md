# Tasks

## 1. Puerto y persistencia

- [x] 1.1 Agregar `pacienteId?: string` a `FiltrosTurno` en `src/application/ports/turno-repository.ts` y verificar `npm run typecheck`
- [x] 1.2 Aplicar el filtro `pacienteId` en `InMemoryTurnoRepository.listar` y verificar `npm run typecheck`
- [x] 1.3 Aplicar el filtro `pacienteId` en `SqliteTurnoRepository.listar` y verificar `npm run typecheck`

## 2. Caso de uso

- [x] 2.1 Agregar `pacienteId` a `ListarTurnosFiltros`, quitarlo del armado posicional y pasarlo al repositorio; eliminar `estados: ["pendiente", "confirmado"]` y verificar `npm run typecheck`
- [x] 2.2 Escribir/actualizar tests unitarios en `tests/unit/application/listar-turnos.test.ts` (filtro por paciente, lista general incluye cancelados, orden por inicio) y verificar `npm test`

## 3. Capa HTTP

- [x] 3.1 Agregar `pacienteId: z.uuid().optional()` a `turnoQuerySchema` y verificar `npm run typecheck`
- [x] 3.2 Pasar `pacienteId` desde `GET /api/turnos` a `ListarTurnos` y verificar `npm run typecheck`
- [x] 3.3 Actualizar `tests/integration/turnos.test.ts`: reemplazar "excluye turnos cancelados" por "incluye turnos de todos los estados", agregar filtro por paciente y verificar `npm test`
- [x] 3.4 Agregar caso de filtro por paciente en `tests/integration/sqlite-turno.test.ts` y verificar `npm test`

## 4. Cliente web

- [x] 4.1 Filtrar en `cargarAgenda` (`web/app.js`) los estados `pendiente`/`confirmado` para conservar la vista actual y verificar `npm test`

## 5. Verificación final

- [x] 5.1 Ejecutar `npm run typecheck`, `npm run lint` y `npm test` completos sin regresiones
- [x] 5.2 Ejecutar `openspec validate agenda-filtros --strict`

## Workflow follow-up

- Archivar el change tras la aprobación del proyecto y sincronizar la spec `turnos`.
