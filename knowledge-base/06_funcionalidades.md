# Funcionalidades

Organizadas por épica y por historia de usuario (`US-NNN`). Las historias marcadas **[MVP]** son obligatorias para el primer change. Los criterios de aceptación se verifican con tests automatizados.

## Épica 1: Agenda y turnos

### US-001 — Crear un turno [MVP]
**Como** recepcionista
**Quiero** crear un turno indicando paciente, profesional, sillón, prestación y horario
**Para** reservar el tiempo del profesional y del sillón sin errores.

**Criterios de aceptación**:
- [ ] CA-1: con datos válidos y horario libre, el turno se crea en estado `pendiente` y devuelve `201` con su `id`.
- [ ] CA-2: `fin` se calcula como `inicio + duracionMinutos` de la prestación.
- [ ] CA-3: el turno registra `createdBy`, `createdAt` y `updatedAt`.
- [ ] CA-4: si falta un campo obligatorio, devuelve `400` con el detalle del campo.
- [ ] CA-5: si el paciente, profesional, sillón o prestación no existe, devuelve `404` con código estable.

**Reglas relacionadas**: RN-AG-02, RN-AG-03, RN-AG-08, RN-AG-09, RN-TU-02, RN-TU-03.

### US-002 — Rechazar solapamiento de profesional [MVP]
**Como** recepcionista
**Quiero** que el sistema rechace un turno que se superpone con otro del mismo profesional
**Para** no asignar dos pacientes al mismo odontólogo a la misma hora.

**Criterios de aceptación**:
- [ ] CA-1: si existe un turno `pendiente` o `confirmado` del mismo profesional que se superpone, devuelve `409` con `TURNO_SOLAPADO_PROFESIONAL`.
- [ ] CA-2: la respuesta identifica el turno en conflicto (`id`, `inicio`, `fin`).
- [ ] CA-3: no se persiste ningún turno nuevo.
- [ ] CA-4: un turno `cancelado` del mismo profesional no genera conflicto.

**Reglas relacionadas**: RN-AG-01, RN-AG-04, RN-AG-06, RN-AG-07.

### US-003 — Rechazar solapamiento de sillón [MVP]
**Como** recepcionista
**Quiero** que el sistema rechace un turno que se superpone con otro del mismo sillón
**Para** no asignar dos pacientes al mismo box.

**Criterios de aceptación**:
- [ ] CA-1: si existe un turno activo del mismo sillón que se superpone, devuelve `409` con `TURNO_SOLAPADO_SILLON`.
- [ ] CA-2: un profesional distinto en un sillón libre sí puede atenderse en paralelo.
- [ ] CA-3: la respuesta identifica el turno en conflicto.

**Reglas relacionadas**: RN-AG-01, RN-AG-05, RN-AG-06.

### US-004 — Permitir turnos contiguos [MVP]
**Como** recepcionista
**Quiero** crear un turno que empieza exactamente cuando termina otro
**Para** aprovechar la agenda sin huecos artificiales.

**Criterios de aceptación**:
- [ ] CA-1: un turno de 09:00 a 09:30 y otro de 09:30 a 10:00 del mismo profesional y sillón se crean sin error.
- [ ] CA-2: el caso se cubre con un test de borde explícito.

**Reglas relacionadas**: RN-AG-01.

### US-005 — Consultar agenda diaria y semanal [MVP]
**Como** profesional o recepcionista
**Quiero** ver los turnos de un rango por profesional y por sillón
**Para** organizar el día y detectar huecos.

**Criterios de aceptación**:
- [ ] CA-1: `GET /api/turnos?desde=...&hasta=...` devuelve solo turnos activos del rango.
- [ ] CA-2: se puede filtrar por `profesionalId` y por `sillonId`.
- [ ] CA-3: los turnos se ordenan por `inicio` ascendente.
- [ ] CA-4: la respuesta incluye datos mínimos del paciente y de la prestación.

**Reglas relacionadas**: RN-AG-10, RN-AG-14.

### US-006 — Cancelar un turno [MVP]
**Como** recepcionista
**Quiero** cancelar un turno
**Para** liberar el horario del profesional y del sillón.

**Criterios de aceptación**:
- [ ] CA-1: el estado pasa a `cancelado` y se registra `cancelledAt`.
- [ ] CA-2: después de cancelar, se puede crear otro turno en el mismo horario.
- [ ] CA-3: cancelar un turno ya cancelado es idempotente y no devuelve error 500.
- [ ] CA-4: un turno `atendido` no puede cancelarse (`409`).

**Reglas relacionadas**: RN-AG-06, RN-AG-07, RN-TU-01, RN-EX-03.

### US-007 — Bloqueos de agenda
**Como** profesional
**Quiero** bloquear un rango de mi agenda o de un sillón
**Para** reservar tiempo para cirugías, reuniones o mantenimiento.

**Criterios de aceptación**:
- [ ] CA-1: un turno que se superpone con un bloqueo se rechaza con `TURNO_BLOQUEADO`.
- [ ] CA-2: un Administrador puede autorizar una excepción explícita.

**Reglas relacionadas**: RN-AG-11.

### US-008 — Sobreturnos
**Como** recepcionista autorizada
**Quiero** registrar un sobreturno
**Para** atender una urgencia sin violar la regla del sillón.

**Criterios de aceptación**:
- [ ] CA-1: el sobreturno puede superponerse con otro turno del mismo profesional.
- [ ] CA-2: el sobreturno nunca puede superponerse con otro turno del mismo sillón.
- [ ] CA-3: sin rol autorizado se rechaza con `403`.

**Reglas relacionadas**: RN-AG-12.

## Épica 2: Pacientes

### US-010 — Alta de paciente [MVP]
**Como** recepcionista
**Quiero** registrar un paciente con nombre, apellido y datos de contacto
**Para** poder asignarle turnos.

**Criterios de aceptación**:
- [ ] CA-1: nombre y apellido son obligatorios.
- [ ] CA-2: email o documento duplicado en un paciente activo devuelve `409`.
- [ ] CA-3: el paciente se crea activo por defecto.

**Reglas relacionadas**: RN-PA-01, RN-PA-03.

### US-011 — Búsqueda de pacientes [MVP]
**Como** recepcionista
**Quiero** buscar por apellido, nombre, teléfono o documento
**Para** encontrar rápido al paciente durante la atención.

**Criterios de aceptación**:
- [ ] CA-1: la búsqueda es parcial y no distingue mayúsculas.
- [ ] CA-2: devuelve solo pacientes activos por defecto.

**Reglas relacionadas**: RN-PA-02.

### US-012 — Baja lógica de paciente [MVP]
**Como** administrador
**Quiero** desactivar un paciente
**Para** evitar turnos nuevos sin perder el historial.

**Criterios de aceptación**:
- [ ] CA-1: el paciente queda con `activo = false`.
- [ ] CA-2: crear un turno para un paciente inactivo devuelve `409`.
- [ ] CA-3: los turnos históricos siguen consultables.

**Reglas relacionadas**: RN-PA-02, RN-TU-05.

## Épica 3: Automatización y reserva online (etapa posterior)

### US-020 — Recordatorios por WhatsApp
**Como** recepcionista
**Quiero** enviar recordatorios automáticos
**Para** reducir ausencias.

**Criterios de aceptación**:
- [ ] CA-1: se envía 24 h y 2 h antes del turno.
- [ ] CA-2: el envío queda auditado.

**Reglas relacionadas**: RN-AD-02.

### US-021 — Reserva online 24/7
**Como** paciente
**Quiero** ver disponibilidad y reservar por internet
**Para** no depender del horario de atención telefónica.

**Criterios de aceptación**:
- [ ] CA-1: solo muestra huecos disponibles según RN-AG-04 y RN-AG-05.
- [ ] CA-2: la reserva queda `pendiente` hasta confirmación.

### US-022 — Seña con Mercado Pago
**Como** paciente
**Quiero** pagar una seña al reservar
**Para** asegurar el turno.

**Criterios de aceptación**:
- [ ] CA-1: el turno se confirma solo con pago acreditado.

## Épica 4: Administración (etapa posterior)

### US-030 — Roles y permisos
**Criterios de aceptación**:
- [ ] CA-1: se aplica la matriz RBAC de `03_actores_y_roles.md`.

### US-031 — Facturación ARCA
**Criterios de aceptación**:
- [ ] CA-1: la emisión es explícita; no se simula una integración inexistente.

### US-032 — Obras sociales y liquidaciones
**Criterios de aceptación**:
- [ ] CA-1: cada prestación registra obra social, coseguro y estado de liquidación.

### US-033 — Multi-sucursal
**Criterios de aceptación**:
- [ ] CA-1: agenda y sillones se filtran por sucursal.

## Épica 5: Clínica (etapa posterior)

### US-040 — Historia clínica y odontograma
**Criterios de aceptación**:
- [ ] CA-1: acceso restringido y auditado (dato sensible).
