# Javier Alaniz — Seguridad y reglas avanzadas (C-09, C-07 y C-08)

## Tu rol

Sos responsable de que la API no quede abierta, de los bloqueos de agenda y de los sobreturnos. Tus tres changes agregan control y realismo operativo al núcleo de Lucas.

**Ola:** 3 para C-09; 4 para C-07; 5 para C-08.
**Changes:** `C-09 auth-rbac`, `C-07 bloqueos-agenda`, `C-08 sobreturnos`.
**Guía canónica:** [`CHANGES.md`](../../CHANGES.md) §C-09, §C-07 y §C-08.

## Antes de empezar

- [ ] Esperar a que Nathaniel mergee **C-02**.
- [ ] Para C-09: esperar a que Lucas mergee **C-03**; si `GET /api/turnos` todavía no existe, coordiná el rebase con él.
- [ ] Para C-07: esperar el merge de **C-09**.
- [ ] Para C-08: esperar el merge de **C-07**.
- [ ] Leer `knowledge-base/03_actores_y_roles.md` §RBAC.
- [ ] Leer `knowledge-base/05_reglas_de_negocio.md` §RN-AU, §RN-SE, §RN-AG-11 y §RN-AG-12.
- [ ] Leer `knowledge-base/08_arquitectura_propuesta.md` §Seguridad.
- [ ] Leer `knowledge-base/09_decisiones_y_supuestos.md` §DD-07.

## Git

```bash
git config user.name "Javier Alaniz"
git config user.email "tu-email-de-github@users.noreply.github.com"

git switch main
git pull --rebase
git switch -c feat/c-09-auth-rbac
```

Después de cada merge:

```bash
git switch main && git pull --rebase
git switch -c feat/c-07-bloqueos-agenda
# luego
git switch -c feat/c-08-sobreturnos
```

---

## C-09 — `auth-rbac`

### Objetivo

Login con sesión, roles y protección de todas las rutas privadas, sin frenar el desarrollo del resto.

### Archivos que te pertenecen

- `src/domain/usuario/usuario.ts` (extender con `profesionalId?`)
- `src/application/auth/login.ts`, `logout.ts`, `obtener-sesion.ts`
- `src/application/auth/password.ts`
- `src/application/ports/session-repository.ts`
- `src/infrastructure/persistence/in-memory-session-repository.ts`
- `src/http/plugins/auth.ts`
- `src/http/routes/auth.ts`
- `src/http/schemas/auth.schema.ts`
- `tests/integration/auth.test.ts`
- `tests/unit/application/password.test.ts`

### Implementación

1. **Password hashing** con `node:crypto` (sin dependencias nativas):
   - `scrypt` con salt aleatorio de 16 bytes y key de 64 bytes.
   - Guardar `salt:hash` en `passwordHash`.
   - Verificar con `timingSafeEqual`.
2. **Sesión**:
   - Agregar `@fastify/cookie`.
   - Token opaco: `randomBytes(32).toString("base64url")`.
   - Guardar en un `Map<token, { usuarioId, expiresAt }>` (en memoria; C-10 no lo persiste).
   - Cookie `session`: `httpOnly: true`, `sameSite: "lax"`, `secure: NODE_ENV === "production"`, `path: "/"`, `maxAge` desde `SESSION_TTL_MINUTES` (default 480).
3. **Endpoints**:
   - `POST /api/auth/login` (público): `{ email, password }` → `200` con `{ id, email, nombre, apellido, rol }` y cookie. Credenciales inválidas → `401 CREDENCIALES_INVALIDAS` (mismo mensaje para email inexistente y password incorrecto).
   - `POST /api/auth/logout`: borra la sesión y la cookie → `204`.
   - `GET /api/auth/me`: devuelve el usuario de la sesión o `401`.
4. **Protección global**:
   - Hook `onRequest` en `src/http/plugins/auth.ts`.
   - Rutas públicas: `GET /health`, `POST /api/auth/login`.
   - Cualquier otra `/api/*` sin sesión válida → `401 NO_AUTENTICADO`.
   - Adjuntar `request.usuario` con `{ id, email, rol, profesionalId? }`.
5. **Roles**:
   - `requireRole(...roles)` como `preHandler`; sin permiso → `403 SIN_PERMISO`.
   - Roles: `administrador`, `recepcionista`, `profesional`.
6. **Scoping del profesional**:
   - Si `GET /api/turnos` ya existe (C-04), y el usuario es `profesional`, forzar `profesionalId = usuario.profesionalId` y no permitir ver turnos de otros.
   - Si C-04 todavía no está mergeado, implementá la política `puedeVerTurno(usuario, turno)` con tests unitarios y dejá el wire listo para el rebase. Avisale a Lucas.
   - En `CrearTurno`, reemplazar `createdBy: "sistema"` por el `id` del usuario autenticado; coordiná el cambio con Lucas para no pisar su archivo.
7. **Seed de usuarios**:
   - `admin@demo.local`, `recepcion@demo.local`, `odonto1@demo.local`.
   - Password de demo: `DEMO_PASSWORD` (default `demo1234`), hasheada al arrancar.
   - `odonto1` vinculado al profesional demo. Documentar que es solo para desarrollo.
8. **Variables nuevas en `.env.example`**: `SESSION_TTL_MINUTES=480`, `DEMO_PASSWORD=demo1234`.

### Tests obligatorios

- [ ] Login correcto → `200`, cookie `session` presente.
- [ ] Password incorrecto → `401`.
- [ ] Email inexistente → `401` con el mismo mensaje.
- [ ] Ruta privada sin cookie → `401`.
- [ ] Ruta privada con sesión → `200`.
- [ ] Rol insuficiente → `403`.
- [ ] Logout invalida la sesión.
- [ ] `/health` y `/api/auth/login` siguen siendo públicos.
- [ ] Profesional no ve turnos de otro profesional (si C-04 está disponible).

### Commits sugeridos

```text
feat(auth): agregar hashing de passwords con scrypt
feat(auth): implementar login, logout y sesiones con cookie
feat(auth): proteger rutas y agregar middleware de roles
test(auth): cubrir login, sesion, roles y logout
```

---

## C-07 — `bloqueos-agenda`

### Objetivo

Permitir bloquear un rango de un profesional o de un sillón y rechazar turnos que caigan dentro.

### Archivos que te pertenecen

- `src/domain/bloqueo/bloqueo.ts`
- `src/application/bloqueos/crear-bloqueo.ts`, `listar-bloqueos.ts`, `eliminar-bloqueo.ts`
- `src/application/ports/bloqueo-repository.ts`
- `src/infrastructure/persistence/in-memory-bloqueo-repository.ts`
- `src/http/routes/bloqueos.ts`
- `src/http/schemas/bloqueo.schema.ts`
- `tests/integration/bloqueos.test.ts`

### Implementación

1. Modelo `Bloqueo`: `id`, `profesionalId?`, `sillonId?`, `inicio`, `fin`, `motivo`, `creadoPor`, `createdAt`.
   - Al menos uno de `profesionalId` o `sillonId`; `fin > inicio`.
2. `POST /api/bloqueos` (Administrador o Recepcionista):
   - Body `{ profesionalId?, sillonId?, inicio, fin, motivo }`.
   - `201` con el bloqueo creado.
3. `GET /api/bloqueos?desde&hasta` y `DELETE /api/bloqueos/:id` (Administrador).
4. **Conflicto con turnos**:
   - En `CrearTurno`, después de validar solapamiento de profesional y sillón, verificar bloqueos del profesional y del sillón.
   - Si hay conflicto → `409 TURNO_BLOQUEADO` con `details.bloqueo`.
   - `forzar: true` solo para Administrador; registrar `autorizadoPor` en el turno. Sin permiso → `403`.
5. Tests:
   - [ ] Bloqueo por profesional rechaza turno.
   - [ ] Bloqueo por sillón rechaza turno.
   - [ ] Turno contiguo al bloqueo se permite.
   - [ ] Administrador puede forzar; recepcionista no.
   - [ ] `fin <= inicio` → `400`.

### Commits sugeridos

```text
feat(bloqueos): agregar modelo y endpoints de bloqueo
feat(bloqueos): rechazar turnos que caen en un bloqueo
test(bloqueos): cubrir conflictos, bordes y excepcion autorizada
```

---

## C-08 — `sobreturnos`

### Objetivo

Permitir un sobreturno controlado: puede pisar la agenda del profesional, nunca la del sillón.

### Archivos que te pertenecen

- `src/application/crear-turno.ts` (extender, coordinar con Lucas)
- `src/http/schemas/turno.schema.ts` (agregar `esSobreturno`)
- `src/http/routes/turnos.ts` (extender)
- `tests/integration/turnos-sobreturno.test.ts`

### Implementación

1. Agregar `esSobreturno?: boolean` al body de `POST /api/turnos`.
2. Si `esSobreturno` es `true`:
   - Requiere rol `administrador` o `recepcionista`; si no → `403`.
   - Se **omite** la validación de solapamiento por profesional.
   - Se **mantiene** la validación de solapamiento por sillón y de bloqueo de sillón.
   - Se registra `autorizadoPor` con el usuario de la sesión.
3. Si es `false` u omitido, el comportamiento es el actual.
4. Tests:
   - [ ] Sobreturno con solapamiento de profesional → `201`.
   - [ ] Sobreturno con solapamiento de sillón → `409 TURNO_SOLAPADO_SILLON`.
   - [ ] Profesional sin rol de recepción → `403`.
   - [ ] Turno normal sigue rechazando solapamiento de profesional.
   - [ ] El sobreturno queda auditado con `autorizadoPor`.

### Commits sugeridos

```text
feat(turnos): permitir sobreturnos con auditoria
test(turnos): cubrir sobreturno, sillón y permisos
```

---

## Evidencia para la defensa

1. `git log --author="Javier Alaniz" --oneline`.
2. Demo de login con cookie, ruta privada sin sesión (`401`) y con sesión (`200`).
3. Mostrar que un profesional no ve turnos ajenos.
4. Demo de bloqueo: crear bloqueo y mostrar `409 TURNO_BLOQUEADO`.
5. Demo de sobreturno: mismo profesional permitido, mismo sillón rechazado.
6. Explicar la diferencia entre autenticación (quién sos) y autorización (qué podés hacer).

## Definition of Done

- [ ] C-09, C-07 y C-08 mergeados con tus commits.
- [ ] `npm run typecheck && npm test` pasa en `main`.
- [ ] Ninguna ruta privada queda accesible sin sesión.
- [ ] No hay passwords ni tokens reales en el repo.

## No tocar

- No implementes pacientes (Aracelly) ni persistencia SQL (Aracelly).
- No reescribas la lógica de solapamiento de Lucas: extendela con los checks de bloqueo y sobreturno.
- No agregues OAuth, JWT ni servicios externos: la sesión con cookie alcanza para el MVP.
