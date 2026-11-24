# Proposal

## Why

Los repositorios en memoria pierden todos los datos al reiniciar el servidor. C-10 agrega un adaptador SQLite detrás de los mismos puertos para persistir usuarios (con hash de contraseña), profesionales, sillones, prestaciones, pacientes, turnos y bloqueos, sin tocar el dominio ni los tests existentes. Las sesiones quedan en memoria.

## Justificación de la elección del change

- Está asignado en CHANGES.md como C-10 y sus dependencias (C-03, C-05 y C-06) ya están integradas en `main`. El plan del equipo esperó además a C-09 porque la persistencia incluye usuarios.
- Es la continuación natural de los changes de agenda: conserva los turnos, pacientes, bloqueos y sobreturnos tras reiniciar el servidor, y permite verificarlo con una demo concreta.
- Tiene reglas verificables que se expresan como escenarios y se prueban con tests: paridad de comportamiento con los repositorios en memoria, doble reserva rechazada con dos conexiones al mismo archivo, seed idempotente y migraciones repetibles.
- Es una sola funcionalidad acotada: no cambia los puertos ni las entidades, y los tests existentes siguen corriendo en memoria.

## Decisión técnica

Se mantiene `better-sqlite3` con `engines.node >=20` para no romper la promesa de Node 20 LTS. `node:sqlite` solo está disponible en Node 22 o superior y obligaría a subir la versión mínima del proyecto. Las sesiones quedan en memoria por ser efímeras.

## What Changes

- Nuevo adaptador SQLite en `src/infrastructure/persistence/sqlite/` (conexión, migraciones y un repositorio por entidad).
- Migraciones SQL versionadas en `migrations/`, con índices de agenda y índices únicos parciales para email y documento de pacientes activos.
- Nuevo `src/infrastructure/persistence/create-repos.ts`, que elige el adaptador según `PERSISTENCE=memory|sqlite` (default `memory`) y `DATABASE_URL` (default `file:./data/turnos.db`), y carga el seed solo si la base está vacía.
- `src/main.ts` delega en `createRepos()` y `seedIfNeeded()`.
- `.env.example` con `PERSISTENCE` y `DATABASE_URL`; `.gitignore` con `data/`, `*.db`, `*.db-wal` y `*.db-shm`.
- Nueva capability `persistencia` con escenarios de paridad.

## Capabilities

### New Capabilities

- `persistencia`: persistencia de usuarios, profesionales, sillones, prestaciones, pacientes, turnos y bloqueos en SQLite con paridad de reglas respecto a memoria.

### Modified Capabilities

- (ninguna; los puertos no cambian)

## Impact

- Código nuevo: `src/infrastructure/persistence/sqlite/*`, `src/infrastructure/persistence/create-repos.ts`, `migrations/*`.
- Código de otros que se toca: `src/main.ts`, `package.json` y `package-lock.json` (dependencias `better-sqlite3` y `@types/better-sqlite3`), `.env.example`, `.gitignore` y `CHANGES.md` (solo la línea de C-10).
- Tests: nuevos tests de SQLite; la suite existente sigue corriendo en memoria.
- Limitaciones: los bloqueos no entran en la transacción de crear turno, las sesiones no persisten entre reinicios y la tabla `sucursal` queda sin repositorio (reservada para C-18).