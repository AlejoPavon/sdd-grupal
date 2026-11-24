# Design

## Decisions

- **Persistencia:** `better-sqlite3`; `engines.node >=20`. Las sesiones quedan en memoria.
- **Transaccionalidad de `crear` (turnos):** el repositorio SQLite repite el chequeo dentro de una transacción `BEGIN IMMEDIATE` con las mismas reglas que `CrearTurno`: solapamiento de profesional solo si `esSobreturno === false`; solapamiento de sillón siempre; orden profesional → sillón; estados que ocupan agenda según `ocupaAgenda` de `src/domain/turno/estado-turno.ts`. Si hay conflicto lanza `TurnoSolapadoError`.
- **`listar`:** replica filtros de memoria: `desde` → `fin > desde`; `hasta` → `inicio < hasta`; orden por `inicio` con desempate estable.
- **`buscarSolapado*`:** soporta `excluirId`.
- **Schema:** incluye todos los campos de `Turno` (`notas`, `autorizadoPor`, `esSobreturno`, `cancelledAt`). La sucursal no tiene repositorio en este change: `sillon.sucursal_id` es columna sin FK. `usuario.profesional_id` es FK nullable a `profesional`; `bloqueo.profesional_id` y `bloqueo.sillon_id` son FK nullables a `profesional` y `sillon`; `bloqueo.creado_por` va sin FK (auditoría).
- **Migraciones:** archivos `migrations/*.sql` en la raíz del proyecto, leídos con una ruta calculada desde `import.meta.url` hacia la raíz. Como `src/` y `dist/` tienen la misma profundidad, la ruta sirve en los tests y con `node dist/main.js` (`tsc` no copia los `.sql`).
- **Seed idempotente:** `main.ts` carga el seed solo si la base está vacía (por ejemplo `usuarios.buscarPorId(SEED_IDS.admin)` no devuelve nada); no se usa `INSERT OR IGNORE` en crear y no se toca `seed.ts` ni los puertos. Se verifica el admin porque `cargarSeed` crea los usuarios al final: si el admin existe, el seed terminó completo.
- **listar pacientes:** traer activos con SQL y aplicar el filtro `q` y el orden en TypeScript con la misma lógica que la memoria (`toLowerCase().includes` y `localeCompare`).
- **Índices únicos parciales:** separados para `email` y `documento` (comparación exacta, sin `COLLATE NOCASE`), para saber cuál falló y pasar el campo a `PacienteDuplicadoError`.
- **Mapeo:** `Date` ↔ epoch ms; booleanos `0/1`; `NULL` → propiedad ausente; `especialidades` como JSON.
- **Claves foráneas:** decisión clara — FK solo entre tablas que siempre existen en producción (paciente, profesional, sillon, prestacion); sin FK en `created_by` ni `autorizado_por`. Motivo: la auditoría no debe depender de la existencia del usuario. Los tests de repositorio siembran las entidades padre.
- **Persistencia de entidades:** usuarios (con hash de contraseña), profesionales, sillones, prestaciones, pacientes, turnos y bloqueos. Las sesiones quedan en memoria.
- **Sincronía:** `better-sqlite3` es síncrono; los puertos son `async`, el adaptador envuelve las llamadas. Los tests usan un archivo temporal que se borra al finalizar. 
- **Default:** `PERSISTENCE=memory`; los tests existentes no dependen de SQLite.
- **Bloqueos:** tabla `bloqueo` con `id`, `profesional_id` (nullable), `sillon_id` (nullable), `inicio`, `fin`, `motivo`, `creado_por` y `created_at`. Un `CHECK` exige al menos un recurso. `eliminar` de un id inexistente no falla, igual que en memoria. `buscarSolapado*` de bloqueos no filtra por estado ni usa `excluirId`.
- **Orden estable:** en `listar` de turnos y de bloqueos el desempate es el orden de inserción (`ORDER BY inicio, rowid`), igual que el `Map` de memoria. Por eso las tablas no deben ser `WITHOUT ROWID`.
- **WAL y tests:** con `journal_mode = WAL` aparecen `-wal` y `-shm` junto al `.db`; los tests usan un directorio temporal que se borra completo, y cierran la conexión antes.
- **Violación de índice único:** se traduce a `PacienteDuplicadoError` identificando el índice por su nombre en el error, y un test verifica que informa el campo correcto (`email` o `documento`).
- **Usuarios:** tabla `usuario` con `id`, `email`, `password_hash`, `nombre`, `apellido`, `rol` (con `CHECK` en `administrador`, `recepcionista` y `profesional`), `activo` y `profesional_id` (nullable). La entidad no tiene fechas. `email` sin `UNIQUE`, porque la memoria no lo valida. Los campos opcionales ausentes vuelven como propiedad ausente y no como `null`.
- **Configuración de la base:** `DATABASE_URL` con default `file:./data/turnos.db` (según CHANGES.md); se quita el prefijo `file:` para abrir el archivo.
- **Sucursal e índices:** la migración 001 crea también la tabla `sucursal` (la lista CHANGES.md), sin repositorio ni uso en este change y reservada para C-18; `sillon.sucursal_id` sigue sin FK. Los índices de agenda van en `migrations/002_indexes.sql`.
- **Alcance:** CHANGES.md nombra dos repositorios SQLite, pero este change persiste siete entidades, porque un turno referencia a paciente, profesional, sillón y prestación, y mezclar memoria con SQLite dejaría datos incoherentes tras un reinicio.

## Archivos de otros que se tocan

- `src/main.ts`
- `package.json` y `package-lock.json`
- `.env.example`
- `.gitignore`
- `CHANGES.md` (solo línea de C-10)

## Limitaciones conocidas

- Chequeo de bloqueos no atómico.
- Sesiones no persisten entre reinicios.
- Si el seed se interrumpe a mitad, el siguiente arranque puede fallar por claves duplicadas (el chequeo mira solo si existe el admin, y los sillones se crean antes); en ese caso se borra la base de demo.
