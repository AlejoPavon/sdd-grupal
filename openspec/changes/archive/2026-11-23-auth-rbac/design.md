# Design

## Context

Ver `proposal.md` para la motivación. El estado actual relevante:

- Dominio y persistencia en memoria de C-02 (`Usuario` con `passwordHash`, `UsuarioRepository`), creación de turnos de C-03, consultas de agenda de C-04, cancelación de C-05 y CRUD de pacientes de C-06 ya están mergeados.
- `buildServer(repos?)` es sincrónico, crea los repositorios por defecto y registra rutas y error handler. Los tests de integración usan `app.inject` con repositorios y seed propios.
- `Repositorios.usuarios` es opcional; `POST /api/turnos` usa `SEED_IDS.recepcion` como `createdBy` fijo.
- El seed usa `PASSWORD_HASH_PLACEHOLDER` y el test unitario del seed lo verifica.
- `@fastify/cookie@9.4.0` ya está instalado en `package.json` (compatible con Fastify 4). No hay otras dependencias de autenticación.
- El error handler centraliza el shape `{ code, message, details }`; `DominioError` vive hoy en `src/domain/turno/turno.errors.ts`.
- Las variables de entorno se cargan con `dotenv` solo en `src/main.ts`; los tests no cargan `.env`.

## Goals / Non-Goals

**Goals:**

- Autenticación por sesión de servidor con cookie, sin JWT ni servicios externos.
- Protección default-deny de todo `/api/*` con una allowlist mínima de rutas públicas.
- Autorización por rol y por pertenencia, con la política testeable sin levantar HTTP.
- Tipado estricto de `request.usuario`, sin `any` ni non-null assertions dispersas.
- Mantener intactas las reglas de agenda de C-03/C-04/C-05 y el CRUD de C-06 para usuarios autorizados.

**Non-Goals:**

- No se agrega JWT, OAuth, refresh tokens ni recuperación de contraseña.
- No se persisten sesiones ni usuarios (C-10); las sesiones viven en memoria y se pierden al reiniciar.
- No se implementa CRUD de usuarios, cambio de contraseña ni bloqueo por intentos fallidos.
- No se agrega rate limiting ni auditoría de accesos (C-12, C-17).
- No se implementa aislamiento por sucursal (C-18) ni UI.

## UI Mockups

Decision: no (no UI)

Proyecto API-only: este change no crea pantallas ni componentes visuales.

## Decisions

### 1. Hash de contraseñas con scrypt de `node:crypto`

- `hashPassword(password)` genera `salt` de 16 bytes con `randomBytes`, deriva 64 bytes con `scrypt` y devuelve `salt:hash` con ambos valores en base64url.
- `verifyPassword(password, almacenado)` separa exactamente dos partes, deriva de nuevo con el mismo salt y compara con `timingSafeEqual`; si el formato es inválido, las longitudes no coinciden o `scrypt` falla, devuelve `false` sin lanzar.
- Alternativas descartadas: `bcrypt`/`argon2` (dependencias nativas o binarios por plataforma, prohibido por el stack), SHA-256 simple (demasiado rápido y sin salt por diseño), guardar la contraseña en claro (inaceptable).
- El seed hashea `DEMO_PASSWORD` una sola vez y reutiliza el mismo hash en los tres usuarios demo. Es un atajo exclusivo de desarrollo; no se usa para usuarios reales. Alternativa descartada: un hash por usuario en el seed (triplica el costo de `scrypt` en cada `cargarSeed` de test sin aportar valor a datos ficticios).

### 2. Sesiones en memoria detrás de un puerto

- Nuevo puerto `SessionRepository` en `src/application/ports/session-repository.ts`:
  - `crear(usuarioId: string, ttlMs: number): Promise<Sesion>` con `{ token, usuarioId, expiresAt }`.
  - `buscar(token: string): Promise<Sesion | undefined>` descarta y elimina la sesión si `expiresAt <= ahora`.
  - `eliminar(token: string): Promise<void>`.
- `InMemorySessionRepository` usa `Map<token, Sesion>`; el token se genera con `randomBytes(32).toString("base64url")` (43 caracteres, opaco, sin datos del usuario).
- `Repositorios` pasa a incluir `sesiones: SessionRepository` y `usuarios` deja de ser opcional. Motivo: un único composition root, fixtures de test explícitas y posibilidad de inspeccionar/expirar sesiones en integración. Alternativa descartada: un contenedor de auth separado (dos bolsas de dependencias para el mismo servidor).
- El TTL se configura con `SESSION_TTL_MINUTES` (minutos, default 480) y se pasa a `buildServer` como opción `sessionTtlMs`. Si el valor es inválido o menor o igual a cero, se usa el default. Alternativa descartada: leer `process.env` dentro del caso de uso (dificulta tests y mezcla configuración con aplicación).

### 3. Cookie de sesión con `@fastify/cookie`

- `registrarAuthPlugin(app, deps)` registra `@fastify/cookie` en el root y agrega el hook directamente con `app.addHook("onRequest", ...)`. No se usa `app.register(pluginAuth)` porque la encapsulación de Fastify limitaría el hook a las rutas hijas del plugin y dejaría afuera a las rutas hermanas ya registradas en el root.
- Cookie `session`: `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, `secure: process.env.NODE_ENV === "production"`, `maxAge: ttlSegundos`.
- `buildServer` sigue siendo sincrónico: `app.register(cookie)` encola el plugin y Fastify lo resuelve en `ready()`/`inject()`/`listen()`.
- Alternativa descartada: `Authorization: Bearer` (requiere manejo manual del token en el cliente y no aporta al MVP); `secure: true` siempre (rompe desarrollo por HTTP).

### 4. Hook global con allowlist explícita

- El hook calcula el pathname desde `request.url` (sin query string) y normaliza la barra final.
- Rutas públicas: `GET /health` y `POST /api/auth/login`. Toda ruta cuyo path empiece con `/api/` exige sesión. Las rutas fuera de `/api/` no se interceptan (incluye el 404 por defecto).
- Si falta la cookie, el token no existe o la sesión expiró, lanza `NoAutenticadoError` (`401 NO_AUTENTICADO`). Si la sesión es válida, carga el usuario y adjunta `request.usuario`.
- El hook no consulta roles: la autorización es por ruta con `requireRole`.

### 5. `request.usuario` tipado con module augmentation

- Se declara `declare module "fastify" { interface FastifyRequest { usuario?: UsuarioAutenticado } }` en `src/http/plugins/auth.ts` (incluido por `tsconfig.include: ["src"]`).
- `UsuarioAutenticado = { id: string; email: string; rol: Rol; profesionalId?: string }`.
- Para evitar non-null assertions en cada handler se expone `usuarioAutenticado(request): UsuarioAutenticado`, que devuelve `request.usuario` o lanza `NoAutenticadoError` si falta (defensa en profundidad; el hook ya lo garantiza).
- Alternativa descartada: `any` o cast en cada ruta (rompe la regla dura de tipado estricto).

### 6. Errores de autenticación y mapeo HTTP

- Se extrae `DominioError` a `src/domain/errors/dominio-error.ts` y `turno.errors.ts` lo re-exporta para no romper imports existentes. Es un refactor sin cambio de comportamiento; evita que `usuario.errors.ts` dependa del dominio de turnos.
- `src/domain/usuario/usuario.errors.ts` define:
  - `CredencialesInvalidasError` → `401 CREDENCIALES_INVALIDAS`, mensaje único `"Email o contraseña incorrectos"`.
  - `NoAutenticadoError` → `401 NO_AUTENTICADO`.
  - `SinPermisoError` → `403 SIN_PERMISO`.
- `error-handler.ts` agrega ramas explícitas para estos tres errores antes de la rama genérica de `DominioError` (que mapea a `400`). Alternativa descartada: `reply.send` directo en hooks y rutas (duplica el shape y pierde centralización).
- Shape constante: `{ code, message, details }`; `details` vacío en los tres casos para no filtrar información.

### 7. `requireRole` como preHandler

- `requireRole(...roles: Rol[])` devuelve un `preHandlerHookHandler` que exige `request.usuario` (si falta, `401 NO_AUTENTICADO`) y valida pertenencia del rol (si no, `403 SIN_PERMISO`).
- Política aplicada en las rutas existentes:
  - Mutaciones de turnos (`POST /api/turnos`, `PATCH /api/turnos/:id/cancelar`): `administrador`, `recepcionista`.
  - Mutaciones de pacientes (`POST`, `PATCH`, `DELETE`): `administrador`, `recepcionista`.
  - Lecturas de turnos, pacientes, catálogos: cualquier rol autenticado, con scoping cuando corresponde.
- Alternativa descartada: matriz de permisos genérica por recurso/acción (sobredimensionada para tres roles y siete rutas; se puede introducir cuando C-17/C-18 la necesiten).

### 8. Scoping del profesional en turnos

- `GET /api/turnos`: si el usuario es `profesional`, se obtiene su `profesionalId`; si falta, `403 SIN_PERMISO`. El filtro `profesionalId` se fuerza al valor del usuario, ignorando cualquier `profesionalId` del query (no se devuelve error si pide otro: se acota silenciosamente).
- `GET /api/turnos/:id`: se busca el turno (404 si no existe) y luego se aplica `puedeVerTurno(usuario, turno)`; si no corresponde, `403 SIN_PERMISO`.
- `administrador` y `recepcionista` no tienen scoping.
- Alternativa descartada: filtrar dentro del repositorio (el dominio no debe conocer la sesión). Alternativa descartada: `404` para turnos ajenos (el contrato de autorización usa `403 SIN_PERMISO`; se documenta como supuesto).

### 9. Scoping del profesional en pacientes (relación derivada)

- No existe una relación directa paciente–profesional. La pertenencia se deriva de los turnos: un paciente es visible para el profesional si existe al menos un turno con su `profesionalId`, en cualquier estado (incluye cancelados y atendidos, para preservar continuidad histórica).
- `GET /api/pacientes`: se obtienen los `pacienteId` de `repos.turnos.listar({ profesionalId })`, se filtran los pacientes por esos ids y luego se aplica la búsqueda `q` existente.
- `GET /api/pacientes/:id`: se resuelve el paciente y se verifica pertenencia; si no está asociado, `403 SIN_PERMISO`.
- Se agrega `src/application/auth/politicas.ts` con funciones puras (`esProfesional`, `profesionalIdRequerido`, `puedeVerTurno`, `puedeVerPaciente`, `filtrarPacientesVisibles`) y tests unitarios sin HTTP.
- Alternativa descartada: agregar `profesionalId` al paciente (cambia el modelo de C-06 y duplica la fuente de verdad). Alternativa descartada: `404` para pacientes no asociados (misma razón que en turnos).

### 10. `createdBy` desde la sesión

- `src/http/routes/turnos.ts` pasa `creadoPor: usuarioAutenticado(request).id` a `CrearTurno`.
- No se modifica la firma de `CrearTurnoInput` ni la lógica de `CrearTurno` (solo cambia el origen del valor). El `SEED_IDS.recepcion` deja de usarse en la ruta.
- Alternativa descartada: derivar `createdBy` dentro del caso de uso desde un contexto de request (acopla aplicación a HTTP).

### 11. Login, logout y me

- `Login.execute({ email, password })`: normaliza `email` con `trim().toLowerCase()`, busca con `UsuarioRepository.buscarPorEmail` (nuevo método, comparación case-insensitive), exige `activo`, verifica password y crea la sesión con el TTL configurado. Cualquier fallo lanza `CredencialesInvalidasError` con el mismo mensaje.
- `Logout.execute(token)`: elimina la sesión si existe; es idempotente. La ruta responde `204` y borra la cookie con `reply.clearCookie("session", { path: "/" })`.
- `ObtenerSesion.execute(token)`: devuelve el usuario o lanza `NoAutenticadoError`; también rechaza usuarios desactivados después del login.
- `toUsuarioPublico(usuario)` devuelve `{ id, email, nombre, apellido, rol }`; nunca `passwordHash`, `activo` ni `profesionalId`. Se usa en login y en `/me` para no filtrar datos internos.
- Schema Zod `loginSchema`: `email` con `z.string().email()` y `password` con `z.string().min(1)`; un body inválido responde `400 VALIDACION_FALLIDA` como el resto de la API.
- Alternativa descartada: devolver el usuario completo sin `passwordHash` con `Omit` (frágil ante nuevos campos sensibles).

### 12. Seed de desarrollo

- `cargarSeed` calcula `await hashPassword(process.env.DEMO_PASSWORD ?? "demo1234")` una vez y asigna el mismo valor a los tres usuarios demo.
- `odonto1@demo.local` recibe `profesionalId: SEED_IDS.profesional1`.
- Se elimina `PASSWORD_HASH_PLACEHOLDER`; `tests/unit/infrastructure/seed.test.ts` se actualiza para verificar que el hash no es el password en claro y que `verifyPassword` acepta `DEMO_PASSWORD`.
- Documentación en el propio archivo: credenciales exclusivas de desarrollo, datos ficticios (RN-SE-01, RN-SE-02).
- `src/main.ts` sigue cargando `dotenv` antes de `cargarSeed`; `.env.example` agrega `SESSION_TTL_MINUTES=480` y `DEMO_PASSWORD=demo1234`.

## Risks / Trade-offs

- [Sesiones en memoria se pierden al reiniciar] → Aceptado en v0.1; C-10 puede persistirlas detrás del mismo puerto `SessionRepository`.
- [`scrypt` agrega latencia al seed en cada suite de tests] → Se hashea una sola vez por `cargarSeed`; los tests comparten un único password demo. Si molesta, se puede bajar el costo solo en tests vía variable, pero no se hace ahora para no debilitar la verificación.
- [El scoping devuelve `403` y revela que el recurso existe] → Aceptado para una API interna; se documenta como supuesto. Si el producto se expone públicamente, evaluar `404`.
- [Cookie `secure` solo en producción] → En desarrollo no viaja por HTTPS; el deploy real debe terminar TLS antes de la API. Documentado en `.env.example` y en este diseño.
- [Un cambio de orden en `buildServer` podría dejar rutas fuera del hook] → El plugin se registra antes de todas las rutas y un test de integración recorre las rutas privadas verificando `401`; además la allowlist es default-deny para `/api/*`.
- [Acoplamiento del seed a `application/auth/password`] → Es código de infraestructura de desarrollo; se acepta para no duplicar criptografía. Alternativa descartada: mover `hashPassword` a `infrastructure` (el caso de uso de login también lo necesita).
- [Actualizar todos los tests de integración existentes] → Se hace con un helper de login real (`tests/helpers/auth.ts`), no con bypass de autenticación, para que los tests sigan probando el camino productivo.
- [Contraseña demo conocida] → Solo existe en desarrollo y en datos ficticios; producción debe definir `DEMO_PASSWORD` fuera del repositorio o no cargar el seed.

## Migration Plan

1. Cambio de rama `feat/c-09-auth-rbac` (ya creada junto con C-07/C-08).
2. No hay migración de datos: la persistencia y las sesiones son en memoria.
3. Actualizar `.env.example`; los entornos locales que ya tengan `.env` pueden omitir las variables nuevas y usarán los defaults (`480` minutos, `demo1234`).
4. Despliegue atómico: al mergear, toda la API pasa a exigir sesión. No hay período de convivencia sin autenticación.
5. Rollback: revertir el merge; no quedan datos persistidos que limpiar (las sesiones mueren con el proceso).
6. Verificación previa al PR: `npm run typecheck && npm test`.

## Open Questions

No hay preguntas bloqueantes. Supuestos registrados para revisión:

- Un recurso ajeno (turno o paciente) responde `403 SIN_PERMISO` en lugar de `404` para mantener un único contrato de autorización.
- La asociación paciente–profesional incluye turnos en cualquier estado, incluso cancelados.
- El email de login se compara sin distinguir mayúsculas y se recorta.
- `profesionalId` no se expone en el DTO público de usuario; si un cliente lo necesita, se agrega en un change posterior.
- `/health` y `POST /api/auth/login` son las únicas rutas públicas en este change; las rutas públicas de reserva quedan para C-12.
