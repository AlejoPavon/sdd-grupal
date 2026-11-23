# Design

## Context

Ver `proposal.md` para la motivación y los deltas en `specs/turnos/spec.md` para el comportamiento observable. Estado al aplicar este change:

- La rama `feat/c-09-c-07-c-08-seguridad-agenda` aplica los changes en orden **C-09 `auth-rbac` → C-07 `bloqueos-agenda` → C-08 `sobreturnos`**. No hay branches separadas ni rebase de por medio.
- C-09 aporta el hook global, `request.usuario`, `usuarioAutenticado(request)`, `requireRole` y `SIN_PERMISO`; la ruta `POST /api/turnos` ya exige `administrador` o `recepcionista` y toma `createdBy` de la sesión.
- C-07 aporta `Repositorios.bloqueos`, `TURNO_BLOQUEADO` con `details.bloqueo`, el flag `forzar` (exclusivo de administrador), `autorizadoPor` y la precedencia: recursos → solapamiento profesional → solapamiento sillón → bloqueo profesional → bloqueo sillón.
- `Turno` ya tiene `esSobreturno: boolean` (hoy siempre `false`, asignado en `CrearTurno`) y `autorizadoPor?: string`; no hace falta cambiar el modelo de dominio.
- `crearTurnoSchema` valida el body con Zod y `CrearTurno.execute` concentra todas las reglas de agenda; las consultas de agenda solo filtran por estado activo y no necesitan distinción de sobreturnos en este change.
- La API es JSON/Fastify con persistencia en memoria y tests Vitest (`npm test`, `npm run typecheck`, `npm run lint`).

## Goals / Non-Goals

**Goals:**

- Permitir sobreturnos con una sola flag opcional en el body, sin nuevo endpoint.
- Mantener el sillón como recurso no negociable: solapamiento y bloqueo de sillón siempre se validan.
- Conservar la precedencia de C-07 y la excepción `forzar` sin duplicar reglas.
- Registrar al usuario que autoriza desde la sesión, con tests unitarios y HTTP que cubran los límites de la excepción.

**Non-Goals:**

- No cambiar el modelo `Turno`, las consultas de agenda ni la cancelación.
- No relajar la validación de recursos (paciente, profesional, sillón, prestación, activo/estado).
- No permitir que `forzar` o `esSobreturno` se usen para saltar solapamientos de sillón.
- No agregar UI, notificaciones, cupos máximos de sobreturnos ni persistencia nueva.

## UI Mockups

Decision: no (no UI)

Proyecto API-only: este change no crea pantallas ni componentes visuales.

## Decisions

### 1. Flag opcional en el schema HTTP, sin nuevo endpoint

- `crearTurnoSchema` agrega `esSobreturno: z.boolean().optional()`. Un valor ausente o `false` conserva el comportamiento de C-07; un valor no booleano responde `400 VALIDACION_FALLIDA` con `details` sobre el campo.
- La ruta pasa el flag al caso de uso junto con `creadoPor` y `autorizadoPor`, ambos tomados de `usuarioAutenticado(request)`.
- Alternativa descartada: un endpoint `POST /api/turnos/sobreturno` (duplica validación, routing y DTO para una sola diferencia de comportamiento).

### 2. Autorización reutilizando la política de C-09

- `POST /api/turnos` ya lleva `requireRole("administrador", "recepcionista")` desde C-09, que responde `403 SIN_PERMISO` a un `profesional`. Esa es también la política de sobreturnos; no se agrega un guard dinámico que lea el flag ni una nueva rama de errores.
- Se documenta y se testea explícitamente que un profesional con `esSobreturno: true` recibe `403 SIN_PERMISO` y no persiste turnos. Si mañana cambia la política de mutación de turnos, el cambio se hace en un solo lugar.
- Alternativa descartada: un `preHandler` específico que inspeccione el body (duplica la lista de roles y puede divergir de C-09/C-07).

### 3. Omisiones en el caso de uso, con precedencia centralizada

- `CrearTurnoInput` incorpora `esSobreturno?: boolean` (además de `forzar?` y `autorizadoPor?` de C-07). El caso de uso es transport-agnóstico: recibe el flag ya validado y el id del usuario autenticado.
- Con `esSobreturno: true` se omiten **solo** `TURNO_SOLAPADO_PROFESIONAL` y `TURNO_BLOQUEADO` del profesional. Siguen activos `TURNO_SOLAPADO_SILLON` y `TURNO_BLOQUEADO` del sillón.
- Se conserva el orden de C-07: existencia/estado de recursos → solapamiento profesional (omitido en sobreturno) → solapamiento sillón → bloqueo profesional (omitido en sobreturno o con `forzar`) → bloqueo sillón (omitido solo con `forzar`) → persistencia.
- El intervalo sigue siendo semiabierto `[inicio, fin)`; un sobreturno contiguo a un turno o bloqueo no genera conflicto.
- Alternativa descartada: mover las omisiones a la ruta HTTP (el dominio dejaría de ser la fuente de verdad de las reglas de agenda y los tests unitarios no podrían cubrirlas).

### 4. Auditoría desde la sesión

- Todo turno con `esSobreturno: true` persiste `autorizadoPor` con el id del usuario de la sesión, incluso si no había solapamiento o bloqueo que evitar; es la evidencia de que se usó la excepción.
- Con `forzar: true`, C-07 sigue registrando `autorizadoPor` solo si se evitó al menos un bloqueo. Si ambas flags están presentes, el valor es el mismo id de sesión y no se duplica lógica.
- El body del cliente no puede establecer `autorizadoPor`: el schema no lo acepta y la ruta siempre lo sobrescribe con la sesión.
- Alternativa descartada: registrar `autorizadoPor` solo ante un conflicto real (dificulta auditar el uso de la flag y contradice el contrato de este change).

### 5. Interacción con `forzar`

- Ambas flags pueden enviarse juntas. `forzar` continúa disponible solo para `administrador`; si un `recepcionista` lo envía, C-07 responde `403 SIN_PERMISO` antes de crear el turno.
- `forzar` no elimina el solapamiento de sillón: con `esSobreturno: true` y `forzar: true`, un sillón ocupado responde `TURNO_SOLAPADO_SILLON`. `forzar` sí puede omitir el bloqueo del sillón, como en C-07.
- Alternativa descartada: tratar `forzar` como "saltar todo" (rompería la regla dura de no solapar sillones y el contrato de C-07).

### 6. Delta de specs sin `Purpose`

- `turnos` es una capability existente (`openspec/specs/turnos/spec.md`); el delta modifica sus requirements y agrega otros nuevos, por lo que no lleva `## Purpose`. Los `MODIFIED Requirements` conservan el texto completo de los requirements originales.

## Risks / Trade-offs

- [Un sobreturno reduce la seguridad del solapamiento profesional] → Mitigado con rol restringido de C-09, `autorizadoPor` obligatorio y tests de rechazo para profesional.
- [El sillón es el recurso físico limitante] → Mitigado manteniendo `TURNO_SOLAPADO_SILLON` y `TURNO_BLOQUEADO` del sillón aun con ambas flags.
- [Combinar flags puede relajar demasiadas validaciones] → Mitigado centralizando la precedencia en `CrearTurno` y cubriendo la combinación con tests unitarios e HTTP.
- [Los tests existentes esperan `esSobreturno: false` siempre] → Mitigado actualizando `tests/unit/application/crear-turno.test.ts`, `tests/integration/turnos.test.ts` y las fixtures de `Repositorios` con bloqueos y sesiones de C-07/C-09.
- [La auditoría vive solo en memoria] → Aceptado en v0.1; C-10 puede persistirla sin cambiar el contrato del turno.

## Migration Plan

1. Verificar que C-09 y C-07 están aplicados en esta rama y que `npm run typecheck && npm test` pasan.
2. Aplicar este change: schema, ruta, caso de uso y tests; no hay cambios de modelo ni de datos.
3. No hay migración de datos: la persistencia es en memoria; basta con ejecutar la suite con las fixtures actualizadas.
4. Despliegue atómico: los clientes pueden empezar a enviar `esSobreturno`; las requests existentes sin el flag no cambian de comportamiento.
5. Rollback: revertir solo este change; C-07 (`forzar`) y C-09 (auth) permanecen intactos.

## Open Questions

No hay preguntas bloqueantes. Supuestos registrados para revisión:

- La autorización de sobreturnos se resume en la política de C-09 para todas las mutaciones de turnos; no se agrega una lista de roles específica para el flag.
- `autorizadoPor` se registra siempre que `esSobreturno: true`, aunque no existiera conflicto previo.
- Los sobreturnos se contabilizan como turnos activos en las consultas de agenda, igual que cualquier turno `pendiente` o `confirmado`.
- No se limita la cantidad de sobreturnos por profesional ni por día en v0.1.
