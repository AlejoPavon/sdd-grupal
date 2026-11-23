# Proposal

## Why

La API expone hoy turnos, pacientes y catálogos sin autenticación ni autorización: cualquiera con acceso a la red puede leer la agenda completa, dar de baja pacientes o cancelar turnos de terceros. El contrato RBAC de `knowledge-base/03_actores_y_roles.md` está documentado pero no aplicado (DD-07 lo postergó), y los changes posteriores (historia clínica, facturación, multi-sucursal) dependen de C-09 para saber quién opera. Es el momento de implementarlo porque C-02, C-03, C-04, C-05 y C-06 ya están mergeados y todos los endpoints que hay que proteger existen.

## What Changes

- Se agrega login con sesión de servidor: `POST /api/auth/login` valida email y password contra un hash `scrypt`, crea un token opaco y responde con cookie `session` (`httpOnly`, `sameSite=lax`, `secure` solo en producción, TTL configurable por `SESSION_TTL_MINUTES`, default 480 minutos).
- Se agrega `POST /api/auth/logout` (borra sesión y cookie, `204`) y `GET /api/auth/me` (devuelve el usuario de la sesión o `401`).
- Se agrega un hook global `onRequest` que exige sesión válida para toda ruta `/api/*`, salvo `POST /api/auth/login`; `GET /health` sigue siendo público. Sin sesión válida responde `401 NO_AUTENTICADO`.
- Se agrega `requireRole(...roles)` como `preHandler`: usuario autenticado sin el rol requerido recibe `403 SIN_PERMISO`.
- Se aplica la política de roles: crear, modificar y cancelar turnos y pacientes queda reservado a `administrador` y `recepcionista`; las lecturas requieren sesión; `profesional` es solo lectura y con scoping a sus propios datos.
- Se agrega scoping por profesional: en `GET /api/turnos` y `GET /api/turnos/:id` solo ve turnos de su `profesionalId`; en `GET /api/pacientes` y `GET /api/pacientes/:id` solo ve pacientes asociados a turnos de su `profesionalId` (relación derivada de turnos). Sin `profesionalId` vinculado responde `403 SIN_PERMISO`.
- `POST /api/turnos` deja de usar el usuario de seed hardcodeado: `createdBy` pasa a ser el `id` del usuario autenticado.
- Se extiende `Usuario` con `profesionalId?` y se vincula el usuario demo `odonto1@demo.local` al profesional demo.
- El seed hashea `DEMO_PASSWORD` (default `demo1234`) una sola vez y usa el mismo hash para los tres usuarios demo, exclusivamente para desarrollo.
- Se agregan `SESSION_TTL_MINUTES=480` y `DEMO_PASSWORD=demo1234` a `.env.example`.
- **BREAKING** (interno, no de contrato externo del dominio): todos los requests de integración existentes a `/api/*` pasan a requerir cookie de sesión; se actualizan los tests con un helper de login real.

## Capabilities

### New Capabilities

- `auth`: autenticación por sesión con cookie, ciclo login/logout/me, protección global de rutas privadas, autorización por rol y scoping de profesional sobre turnos y pacientes.

### Modified Capabilities

- `turnos`: las rutas de turnos pasan a requerir sesión; las mutaciones exigen rol `administrador` o `recepcionista`; un `profesional` solo consulta sus propios turnos; `createdBy` se toma del usuario autenticado.
- `pacientes`: las rutas de pacientes pasan a requerir sesión; las mutaciones exigen rol `administrador` o `recepcionista`; un `profesional` solo consulta pacientes asociados a sus turnos.
- `catalogos`: los listados de profesionales, sillones y prestaciones pasan a requerir sesión válida.

## Impact

- **Código afectado**: `src/domain/usuario/usuario.ts` (`profesionalId?`) y nuevo `src/domain/usuario/usuario.errors.ts`; nuevos casos de uso en `src/application/auth/` (`password.ts`, `login.ts`, `logout.ts`, `obtener-sesion.ts`, `politicas.ts`); nuevo puerto `src/application/ports/session-repository.ts` y adaptador `src/infrastructure/persistence/in-memory-session-repository.ts`; nuevo `src/http/plugins/auth.ts`; nueva ruta `src/http/routes/auth.ts` y schema `src/http/schemas/auth.schema.ts`; cambios en `src/http/server.ts`, `src/http/error-handler.ts`, `src/http/routes/turnos.ts`, `src/http/routes/pacientes.ts`, `src/http/routes/catalogos.ts`; `src/infrastructure/seed.ts` y `src/main.ts`; `.env.example`.
- **APIs**: se agregan `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`; cambia el contrato de acceso de todos los `/api/*` existentes (401/403) y el resultado de `GET /api/turnos` y `GET /api/pacientes` cuando el usuario es `profesional`.
- **Dependencias**: C-02 `core-domain-models` (DONE); C-03/C-04/C-05/C-06 ya mergeados. `@fastify/cookie@9.4.0` ya está instalado; no se agregan dependencias nativas ni servicios externos.
- **Impacto en tests**: los tests de integración de turnos, pacientes y catálogos deben autenticarse vía login real con un helper `tests/helpers/auth.ts`; el test unitario del seed deja de esperar el hash de relleno.
- **Riesgo**: el scrypt del seed agrega tiempo de arranque en cada `cargarSeed` de test (un solo hash por ejecución); se documenta como trade-off aceptable en v0.1.
