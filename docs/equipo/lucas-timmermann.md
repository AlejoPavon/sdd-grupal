# Lucas Timmermann — Turnos (C-03, C-04 y C-05)

## Tu rol

Implementás el corazón del producto: crear turnos sin solapamientos, consultar la agenda y cancelar turnos. Las tres reglas que tenés que demostrar son el diferencial del TP.

**Ola:** 2 para C-03; 3 para C-04 y C-05.
**Changes:** `C-03 turno-creation`, `C-04 agenda-queries`, `C-05 turno-cancellation`.
**Guía canónica:** [`CHANGES.md`](../../CHANGES.md) §C-03 a §C-05.

## Antes de empezar

- [ ] Esperar a que Nathaniel mergee **C-02** y hacer `git pull --rebase`.
- [ ] Leer `knowledge-base/05_reglas_de_negocio.md` §RN-AG y §RN-TU.
- [ ] Leer `knowledge-base/07_flujos_principales.md` §Flujo 1 a §Flujo 4.
- [ ] Leer `knowledge-base/06_funcionalidades.md` §US-001 a §US-006.
- [ ] Revisar los puertos y entidades que dejó Nathaniel; no los redefinas.

## Git

```bash
git config user.name "Lucas Timmermann"
git config user.email "tu-email-de-github@users.noreply.github.com"

git switch main
git pull --rebase
git switch -c feat/c-03-turno-creation
```

Después del merge de C-03:

```bash
git switch main && git pull --rebase
git switch -c feat/c-04-agenda-queries
```

Y después del merge de C-04:

```bash
git switch main && git pull --rebase
git switch -c feat/c-05-turno-cancellation
```

C-04 y C-05 tocan el mismo archivo de rutas. Hacelos **en secuencia**, no en paralelo.

---

## C-03 — `turno-creation`

### Objetivo

`POST /api/turnos` crea un turno y rechaza cualquier solapamiento con el mismo profesional o el mismo sillón.

### Archivos que te pertenecen

- `src/application/crear-turno.ts`
- `src/application/dto/turno-dto.ts` (si lo necesitás)
- `src/http/routes/turnos.ts`
- `src/http/schemas/turno.schema.ts`
- `src/http/error-handler.ts` (mapeo compartido de errores)
- `tests/integration/turnos-crear.test.ts`

### Implementación

1. **Schema Zod** del body:
   ```json
   {
     "pacienteId": "uuid",
     "profesionalId": "uuid",
     "sillonId": "uuid",
     "prestacionId": "uuid",
     "inicio": "2026-11-18T13:00:00.000Z",
     "notas": "opcional"
   }
   ```
   - `inicio` debe ser ISO 8601 con zona; transformarlo a `Date`.
   - IDs con `z.string().uuid()`.
   - Rechazo `400` con `details` por campo.

2. **Caso de uso `CrearTurno`**:
   - Recibe los repositorios por constructor (inyección de dependencias).
   - Busca paciente, profesional, sillón y prestación. Si no existen → `404` con el código correspondiente.
   - Si cualquiera está inactivo → `409 RECURSO_INACTIVO`.
   - Calcula `fin` con `Intervalo.desdeInicioDuracion(inicio, prestacion.duracionMinutos)`.
   - Busca solapamiento por profesional y por sillón. Si hay → `TurnoSolapadoError` con el turno en conflicto.
   - Persiste con estado `pendiente`, `esSobreturno: false`, `createdBy: "sistema"` (Javier lo reemplaza por el usuario real en C-09).
   - Devuelve el turno creado.

3. **Ruta** `POST /api/turnos`:
   - `201` con `{ id, inicio, fin, estado, profesionalId, sillonId, pacienteId, prestacionId }`.
   - Fechas serializadas con `toISOString()`.
   - No devuelvas el objeto completo con datos internos innecesarios.

4. **Error handler**:
   - Dominio → HTTP: `IntervaloInvalidoError` 400, `RecursoNoEncontradoError` 404, `RecursoInactivoError` 409, `TurnoSolapadoError` 409, `TransicionInvalidaError` 409.
   - Formato `{ code, message, details }`.
   - En solapamiento, `details.turnoEnConflicto = { id, inicio, fin }`.
   - No expongas stack traces.

### Tests obligatorios

- [ ] Turno válido → `201`, estado `pendiente`, `fin = inicio + duración`.
- [ ] Solapamiento con el mismo profesional → `409 TURNO_SOLAPADO_PROFESIONAL`.
- [ ] Solapamiento con el mismo sillón, distinto profesional → `409 TURNO_SOLAPADO_SILLON`.
- [ ] Dos profesionales distintos en sillones distintos a la misma hora → ambos `201`.
- [ ] Turno contiguo (`09:00–09:30` y `09:30–10:00`) → ambos `201`.
- [ ] Paciente inexistente → `404 PACIENTE_NO_ENCONTRADO`.
- [ ] Prestación inactiva → `409 RECURSO_INACTIVO`.
- [ ] `inicio` inválido → `400`.
- [ ] Un turno cancelado del mismo profesional no bloquea el horario.

### Verificación manual

```bash
npm run dev
curl -s -X POST http://localhost:3000/api/turnos \
  -H "Content-Type: application/json" \
  -d '{"pacienteId":"<seed>","profesionalId":"<seed>","sillonId":"<seed>","prestacionId":"<seed>","inicio":"2026-11-18T13:00:00.000Z"}'
```

Repetir el mismo request debe devolver `409` con `TURNO_SOLAPADO_PROFESIONAL`.

### Commits sugeridos

```text
feat(turnos): agregar schema y endpoint de creacion
feat(turnos): validar solapamiento por profesional y sillon
test(turnos): cubrir conflictos, contiguos y errores de negocio
```

---

## C-04 — `agenda-queries`

### Objetivo

Consultar turnos por rango y filtros, y listar los catálogos básicos.

### Archivos que te pertenecen

- `src/application/listar-turnos.ts`
- `src/application/obtener-turno.ts`
- `src/http/routes/turnos.ts` (extender)
- `src/http/routes/catalogos.ts`
- `tests/integration/turnos-listar.test.ts`

### Implementación

1. `GET /api/turnos?desde=...&hasta=...&profesionalId=...&sillonId=...`
   - `desde` y `hasta` obligatorios, ISO 8601.
   - Si `desde >= hasta` → `400 RANGO_INVALIDO`.
   - Solo turnos `pendiente` y `confirmado` por defecto.
   - Orden ascendente por `inicio`.
   - Cada item incluye `paciente: { id, nombre, apellido }` y `prestacion: { id, nombre, duracionMinutos }`.
2. `GET /api/turnos/:id` → `200` o `404 TURNO_NO_ENCONTRADO`.
3. `GET /api/profesionales`, `GET /api/sillones`, `GET /api/prestaciones` → listas activas.
4. No expongas datos clínicos ni notas internas en los listados.

### Tests obligatorios

- [ ] Rango devuelve solo turnos activos del período.
- [ ] Filtro por profesional y por sillón.
- [ ] Orden por `inicio`.
- [ ] Turno cancelado no aparece.
- [ ] `desde >= hasta` → `400`.
- [ ] `GET /api/turnos/:id` inexistente → `404`.

### Commits sugeridos

```text
feat(agenda): listar turnos por rango y filtros
feat(catalogos): exponer profesionales, sillones y prestaciones
test(agenda): cubrir filtros, orden y rango invalido
```

---

## C-05 — `turno-cancellation`

### Objetivo

Cancelar un turno y liberar el horario, sin romper la trazabilidad.

### Archivos que te pertenecen

- `src/application/cancelar-turno.ts`
- `src/http/routes/turnos.ts` (extender)
- `tests/integration/turnos-cancelar.test.ts`

### Implementación

1. `PATCH /api/turnos/:id/cancelar` sin body.
2. `CancelarTurno`:
   - `pendiente | confirmado → cancelado`; setear `cancelledAt` y `updatedAt`.
   - `atendido` → `409 TRANSICION_INVALIDA`.
   - Ya `cancelado` → `200` idempotente, mismo cuerpo, sin cambios.
   - Inexistente → `404 TURNO_NO_ENCONTRADO`.
3. Después de cancelar, un turno nuevo en el mismo horario debe crearse sin conflicto.

### Tests obligatorios

- [ ] Cancelación feliz → `200`, estado `cancelado`, `cancelledAt` presente.
- [ ] Doble cancelación → `200`, no cambia nada.
- [ ] Turno atendido → `409`.
- [ ] Turno inexistente → `404`.
- [ ] Recrear turno en el horario liberado → `201`.

### Commits sugeridos

```text
feat(turnos): cancelar turno y liberar agenda
test(turnos): cubrir cancelacion idempotente y liberacion de horario
```

---

## Evidencia para la defensa

1. `git log --author="Lucas Timmermann" --oneline`.
2. `npm test` con los tests de solapamiento por profesional, por sillón y de borde.
3. Demo con `curl`: crear turno, intentar duplicarlo, mostrar `409` con el turno en conflicto, cancelar y volver a crear.
4. Explicar por qué se validan **dos** recursos (profesional y sillón) y qué pasa con un turno cancelado.
5. Mostrar el error handler y cómo distingue `TURNO_SOLAPADO_PROFESIONAL` de `TURNO_SOLAPADO_SILLON`.

## Definition of Done

- [ ] Los tres PRs mergeados con tus commits.
- [ ] `npm run typecheck && npm test` pasa en `main`.
- [ ] Los endpoints responden con el formato de error acordado.
- [ ] Avisaste a Javier cuando C-03 estuvo mergeado para que empiece C-07.

## No tocar

- No implementes pacientes (Aracelly), auth (Javier), bloqueos ni sobreturnos (Javier).
- No cambies el predicado de solapamiento ni los estados definidos en C-02 sin acordarlo.
- No agregues persistencia SQL: C-10 es de Aracelly.
