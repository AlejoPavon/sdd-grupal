# Aracelly Caballero — Pacientes y persistencia (C-06 y C-10)

## Tu rol

Sos responsable de los datos: el CRUD de pacientes que usa la recepción y la persistencia SQLite que reemplaza a los repositorios en memoria sin cambiar el dominio.

**Ola:** 2 para C-06; 4 para C-10.
**Changes:** `C-06 pacientes-crud`, `C-10 sqlite-persistence`.
**Guía canónica:** [`CHANGES.md`](../../CHANGES.md) §C-06 y §C-10.

## Antes de empezar

- [ ] Esperar a que Nathaniel mergee **C-02** y hacer `git pull --rebase`.
- [ ] Leer `knowledge-base/04_modelo_de_datos.md` §Paciente y §Turno.
- [ ] Leer `knowledge-base/06_funcionalidades.md` §US-010 a §US-012.
- [ ] Leer `knowledge-base/05_reglas_de_negocio.md` §RN-PA y §RN-AG-04/05.
- [ ] Revisar los puertos que definió Nathaniel; no los redefinas.

## Git

```bash
git config user.name "Aracelly Caballero"
git config user.email "tu-email-de-github@users.noreply.github.com"

git switch main
git pull --rebase
git switch -c feat/c-06-pacientes
```

Para C-10, esperar el merge de **C-05** y **C-06**:

```bash
git switch main && git pull --rebase
git switch -c feat/c-10-sqlite-persistence
```

---

## C-06 — `pacientes-crud`

### Objetivo

Permitir alta, búsqueda, edición y baja lógica de pacientes, con validaciones básicas y sin datos reales.

### Archivos que te pertenecen

- `src/domain/paciente/paciente.ts` (extender si hace falta)
- `src/application/pacientes/crear-paciente.ts`
- `src/application/pacientes/listar-pacientes.ts`
- `src/application/pacientes/actualizar-paciente.ts`
- `src/application/pacientes/desactivar-paciente.ts`
- `src/http/routes/pacientes.ts`
- `src/http/schemas/paciente.schema.ts`
- `tests/integration/pacientes.test.ts`

### Implementación

1. **`POST /api/pacientes`**
   - Body: `{ nombre, apellido, documento?, telefono?, email?, fechaNacimiento?, notas? }`.
   - `nombre` y `apellido` obligatorios y no vacíos.
   - `email` y `documento`, si vienen, deben ser únicos entre pacientes **activos**.
   - Duplicado → `409 PACIENTE_DUPLICADO` con `details.campo`.
   - Devuelve `201` con `activo: true`.
2. **`GET /api/pacientes?q=`**
   - Búsqueda parcial por apellido, nombre, teléfono o documento, case-insensitive.
   - Solo pacientes activos por defecto.
   - Orden por apellido y nombre.
3. **`GET /api/pacientes/:id`** → `200` o `404 PACIENTE_NO_ENCONTRADO`.
4. **`PATCH /api/pacientes/:id`**
   - Actualiza solo los campos enviados.
   - Vuelve a validar unicidad de email/documento entre activos.
5. **`DELETE /api/pacientes/:id`**
   - Baja lógica: `activo = false` y `updatedAt`.
   - No borra turnos históricos.
6. **Integración con turnos:** el alta de turno debe rechazar pacientes inactivos. Coordiná con Lucas para que `CrearTurno` use `buscarActivoPorId` o valide `paciente.activo`. Si no está implementado, agregá el test y avisale.

### Tests obligatorios

- [ ] Alta válida → `201`, activo.
- [ ] Falta nombre/apellido → `400`.
- [ ] Email duplicado entre activos → `409`.
- [ ] Documento duplicado entre activos → `409`.
- [ ] Búsqueda parcial por apellido y por documento.
- [ ] Baja lógica → `activo: false`; no aparece en el listado por defecto.
- [ ] Turno para paciente inactivo → `409` (test de integración con C-03).
- [ ] Paciente inexistente → `404`.

### Commits sugeridos

```text
feat(pacientes): agregar alta y validaciones de duplicados
feat(pacientes): listar, buscar y actualizar pacientes
feat(pacientes): implementar baja logica
test(pacientes): cubrir CRUD, busqueda y paciente inactivo
```

---

## C-10 — `sqlite-persistence`

### Objetivo

Persistir turnos y pacientes en SQLite detrás de los mismos puertos, sin que el dominio ni los tests existentes dependan de la base.

### Archivos que te pertenecen

- `src/infrastructure/persistence/sqlite/connection.ts`
- `src/infrastructure/persistence/sqlite/migrations.ts`
- `src/infrastructure/persistence/sqlite/sqlite-turno-repository.ts`
- `src/infrastructure/persistence/sqlite/sqlite-paciente-repository.ts`
- `src/infrastructure/persistence/sqlite/sqlite-catalogo-repositories.ts`
- `migrations/001_init.sql`
- `migrations/002_indexes.sql`
- `tests/integration/persistence.test.ts`
- `tests/unit/infrastructure/sqlite-*.test.ts`

### Implementación

1. **Dependencia:** `better-sqlite3@13` + `@types/better-sqlite3`.
   - Requiere Node `>=22` (el proyecto fija Node 22.13/24 LTS en `engines.node`). El paquete trae binarios N-API precompilados y `.npmrc` fija `ignore-scripts=true`, así que no hace falta compilador ni Visual Studio. No hace falta migrar a `node:sqlite`.
2. **Configuración**:
   - `PERSISTENCE=memory|sqlite` (default `memory`).
   - `DATABASE_URL=file:./data/turnos.db` (default).
   - Crear el directorio `data/` si no existe; `data/` está en `.gitignore`.
3. **Conexión** (`connection.ts`):
   - Abrir la base con `better-sqlite3`.
   - `PRAGMA foreign_keys = ON`, `PRAGMA journal_mode = WAL`.
   - Exportar una función `crearConexion(path)`.
4. **Migraciones** (`migrations.ts`):
   - Tabla `schema_migrations(version TEXT PRIMARY KEY, applied_at TEXT)`.
   - Leer `migrations/*.sql` en orden, aplicar dentro de una transacción y registrar la versión.
   - Idempotente: correr dos veces no falla.
5. **Schema** (`001_init.sql`):
   - `sucursal`, `usuario`, `profesional`, `sillon`, `prestacion`, `paciente`, `turno`, `bloqueo`.
   - Fechas como `INTEGER` epoch milisegundos (UTC). Booleanos como `INTEGER 0/1`. Arrays como JSON `TEXT`.
   - `turno` con `paciente_id`, `profesional_id`, `sillon_id`, `prestacion_id`, `inicio`, `fin`, `estado`, `es_sobreturno`, `created_by`, `created_at`, `updated_at`, `cancelled_at`.
   - FKs con `ON DELETE RESTRICT`.
6. **Índices** (`002_indexes.sql`):
   - `(profesional_id, inicio, fin)`, `(sillon_id, inicio, fin)`, `(paciente_id, inicio)`, `(estado)`.
7. **Consultas de solapamiento**:
   - `WHERE profesional_id = ? AND estado IN ('pendiente','confirmado') AND inicio < ? AND fin > ?`
   - Equivalente para sillón.
   - En creación, usar una transacción `BEGIN IMMEDIATE` y repetir la verificación antes de insertar, para evitar doble reserva concurrente.
8. **Repositorios**: implementar los mismos puertos con mapeo fila ↔ entidad. No cambiar firmas ni dominio.
9. **Seed**: `INSERT OR IGNORE` con los IDs ficticios del seed en memoria.
10. **Arranque**: `src/main.ts` elige adaptador según `PERSISTENCE`. Con `memory` todo sigue igual; con `sqlite` usa la base. No rompas los tests existentes: la suite debe correr en memoria salvo los tests específicos de SQLite.

### Tests obligatorios

- [ ] Migraciones crean el schema y son idempotentes.
- [ ] Crear turno en SQLite y leerlo con una nueva conexión al mismo archivo.
- [ ] Paridad: los mismos casos de solapamiento por profesional y sillón que en memoria.
- [ ] Turno cancelado no bloquea.
- [ ] Paciente inactivo no recibe turnos.
- [ ] Doble reserva secuencial → `409`.
- [ ] `PERSISTENCE=memory npm test` sigue pasando completo.

### Verificación manual

```bash
rm -f data/turnos.db
PERSISTENCE=sqlite npm run dev
curl -s http://localhost:3000/health
# crear un turno, reiniciar el servidor y consultarlo de nuevo
```

### Commits sugeridos

```text
feat(persistence): agregar conexion SQLite y runner de migraciones
feat(persistence): crear schema e indices de agenda
feat(persistence): implementar repositorios de turnos y pacientes
test(persistence): cubrir migraciones, paridad y persistencia
```

---

## Evidencia para la defensa

1. `git log --author="Aracelly Caballero" --oneline`.
2. `npm test` con el CRUD de pacientes y los tests de persistencia.
3. Demo: crear paciente, buscarlo, desactivarlo e intentar crearle un turno (`409`).
4. Demo: crear turno con `PERSISTENCE=sqlite`, reiniciar el servidor y mostrarlo de nuevo.
5. Explicar por qué el dominio no cambia al pasar de memoria a SQLite y cómo se evita la doble reserva.

## Definition of Done

- [ ] C-06 y C-10 mergeados con tus commits.
- [ ] `npm run typecheck && npm test` pasa en `main` con `PERSISTENCE=memory`.
- [ ] Los tests de SQLite pasan en una base limpia.
- [ ] `data/` y `*.db` no están commiteados.

## No tocar

- No implementes endpoints de turnos (Lucas), auth ni bloqueos (Javier).
- No cambies las entidades ni los puertos para que entren en SQLite: adaptá la persistencia al contrato.
- No hagas que los tests existentes dependan de SQLite.
