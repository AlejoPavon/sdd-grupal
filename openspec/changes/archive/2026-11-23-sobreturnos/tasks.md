# Tasks

## 1. Contrato HTTP del flag `esSobreturno`

- [x] 1.1 RED: agregar `tests/unit/http/crear-turno-schema.test.ts` con casos de `esSobreturno` ausente, `true`, `false`, `null`, string y número; verificar que falla porque el schema no acepta el campo.
- [x] 1.2 GREEN: agregar `esSobreturno: z.boolean().optional()` a `crearTurnoSchema` en `src/http/schemas/turno.ts`; verificar que los tests del punto 1.1 pasan y que un valor inválido produce un error Zod con la ruta del campo.
- [x] 1.3 TRIANGULATE: agregar casos de body con todos los campos obligatorios más el flag, y de body sin el flag que conserva el tipo `CrearTurnoBody` existente; verificar `npx vitest run tests/unit/http/crear-turno-schema.test.ts`.
- [x] 1.4 REFACTOR: documentar en el schema que el flag es opcional y que `false`/ausente mantienen el comportamiento de C-07; verificar `npm run typecheck` y `npm run lint`.

## 2. `CrearTurno`: omisiones del profesional y auditoría

- [x] 2.1 RED: ampliar `tests/unit/application/crear-turno.test.ts` con un turno solapado del profesional creado con `esSobreturno: true` y `autorizadoPor` del id de sesión, y con un bloqueo del profesional en el mismo horario; verificar que fallan con `TURNO_SOLAPADO_PROFESIONAL` y `TURNO_BLOQUEADO`.
- [x] 2.2 GREEN: agregar `esSobreturno?: boolean` a `CrearTurnoInput`, persistir el flag recibido (default `false`) y omitir la búsqueda de solapamiento y de bloqueo del profesional cuando es `true`, asignando `autorizadoPor` desde el parámetro de sesión; verificar que los tests del punto 2.1 pasan.
- [x] 2.3 TRIANGULATE: agregar casos de flag `false` con solapamiento profesional (sigue rechazando), de bloqueo de otro profesional (no afecta) y de sobreturno sin conflicto (no persiste turnos duplicados); verificar que `npx vitest run tests/unit/application/crear-turno.test.ts` pasa completo.
- [x] 2.4 REFACTOR: extraer la decisión de omisión a una función pura local de `CrearTurno` reutilizable con `forzar`; verificar `npm run typecheck` y que las reglas de C-03 siguen intactas para turnos normales.

## 3. Límites del sillón e interacción con `forzar`

- [x] 3.1 RED: agregar tests unitarios con turno activo del sillón y `esSobreturno: true`, con bloqueo del sillón y el flag, con ambas flags y sillón solapado, y con un profesional intentando `forzar: true`; verificar que fallan o no cubren aún la precedencia correcta.
- [x] 3.2 GREEN: ajustar `CrearTurno` para evaluar solapamiento y bloqueo del sillón antes que los del profesional y para mantener el rechazo de `forzar` sin rol; verificar que los casos del punto 3.1 responden `TURNO_SOLAPADO_SILLON`, `TURNO_BLOQUEADO` y `SIN_PERMISO` según corresponda.
- [x] 3.3 TRIANGULATE: agregar casos de contigüidad con turno/bloqueo de sillón, de superposición mínima de 1 minuto y de `esSobreturno: true` con `forzar: true` sobre un bloqueo de sillón sin turno solapado; verificar que el único bloqueo omitido en ese último caso es el del sillón vía `forzar`.
- [x] 3.4 REFACTOR: dejar un único orden de validaciones documentado en `CrearTurno` y verificar que los tests de precedencia de C-07 (`bloqueos-agenda`) siguen pasando con `npx vitest run tests/unit/application/crear-turno.test.ts`.

## 4. Integración HTTP y autorización

- [x] 4.1 RED: ampliar `tests/integration/turnos.test.ts` con login real del helper `tests/helpers/auth.ts` para: administrador y recepcionista creando sobreturnos (`201`, flag y `autorizadoPor`), profesional con `esSobreturno: true` (`403 SIN_PERMISO` sin persistencia), flag inválido (`400 VALIDACION_FALLIDA`), sillón solapado (`409 TURNO_SOLAPADO_SILLON`) y bloqueo de sillón (`409 TURNO_BLOQUEADO`); verificar que fallan.
- [x] 4.2 GREEN: pasar `body.esSobreturno` y `usuarioAutenticado(request).id` desde `src/http/routes/turnos.ts` al caso de uso, apoyándose en el `requireRole("administrador", "recepcionista")` ya instalado por C-09; verificar que los tests del punto 4.1 pasan y que ningún request del helper necesita bypass de autenticación.
- [x] 4.3 TRIANGULATE: agregar casos de sobreturno con `forzar` por administrador, de `forzar` por recepcionista (`403`), de `autorizadoPor` no provisto en el body y de consulta posterior en `GET /api/turnos` donde el sobreturno aparece como turno activo; verificar los códigos y el shape `{ code, message, details }`.
- [x] 4.4 REFACTOR y fixtures: actualizar las fixtures de `Repositorios` (bloqueos y sesiones de C-07/C-09) usadas por los tests de integración y verificar `npx vitest run tests/integration/turnos.test.ts` y `npm run typecheck`.

## 5. Regresión y verificación final

- [x] 5.1 Actualizar los tests existentes que asumen `esSobreturno: false` o construyen `CrearTurnoInput` directamente (`tests/unit/application/crear-turno.test.ts`, `tests/integration/turnos.test.ts` y cualquier fixture de C-07/C-09); verificar `npm test` sin fallos de regresión.
- [x] 5.2 Verificar la matriz completa de scenarios del delta `turnos` contra `openspec show sobreturnos --json`, marcando cada scenario como cubierto por un test unitario, un test HTTP o una observación documentada; verificar el listado resultante.
- [x] 5.3 Confirmar que no se modificaron los deltas de C-09 ni de C-07 y que la rama sigue siendo `feat/c-09-c-07-c-08-seguridad-agenda`; verificar con `git status --short` y `git branch --show-current`.
- [x] 5.4 Ejecutar `npm run typecheck && npm test && npm run lint` desde la raíz del repo y verificar que los tres comandos terminan con código 0.
- [x] 5.5 Verificar de forma observable con `app.inject` que una request sin `esSobreturno` sigue rechazando solapamiento profesional y bloqueo profesional, sin `autorizadoPor`; verificar el test de regresión correspondiente en verde.

## Workflow follow-up

- Registrar el resultado en `CHANGES.md` y completar la revisión del change antes de archivear.
- Archivear el change con el workflow del proyecto una vez satisfechas las revisiones; el orden de archive en esta rama es C-09 → C-07 → C-08.
