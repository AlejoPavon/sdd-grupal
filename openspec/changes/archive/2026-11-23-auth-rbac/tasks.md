# Tasks

## 1. Contratos de dominio y errores de autenticación

- [x] 1.1 RED: agregar tests unitarios para `CredencialesInvalidasError`, `NoAutenticadoError` y `SinPermisoError` (códigos `CREDENCIALES_INVALIDAS`/`NO_AUTENTICADO`/`SIN_PERMISO`, mensaje único de credenciales y `details` vacío) y para el mapeo HTTP de `error-handler.ts`; verificar que `npx vitest run tests/unit/domain/usuario.test.ts tests/unit/http/error-handler.test.ts` falla por módulos/ramas inexistentes.
- [x] 1.2 GREEN: extraer `DominioError` a `src/domain/errors/dominio-error.ts` con re-export en `turno.errors.ts`, crear `src/domain/usuario/usuario.errors.ts`, agregar `profesionalId?: string` a `Usuario`, definir `UsuarioAutenticado` y agregar las tres ramas al error handler antes de la rama genérica; verificar que los tests del punto 1.1 pasan.
- [x] 1.3 TRIANGULATE: agregar casos de error con mensaje/distinto `details` y de regresión de `DominioError` de turnos (sigue mapeando a `400` con el mismo shape); verificar `npm test` sin fallos de regresión.
- [x] 1.4 REFACTOR: eliminar duplicación de constantes de código/mensaje y confirmar con `npm run typecheck` y `npm run lint` que no hay `any` ni imports rotos.

## 2. Hash de contraseñas y repositorio de sesiones

- [x] 2.1 RED: escribir `tests/unit/application/auth/password.test.ts` y `tests/unit/infrastructure/in-memory-session-repository.test.ts` cubriendo formato `salt:hash` (16 bytes de salt, 64 de key), `timingSafeEqual`, hash corrupto, token de 32 bytes en base64url, expiración y `eliminar`; verificar que fallan porque `src/application/auth/password.ts`, `src/application/ports/session-repository.ts` y el adaptador no existen.
- [x] 2.2 GREEN: implementar `hashPassword`/`verifyPassword` con `node:crypto`, el puerto `SessionRepository` y `InMemorySessionRepository` con `Map` y descarte de sesiones vencidas en `buscar`; verificar que los tests del punto 2.1 pasan.
- [x] 2.3 TRIANGULATE: agregar casos de password con `:` de más, longitudes distintas, `scrypt` fallido y sesiones con vencimiento límite, más dos logins con tokens distintos; verificar que `verifyPassword` devuelve `false` sin lanzar y que los tokens son opacos.
- [x] 2.4 REFACTOR: unificar la lectura del reloj en el repositorio para hacer deterministas los tests de expiración; verificar `npm run typecheck` y los tests del grupo 2 en verde.

## 3. Casos de uso de autenticación y políticas

- [x] 3.1 RED: escribir tests unitarios de `Login`, `Logout`, `ObtenerSesion`, `toUsuarioPublico` y `politicas.ts` (normalización de email, usuario inactivo, mensaje uniforme, idempotencia de logout, rechazo de usuario desactivado después del login, `puedeVerTurno`, `puedeVerPaciente`, `filtrarPacientesVisibles`, `profesionalIdRequerido`); verificar que fallan por módulos ausentes.
- [x] 3.2 GREEN: agregar `buscarPorEmail` case-insensitive a `UsuarioRepository` y su implementación en memoria, y crear los casos de uso y funciones puras con el DTO público exacto `{ id, email, nombre, apellido, rol }`; verificar que los tests del punto 3.1 pasan.
- [x] 3.3 TRIANGULATE: agregar casos de email con mayúsculas/espacios, hash corrupto, TTL configurado, sesión expirada y asociación paciente–profesional derivada de turnos cancelados/atendidos; verificar que ningún test expone `passwordHash` ni datos de sesión.
- [x] 3.4 REFACTOR: extraer el mensaje único de credenciales y la construcción del DTO a puntos únicos; verificar `npm run typecheck` y los tests unitarios del grupo 3.

## 4. Plugin HTTP, hook global y rutas de auth

- [x] 4.1 RED: escribir `tests/integration/auth.test.ts` cubriendo login exitoso por rol, credenciales inválidas uniformes, atributos de cookie en desarrollo y producción, logout con borrado de cookie y reutilización del token, `me` con/ sin token, allowlist de `/health` y `POST /api/auth/login`, y `401` en rutas privadas; verificar que fallan porque las rutas y el hook no existen.
- [x] 4.2 GREEN: registrar `@fastify/cookie` y el hook `onRequest` en el root antes de las rutas, agregar `declare module "fastify"` para `request.usuario`, `usuarioAutenticado(request)` y las rutas `POST /api/auth/login`, `POST /api/auth/logout` y `GET /api/auth/me` con `loginSchema` Zod; verificar que los tests del punto 4.1 pasan.
- [x] 4.3 TRIANGULATE: agregar casos de token desconocido, sesión vencida, query string en la URL, barra final, `NODE_ENV=production`, `SESSION_TTL_MINUTES` positivo e inválido (usa default) y cuerpo sin token; verificar el shape `{ code, message, details }` en todos los errores.
- [x] 4.4 REFACTOR: simplificar el cálculo del pathname y la allowlist sin cambiar comportamiento; verificar `npm run typecheck`, `npx vitest run tests/integration/auth.test.ts` y `npm run lint`.

## 5. Helper de login, RBAC y scoping en turnos

- [x] 5.1 Crear `tests/helpers/auth.ts` con login real vía `app.inject` que devuelve la cookie `session` de cada rol demo y un helper `autenticarseComo(rol)`; verificar que un test de humo obtiene `200` en `GET /api/auth/me` con esa cookie y `401` sin ella.
- [x] 5.2 RED: ampliar `tests/unit/application/politicas.test.ts` y `tests/integration/turnos.test.ts` con los casos de autenticación obligatoria, `403 SIN_PERMISO` para `profesional`, scoping de listado/detalle, profesional sin vínculo, administrador/recepcionista sin scoping y `createdBy` desde la sesión; verificar que fallan.
- [x] 5.3 GREEN: aplicar `requireRole("administrador", "recepcionista")` a `POST /api/turnos` y `PATCH /api/turnos/:id/cancelar`, forzar el filtro de `profesionalId` en listados, usar `puedeVerTurno` en el detalle y pasar `usuarioAutenticado(request).id` como `creadoPor`; verificar que los tests del punto 5.2 pasan.
- [x] 5.4 TRIANGULATE: agregar casos de `profesionalId` ajeno en el query, turno ajeno por id, sesión expirada en mutación y cancelación denegada sin cambio de estado; verificar `npx vitest run tests/integration/turnos.test.ts tests/unit/application/politicas.test.ts`.
- [x] 5.5 REFACTOR: extraer la resolución del vínculo de profesional a `profesionalIdRequerido`; verificar `npm run typecheck` y `npm run lint` sin `any`.

## 6. RBAC y scoping en pacientes y catálogos

- [x] 6.1 RED: ampliar `tests/integration/pacientes.test.ts` y `tests/integration/catalogos.test.ts` con alta/actualización/baja sin sesión y con rol `profesional`, scoping por turnos (incluido cancelado), búsqueda `q` acotada, detalle ajeno, profesional sin vínculo y catálogos con cualquier rol autenticado; verificar que fallan.
- [x] 6.2 GREEN: aplicar `requireRole("administrador", "recepcionista")` a las mutaciones de pacientes, filtrar el listado con `filtrarPacientesVisibles` sobre los turnos del profesional y validar `puedeVerPaciente` en el detalle; verificar que los tests de pacientes del punto 6.1 pasan y que los catálogos siguen devolviendo `200` con sesión.
- [x] 6.3 TRIANGULATE: agregar casos de paciente con turnos de dos profesionales, turno `atendido`, búsqueda sin coincidencias y denegación de baja sin cambiar `activo`; verificar `npx vitest run tests/integration/pacientes.test.ts tests/integration/catalogos.test.ts`.
- [x] 6.4 REFACTOR: reutilizar `usuarioAutenticado` y `profesionalIdRequerido` en ambos routers; verificar `npm run typecheck` y cobertura de los supuestos registrados en `design.md` (`403` para recursos ajenos).

## 7. Seed, sesiones en el composition root y configuración

- [x] 7.1 RED: actualizar `tests/unit/infrastructure/seed.test.ts` para esperar un hash `scrypt` distinto de `DEMO_PASSWORD`, verificable con `verifyPassword`, y que `odonto1@demo.local` quede vinculado a `SEED_IDS.profesional1`; verificar que falla con el placeholder actual.
- [x] 7.2 GREEN: hashear `DEMO_PASSWORD` una sola vez en `cargarSeed`, vincular `profesionalId` del usuario demo, incluir `sesiones: InMemorySessionRepository` en `Repositorios`/`buildServer`, pasar `sessionTtlMs` desde `SESSION_TTL_MINUTES` (default 480) y documentar las variables en `.env.example`; verificar que el test del punto 7.1 y `npm run typecheck` pasan.
- [x] 7.3 TRIANGULATE: agregar casos de `DEMO_PASSWORD` personalizado, `SESSION_TTL_MINUTES` inválido y seed cargado dos veces con tokens distintos; verificar `npm test` completo.
- [x] 7.4 REFACTOR: documentar en el seed que las credenciales son de desarrollo con datos ficticios (RN-SE-01/RN-SE-02); verificar que el archivo `.env.example` contiene `SESSION_TTL_MINUTES=480` y `DEMO_PASSWORD=demo1234`.

## 8. Actualización de la suite existente y verificación final

- [x] 8.1 Migrar `tests/integration/health.test.ts`, `tests/integration/turnos.test.ts`, `tests/integration/pacientes.test.ts`, `tests/integration/catalogos.test.ts` y las fixtures de `Repositorios` para usar el helper de login real y el repositorio de sesiones; verificar `npm test` sin requests sin autenticar a `/api/*`.
- [x] 8.2 Actualizar los tests unitarios existentes que construyen `Repositorios` o esperan `SEED_IDS.recepcion` como `createdBy`, y los de `error-handler`, para el nuevo contrato; verificar `npx vitest run tests/unit` en verde.
- [x] 8.3 Verificar la matriz completa de escenarios de los deltas `auth`, `turnos`, `pacientes` y `catalogos` contra `openspec show auth-rbac --json`, sin dejar scenarios sin test o sin observación manual; verificar el listado de scenarios marcados como cubiertos.
- [x] 8.4 Ejecutar `npm run typecheck && npm test && npm run lint` desde la raíz del repo y verificar que los tres comandos terminan con código 0.
- [x] 8.5 Confirmar que no quedó código de C-07/C-08 mezclado en este change y que la rama sigue siendo `feat/c-09-c-07-c-08-seguridad-agenda`; verificar con `git status --short` que solo cambiaron los artefactos/implementación de C-09.

## Workflow follow-up

- Registrar el resultado en `CHANGES.md` y completar la revisión del change antes de archivear.
- Archivear el change con el workflow del proyecto una vez satisfechas las revisiones.
