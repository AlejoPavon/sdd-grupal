# Tasks

## 1. Dominio `Bloqueo` y errores

- [x] 1.1 RED: crear `tests/unit/domain/bloqueo.test.ts` con casos de bloqueo válido de profesional, de sillón, de ambos, sin recurso, con `fin <= inicio` y con fechas inválidas; verificar que falla porque `src/domain/bloqueo/bloqueo.ts` y `bloqueo.errors.ts` no existen.
- [x] 1.2 GREEN: definir la entidad `Bloqueo` con intervalo semiabierto, `id` UUID, `creadoPor`, `createdAt` y validación de al menos un recurso, y los errores `BLOQUEO_INTERVALO_INVALIDO` y `BLOQUEO_RECURSO_REQUERIDO`; verificar que los tests del punto 1.1 pasan.
- [x] 1.3 TRIANGULATE: agregar casos de bloqueos contiguos, `motivo` vacío, fechas ISO con zona y solapamiento entre bloqueos (se permiten); verificar que solo los casos inválidos lanzan error.
- [x] 1.4 REFACTOR: reutilizar `Intervalo.seSuperponeCon` para la lógica temporal y documentar los códigos de error; verificar `npm run typecheck` y `npx vitest run tests/unit/domain/bloqueo.test.ts`.

## 2. Puerto y repositorio en memoria de bloqueos

- [x] 2.1 RED: escribir `tests/unit/infrastructure/in-memory-bloqueo-repository.test.ts` para `crear`, `buscarPorId`, `listarPorRango`, `buscarSolapadosPorProfesional`, `buscarSolapadosPorSillon` y `eliminar`, incluyendo intersección y contigüidad; verificar que falla por módulos inexistentes.
- [x] 2.2 GREEN: crear `src/application/ports/bloqueo-repository.ts` y `src/infrastructure/persistence/in-memory-bloqueo-repository.ts` con la interfaz y la implementación; verificar que los tests del punto 2.1 pasan.
- [x] 2.3 TRIANGULATE: agregar casos de rango sin límites, rango con un solo límite, bloqueo de otro profesional/sillón y eliminación seguida de búsqueda; verificar que las consultas devuelven solo los bloqueos que intersectan `[desde, hasta)`.
- [x] 2.4 REFACTOR: alinear el orden de resultados con el de los repositorios existentes; verificar `npm run typecheck` y `npx vitest run tests/unit/infrastructure/in-memory-bloqueo-repository.test.ts`.

## 3. Casos de uso de bloqueos

- [x] 3.1 RED: escribir `tests/unit/application/bloqueos/crear-bloqueo.test.ts`, `listar-bloqueos.test.ts` y `eliminar-bloqueo.test.ts` con recursos inexistentes/inactivos, rango inválido, id inexistente y creación correcta con `creadoPor` de sesión; verificar que fallan porque los casos de uso no existen.
- [x] 3.2 GREEN: implementar `CrearBloqueo`, `ListarBloqueos` y `EliminarBloqueo` reutilizando `PROFESIONAL_NO_ENCONTRADO`, `SILLON_NO_ENCONTRADO`, `RECURSO_INACTIVO` y agregando `BLOQUEO_NO_ENCONTRADO` y `RANGO_INVALIDO`; verificar que los tests del punto 3.1 pasan.
- [x] 3.3 TRIANGULATE: agregar casos de profesional y sillón juntos, rango con `desde >= hasta`, orden por `inicio` y doble eliminación; verificar que no se persiste nada cuando falla una validación.
- [x] 3.4 REFACTOR: extraer la validación de recursos a una función compartida con `CrearTurno` sin cambiar códigos de error; verificar `npm run typecheck` y `npx vitest run tests/unit/application/bloqueos`.

## 4. Capa HTTP de bloqueos

- [x] 4.1 RED: escribir `tests/integration/bloqueos.test.ts` con login real del helper `tests/helpers/auth.ts` (C-09) para `POST`/`GET`/`DELETE /api/bloqueos`, roles permitidos e insuficientes, campos inválidos, rango inválido, borrado inexistente y orden; verificar que falla porque la ruta no existe.
- [x] 4.2 GREEN: agregar `src/http/schemas/bloqueo.schema.ts`, `src/http/routes/bloqueos.ts` con `requireRole("administrador", "recepcionista")` para crear/consultar y `requireRole("administrador")` para eliminar, y mapear los errores nuevos en `error-handler.ts`; verificar que los tests del punto 4.1 pasan.
- [x] 4.3 TRIANGULATE: agregar casos de request sin sesión, UUID inválido, fecha inválida, `motivo` faltante y `GET` sin filtros; verificar el shape `{ code, message, details }` y los códigos `VALIDACION_FALLIDA`/`RANGO_INVALIDO`.
- [x] 4.4 REFACTOR y cableado: agregar `bloqueos` a `Repositorios`, `buildServer` y `main.ts`, actualizar las fixtures de todos los tests que construyen repositorios y verificar `npm test` y `npm run typecheck` sin regresiones.

## 5. `CrearTurno` con bloqueos, precedencia y `forzar`

- [x] 5.1 RED: ampliar `tests/unit/application/crear-turno.test.ts` con bloqueo de profesional, de sillón, de ambos, contigüidad, precedencia (recursos → solapamiento prof → solapamiento sillón → bloqueo prof → bloqueo sillón), `forzar` con/sin conflicto y `autorizadoPor`; verificar que falla porque `CrearTurno` no conoce bloqueos.
- [x] 5.2 GREEN: agregar `forzar?`/`autorizadoPor?` a `CrearTurnoInput`, crear `TurnoBloqueadoError` (`409`, `details.bloqueo`) y evaluar los bloqueos en el orden definido antes de persistir; verificar que los tests del punto 5.1 pasan.
- [x] 5.3 TRIANGULATE: agregar casos de bloqueo de otro profesional/sillón, superposición mínima de 1 minuto, turno que empieza al terminar el bloqueo y doble bloqueo con precedencia del profesional; verificar que se persiste `autorizadoPor` solo cuando `forzar` evitó un bloqueo.
- [x] 5.4 RED (HTTP): ampliar `tests/integration/turnos.test.ts` con `forzar: true` por Recepcionista y Profesional (`403 SIN_PERMISO`), por Administrador (`201` + `autorizadoPor`), turno bloqueado (`409 TURNO_BLOQUEADO` con `details.bloqueo`) y recreación tras eliminar el bloqueo; verificar que falla.
- [x] 5.5 GREEN: extender `crearTurnoSchema` con `forzar: boolean().optional()`, resolver el id de la sesión en la ruta y rechazar `forzar` de no-administrador antes de invocar al caso de uso; verificar que los tests del punto 5.4 pasan.
- [x] 5.6 REFACTOR: centralizar la precedencia en un único punto de `CrearTurno`, conservando los tests de solapamiento de C-03; verificar `npm run typecheck` y `npx vitest run tests/unit/application/crear-turno.test.ts tests/integration/turnos.test.ts`.

## 6. Verificación final

- [x] 6.1 Verificar la matriz completa de scenarios de los deltas `bloqueos` y `turnos` contra `openspec show bloqueos-agenda --json`, marcando cada scenario como cubierto por un test o por una observación HTTP; verificar el listado resultante.
- [x] 6.2 Confirmar que los tests existentes de C-09 siguen en verde con la nueva fixture `Repositorios` y que no se modificó la allowlist de autenticación; verificar `npx vitest run tests/integration/auth.test.ts`.
- [x] 6.3 Ejecutar `npm run typecheck && npm test && npm run lint` desde la raíz del repo y verificar que los tres comandos terminan con código 0.
- [x] 6.4 Confirmar que este change no incluye código de C-08 (`esSobreturno` sigue con el valor por defecto que fija C-03) y que la rama sigue siendo `feat/c-09-c-07-c-08-seguridad-agenda`; verificar con `git status --short`.

## Workflow follow-up

- Registrar el resultado en `CHANGES.md` y completar la revisión del change antes de archivear.
- Archivear el change con el workflow del proyecto una vez satisfechas las revisiones; recién entonces aplicar C-08 `sobreturnos` en esta misma rama.
