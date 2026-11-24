# Proposal

## Why

Los repositorios en memoria pierden todos los datos al reiniciar el servidor; C-10 agrega un adaptador SQLite detrás de los mismos puertos para persistir usuarios (con hash de contraseña), profesionales, sillones, prestaciones, pacientes, turnos y bloqueos sin tocar el dominio ni los tests existentes. Las sesiones quedan en memoria.

## Justificación de la elección del change

- Asignado en CHANGES.md como C-10, con dependencias C-03, C-05 y C-06 ya integradas 
- Conserva las reglas de agenda tras reiniciar el servidor.
- Una sola funcionalidad acotada y verificable.

## Decisión técnica

Se mantiene `better-sqlite3` con `engines.node >=20` para no romper la promesa de Node 20 LTS; `node:sqlite` solo está disponible en Node 22+ y obligaría a subir la versión mínima. Las sesiones quedan en memoria por ser efímeras y no requerir persistencia.

## What Changes

- Nuevo adaptador SQLite en `src/infrastructure/persistence/sqlite/` (conexión, migraciones, repositorios).
- Migraciones SQL versionadas en `migrations/`.
- Configuración `PERSISTENCE=memory|sqlite` (default `memory`) y `DATABASE_URL` (`.env.example`).
- Seed idempotente que solo corre con base vacía.
- `main.ts` y `package.json` adaptados para elegir el adaptador.
- Nuevo capability `persistencia` con escenarios de paridad.

## Capabilities

### New Capabilities

- `persistencia`: persistencia de usuarios, profesionales, sillones, prestaciones, pacientes, turnos y bloqueos en SQLite con paridad de reglas respecto a memoria.

### Modified Capabilities

- (ninguna; los puertos no cambian)

## Impact

- Código: `src/main.ts`, `src/http/server.ts` (default in-memory), `src/infrastructure/persistence/sqlite/*`, `migrations/*`, seed idempotente.
- Dependencias: `better-sqlite3`, `@types/better-sqlite3`.
- Tests: nuevos tests de SQLite; la suite existente sigue corriendo en memoria.
