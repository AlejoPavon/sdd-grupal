# Design

## Context

Ver `proposal.md` para la motivación. Estado relevante al aplicar este change en la rama `feat/c-09-c-07-c-08-seguridad-agenda`:

- C-03 (`CrearTurno`), C-04 (consultas) y C-05 (cancelación) están implementados: `CrearTurno.execute` valida recursos, calcula `fin` desde la prestación y evalúa solapamientos por profesional y por sillón antes de persistir.
- C-09 `auth-rbac` se aplica **primero en esta misma rama**: aporta el hook global, `request.usuario`, `requireRole`, `usuarioAutenticado(request)` y `SIN_PERMISO`. Este change se apoya en ese contrato; no crea otra rama ni otro mecanismo de autorización.
- `Turno` ya incluye `esSobreturno: boolean` y `autorizadoPor?: string` (C-02/C-03); este change usa `autorizadoPor` para la excepción `forzar`. C-08 `sobreturnos` se aplica **después**, también en esta rama, y reutiliza el mismo campo.
- `Repositorios` es la bolsa de dependencias de `buildServer`; los repositorios son en memoria y las fixtures de test la construyen explícitamente.
- `Intervalo` (en `src/domain/turno/intervalo.ts`) ya modela `[inicio, fin)` con `seSuperponeCon`; los rangos se expresan como ISO 8601 UTC.
- El error handler centraliza `{ code, message, details }` y los errores de negocio tienen códigos estables. No hay frontend.

## Goals / Non-Goals

**Goals:**

- Modelar el bloqueo como entidad de dominio independiente del turno, con validaciones propias y repositorio detrás de un puerto.
- Impedir la creación de turnos que intersecten bloqueos vigentes del profesional o del sillón, con una precedencia determinista de validaciones.
- Permitir una excepción `forzar` exclusiva de `administrador`, grabando quién la autorizó.
- Mantener la API sin frontend y sin servicios externos; exponer bloqueos con los mismos códigos de error y shape que el resto de la API.

**Non-Goals:**

- No implementar sobreturnos (C-08), disponibilidad calculada (C-11), reserva online (C-12) ni persistencia SQLite (C-10).
- No bloquear automáticamente por ausentismo, inasistencia ni RN-AG-12.
- No editar turnos existentes ni cancelar turnos al crear un bloqueo: el bloqueo solo afecta turnos nuevos.
- No agregar UI, notificaciones ni auditoría persistente más allá de `creadoPor`/`autorizadoPor`.

## UI Mockups

Decision: no (no UI)

Proyecto API-only: este change no crea pantallas ni componentes visuales.

## Decisions

### 1. Entidad `Bloqueo` con validación en el dominio

- `Bloqueo` expone `id`, `profesionalId?`, `sillonId?`, `inicio`, `fin`, `motivo`, `creadoPor`, `createdAt`; al menos un recurso debe estar presente y `fin > inicio`, usando intervalos semiabiertos `[inicio, fin)`.
- La validación de intervalo se implementa con `Intervalo` (o lógica equivalente reutilizable) en `src/domain/bloqueo/bloqueo.ts`; los errores `BLOQUEO_INTERVALO_INVALIDO` y `BLOQUEO_RECURSO_REQUERIDO` viven en `src/domain/bloqueo/bloqueo.errors.ts` y se mapean a `400`.
- Alternativa descartada: representar el bloqueo como un `Turno` ficticio en estado especial (ensucia la agenda, require excluirlo de consultas y rompe las reglas de solapamiento de C-03).

### 2. Repositorio de bloqueos detrás de un puerto

- `BloqueoRepository` define `crear`, `buscarPorId`, `listarPorRango`, `buscarSolapadosPorProfesional`, `buscarSolapadosPorSillon` y `eliminar`.
- `InMemoryBloqueoRepository` usa la misma estrategia que los repositorios existentes; se agrega como `Repositorios.bloqueos` en `buildServer` y en `main.ts`, y se incluye en todas las fixtures de test.
- Alternativa descartada: consultar bloqueos desde `TurnoRepository` (acopla dos agregados y obliga a guardar bloqueos como turnos).

### 3. Casos de uso separados y delgados

- `CrearBloqueo` valida recurso e intervalo en el dominio, verifica existencia/estado de profesional y sillón reutilizando los errores de turnos, y asigna `id` UUID, `creadoPor` (sesión) y `createdAt`.
- `ListarBloqueos` aplica el rango opcional con intersección semiabierta y ordena por `inicio` ascendente; `EliminarBloqueo` hace borrado físico y lanza `BLOQUEO_NO_ENCONTRADO` (`404`) si el id no existe.
- La existencia/estado de recursos se comprueba antes de persistir para no dejar bloqueos huérfanos; se reutilizan `PROFESIONAL_NO_ENCONTRADO`, `SILLON_NO_ENCONTRADO` y `RECURSO_INACTIVO` en lugar de nuevos códigos.
- Alternativa descartada: hacer estas validaciones dentro del adaptador HTTP (rompe la regla de que las reglas de negocio viven en dominio/aplicación).

### 4. Capa HTTP y autorización reutilizando C-09

- `src/http/schemas/bloqueo.schema.ts` valida el body con Zod (`profesionalId`/`sillonId` UUID opcionales, `inicio`/`fin` ISO 8601, `motivo` no vacío) y el query de `GET` (`desde`, `hasta` opcionales); los errores de Zod siguen mapeando a `VALIDACION_FALLIDA` con detalle por campo.
- `src/http/routes/bloqueos.ts` registra `POST` y `GET` con `requireRole("administrador", "recepcionista")` y `DELETE` con `requireRole("administrador")`, usando `usuarioAutenticado(request).id` como `creadoPor`. `RANGO_INVALIDO` se decide en aplicación con el mismo criterio que el resto de la API.
- La ruta se registra en `buildServer` después del plugin de autenticación de C-09; la allowlist de C-09 no se modifica, por lo que `/api/bloqueos` queda protegido por defecto.
- Alternativa descartada: definir un middleware de roles local para bloqueos (duplica `requireRole` y permite divergencias de política).

### 5. Integración con `CrearTurno` y precedencia

- `CrearTurnoInput` incorpora `forzar?: boolean` y `autorizadoPor?: string`; el caso de uso mantiene el orden: existencia y estado de recursos → solapamiento profesional → solapamiento sillón → bloqueo profesional → bloqueo sillón → persistencia.
- Un conflicto de bloqueo lanza `TurnoBloqueadoError` (`409 TURNO_BLOQUEADO`) con `details.bloqueo = { id, inicio, fin }`; el primer conflicto encontrado determina la respuesta y no se persiste el turno.
- La comparación usa intervalos semiabiertos, por lo que un turno que empieza al terminar un bloqueo (o termina al empezar) es válido.
- Alternativa descartada: evaluar bloqueos antes que solapamientos (cambiaría la precedencia ya documentada de C-03 y la respuesta esperada cuando ambos existen).

### 6. Excepción `forzar` con auditoría en la ruta

- `forzar: true` se acepta en el schema de `POST /api/turnos`; la ruta verifica que `request.usuario.rol === "administrador"` antes de invocar al caso de uso y responde `403 SIN_PERMISO` en caso contrario, incluso si no hay bloqueo en conflicto.
- El caso de uso omite los bloqueos (profesional y sillón) solo cuando `forzar` es `true` y graba `autorizadoPor` con el id del administrador únicamente si se evitó al menos un bloqueo; sin conflicto, el campo queda ausente.
- `forzar` **no** omite solapamientos con turnos: siguen vigentes `TURNO_SOLAPADO_PROFESIONAL` y `TURNO_SOLAPADO_SILLON`.
- Alternativa descartada: confiar solo en el body para decidir quién autoriza (permitiría suplantar el id del administrador). El id siempre viene de la sesión.

### 7. Prioridad de Administrador sobre Recepcionista en la creación de bloqueos

- US-007 menciona al profesional como actor, pero la matriz RBAC de `knowledge-base/03_actores_y_roles.md` reserva la gestión de agenda a Administrador y Recepcionista; se sigue la matriz y se documenta la diferencia como supuesto.
- Alternativa descartada: permitir al profesional crear bloqueos (contradice el contrato de C-09 y el proposal de este change).

## Risks / Trade-offs

- [US-007 nombra al profesional como actor] → Se aplica la matriz RBAC (Admin/Recepcionista crean y consultan; solo Admin elimina) y se registra como supuesto.
- [La concurrencia en repositorios en memoria no es atómica] → Aceptado en v0.1; dos requests simultáneos podrían crear turnos/bloqueos solapados. C-10 puede revisarlo con persistencia real.
- [Los bloqueos no cancelan turnos ya creados] → Aceptado: el bloqueo solo aplica a turnos nuevos; se documenta para C-11.
- [El borrado físico pierde trazabilidad del bloqueo] → Aceptado en v0.1; el contrato pide `204` y desaparición de consultas, no auditoría histórica.
- [C-08 se aplica después en la misma rama] → Los tests de turnos de este change se escriben sin `esSobreturno` y se amplían en C-08; la precedencia queda centralizada en `CrearTurno` para evitar divergencias.
- [Los tests HTTP dependen de C-09] → Se usa el helper de login real creado en C-09; no se agrega un bypass de autenticación.

## Migration Plan

1. Aplicar primero C-09 `auth-rbac` en esta rama y verificar `npm run typecheck && npm test`.
2. Aplicar este change sobre ese estado: dominio, puerto/repositorio, casos de uso, ruta HTTP y ajustes de `CrearTurno`.
3. No hay migración de datos: la persistencia es en memoria; basta con reconstruir `Repositorios` (incluye `bloqueos`) en `buildServer`, `main.ts` y fixtures de test.
4. Actualizar las fixtures existentes de `Repositorios` y los tests de `CrearTurno` antes de correr la suite completa.
5. Despliegue atómico: al mergear, los clientes deben enviar la cookie de sesión (C-09) y pueden empezar a enviar `forzar` solo si son administradores.
6. Rollback: revertir los commits de este change; no quedan datos que limpiar. C-08 debe revertirse junto con este si ya se aplicó.

## Open Questions

No hay preguntas bloqueantes. Supuestos registrados para revisión:

- La gestión de bloqueos queda limitada a Administrador y Recepcionista pese a que US-007 menciona al profesional.
- El borrado de un bloqueo es físico, sin conservar un registro histórico.
- `forzarAutorizadoPor` solo se registra cuando la excepción evitó al menos un bloqueo.
- El idioma del change es español; los headings OpenSpec y los términos SHALL/MUST se conservan en inglés.
