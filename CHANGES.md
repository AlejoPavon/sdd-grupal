# CHANGES — Secuencia de Implementación

> Índice canónico de todos los changes del proyecto **Turnos Odontología**.
> Cada change es atómico: un agente puede implementarlo en una sesión (~4-6 horas).
> **Leer este archivo antes de empezar un item.**

---

## Cómo usar este documento

1. Identificar el item a implementar y verificar que sus dependencias figuran completas en este roadmap.
2. Leer los docs de la knowledge-base indicados en "Leer antes".
3. Acordar el alcance y los criterios de aceptación del item.
4. Implementar, verificar los criterios acordados y registrar la evidencia.
5. Marcar el checkbox `[x]` en este archivo al completar la verificación técnica.

Conservá los IDs de las fichas al editar o reordenar. Este proyecto no usa ClickUp:
el estado operativo vive en este archivo y en `.active-stack/roadmap.json`.

---

## Árbol de dependencias

```
C-01 foundation-setup
  └── C-02 core-domain-models
        ├── C-03 turno-creation
        │     ├── C-04 agenda-queries
        │     ├── C-05 turno-cancellation
        │     └── C-07 bloqueos-agenda
        │           └── C-08 sobreturnos
        ├── C-06 pacientes-crud
        └── C-09 auth-rbac

C-03 + C-05 + C-06
  └── C-10 sqlite-persistence
        ├── C-11 disponibilidad            ← + C-04 + C-07
        │     └── C-12 reserva-online      ← + C-09
        │           ├── C-13 recordatorios-whatsapp
        │           └── C-14 pagos-sena
        ├── C-18 multi-sucursal            ← + C-09
        └── C-19 reportes-analitica

C-05 + C-06 + C-09
  └── C-15 facturacion-arca
        └── C-16 obras-sociales-liquidaciones

C-06 + C-09
  └── C-17 historia-clinica
```

### Paralelismo por fase

> Cada "gate" es un punto de sincronización. Los changes dentro de un grupo pueden ejecutarse en paralelo.

```
GATE 0: ninguna
  → C-01 (solo)

GATE 1: C-01 ✓
  → C-02 (solo)

GATE 2: C-02 ✓                     ← PRIMER FORK (3 paralelos)
  → C-03 turno-creation            [Agente A]
  → C-06 pacientes-crud            [Agente B]
  → C-09 auth-rbac                 [Agente C]

GATE 3: C-03 ✓                     ← FORK (3 paralelos)
  → C-04 agenda-queries            [Agente A]
  → C-05 turno-cancellation        [Agente B]
  → C-07 bloqueos-agenda           [Agente C]

GATE 4: C-03 + C-05 + C-06 ✓
  → C-10 sqlite-persistence        [Agente A]

GATE 5: C-07 ✓
  → C-08 sobreturnos               [Agente C]

GATE 6: C-04 + C-07 + C-10 ✓       ← FORK (3 paralelos)
  → C-11 disponibilidad            [Agente A]
  → C-15 facturacion-arca          [Agente B — si C-05 + C-06 + C-09 ✓]
  → C-17 historia-clinica          [Agente C — si C-06 + C-09 ✓]

GATE 7: C-11 ✓ (+ C-09 ✓)
  → C-12 reserva-online            [Agente A]

GATE 8: C-12 ✓                     ← FORK (2 paralelos)
  → C-13 recordatorios-whatsapp    [Agente A]
  → C-14 pagos-sena                [Agente B]

GATE 9: C-15 ✓
  → C-16 obras-sociales-liquidaciones [Agente B]

GATE 10: C-10 ✓ + C-09 ✓           ← FORK (2 paralelos)
  → C-18 multi-sucursal            [Agente C]
  → C-19 reportes-analitica        [Agente B]
```

### Camino crítico (7 changes — mínimo irreducible para el MVP)

```
C-01 → C-02 → C-03 → C-05 → C-10 → C-11 → C-12
```

> C-13 (recordatorios) extiende el camino a 8 si se considera parte del lanzamiento.
> C-04, C-06, C-07, C-08 y C-09 son ramas paralelas que no alargan la cadena.

### Plan óptimo con 3 agentes

```
Paso │ Agente A (Dominio/API)      │ Agente B (Datos/Pacientes)  │ Agente C (Seguridad/Reglas)
─────┼──────────────────────────────┼─────────────────────────────┼──────────────────────────────
  1  │ C-01 foundation-setup        │ —                           │ —
  2  │ C-02 core-domain-models      │ —                           │ —
  3  │ C-03 turno-creation          │ C-06 pacientes-crud         │ C-09 auth-rbac
  4  │ C-04 agenda-queries          │ C-05 turno-cancellation     │ C-07 bloqueos-agenda
  5  │ C-10 sqlite-persistence      │ C-15 facturacion-arca       │ C-08 sobreturnos
  6  │ C-11 disponibilidad          │ C-16 obras-sociales         │ C-17 historia-clinica
  7  │ C-12 reserva-online          │ C-18 multi-sucursal         │ C-19 reportes-analitica
  8  │ C-13 recordatorios-whatsapp  │ C-14 pagos-sena             │ —
```

---

## FASE 0 — Cimientos

### [C-01] `foundation-setup`
- **Estado**: `[x]` completado
- **Scope**: Scaffolding TypeScript + Node.js y servidor mínimo
  - `package.json` con scripts `dev`, `build`, `test`, `typecheck`, `lint`; ESM; Node.js 20+
  - `tsconfig.json` con `strict`, `noUncheckedIndexedAccess`, `paths` para `@/domain`, `@/application`, `@/infrastructure`
  - Dependencias: `fastify`, `zod`; dev: `typescript`, `vitest`, `tsx`, `@types/node`
  - `src/http/server.ts` con `GET /health` → `{ status: "ok" }`
  - `src/main.ts` que levanta el servidor en `PORT` (default 3000)
  - `.env.example` con `PORT`, `NODE_ENV`, `TZ`; `.gitignore` para `node_modules`, `dist`, `.env`
  - Tests: health check responde 200; `npm run typecheck` y `npm test` pasan en limpio
- **Dependencias**: ninguna
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Alcance v0.1
  - `knowledge-base/02_descripcion_general.md` §Stack tecnológico
  - `knowledge-base/08_arquitectura_propuesta.md` §Estructura de directorios

---

### [C-02] `core-domain-models`
- **Estado**: `[x]` completado
- **Scope**: Entidades, value objects, puertos y adaptadores en memoria
  - Modelos: `Paciente`, `Profesional`, `Sillon`, `Prestacion`, `Turno`, `Usuario`, `Sucursal`
  - Value objects: `Intervalo` con `seSuperpone(otro)` usando `inicio < otro.fin && fin > otro.inicio`; `EstadoTurno` con transiciones válidas
  - Errores de dominio: `TurnoSolapadoError`, `IntervaloInvalidoError`, `RecursoInactivoError`, `TransicionInvalidaError`, `RecursoNoEncontradoError`
  - Puertos: `TurnoRepository`, `PacienteRepository`, `ProfesionalRepository`, `SillonRepository`, `PrestacionRepository`, `UsuarioRepository`
  - Adaptadores: repositorios en memoria con índices por profesional/sillón y consulta de solapamiento
  - Seed ficticio: 1 sucursal, 2 sillones, 2 profesionales, 4 prestaciones, 3 pacientes demo
  - Tests unitarios: borde `fin == inicio` sin solapamiento; solapamiento parcial y total; transición inválida
- **Dependencias**: C-01
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Entidades y §Seed data inicial
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AG-01, RN-AG-03, RN-TU-01
  - `knowledge-base/08_arquitectura_propuesta.md` §Patrones aplicados
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-02, DD-04, DD-05

---

## FASE 1 — Núcleo de agenda

### [C-03] `turno-creation`
- **Estado**: `[x]` completado (archivado 2026-11-22)
- **Scope**: Caso de uso y endpoint de creación con doble validación de solapamiento
  - `POST /api/turnos` con body `{ pacienteId, profesionalId, sillonId, prestacionId, inicio }`
  - Schema Zod con fechas ISO 8601 y IDs UUID; rechazo `400` con detalle por campo
  - Caso de uso `CrearTurno`: valida existencia y `activo` de los cuatro recursos; calcula `fin`
  - Rechazo `409 TURNO_SOLAPADO_PROFESIONAL` y `409 TURNO_SOLAPADO_SILLON` con `details.turnoEnConflicto`
  - Persistencia en estado `pendiente` con `createdBy`, `createdAt`, `updatedAt`
  - Mapeo centralizado de errores de dominio a HTTP (`error-handler.ts`)
  - Tests unitarios de dominio + integración HTTP: feliz, solapamiento por profesional, solapamiento por sillón, contiguo, recurso inactivo, recurso inexistente
- **Dependencias**: C-02
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AG-02 a RN-AG-09
  - `knowledge-base/07_flujos_principales.md` §Flujo 1 y §Flujo 2
  - `knowledge-base/06_funcionalidades.md` §US-001 a US-004
  - `knowledge-base/04_modelo_de_datos.md` §Turno

---

### [C-04] `agenda-queries`
- **Estado**: `[x]` completado (archivado 2026-11-23)
- **Scope**: Consulta de turnos y agenda
  - `GET /api/turnos?desde&hasta&profesionalId&sillonId` con validación de rango (`400 RANGO_INVALIDO`)
  - `GET /api/turnos/:id` con `404` tipado
  - Solo turnos `pendiente` y `confirmado` por defecto; orden por `inicio` ascendente
  - Respuesta con paciente y prestación resumidos (sin datos clínicos)
  - `GET /api/profesionales`, `GET /api/sillones`, `GET /api/prestaciones`
  - Tests: filtros combinados, rango inválido, orden, exclusión de cancelados
- **Dependencias**: C-03
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/07_flujos_principales.md` §Flujo 4
  - `knowledge-base/06_funcionalidades.md` §US-005
  - `knowledge-base/02_descripcion_general.md` §API REST
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AG-10

---

### [C-05] `turno-cancellation`
- **Estado**: `[x]` completado (archivado 2026-11-23)
- **Scope**: Cancelación y liberación de agenda
  - `PATCH /api/turnos/:id/cancelar` sin body
  - `CancelarTurno`: valida transición (`pendiente|confirmado → cancelado`), setea `cancelledAt`
  - Idempotencia: cancelar un turno ya cancelado devuelve `200` sin cambios
  - Turno `atendido` → `409 TRANSICION_INVALIDA`
  - Tests: cancelación feliz, doble cancelación, turno atendido, recreación en el mismo horario
- **Dependencias**: C-03
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/07_flujos_principales.md` §Flujo 3
  - `knowledge-base/06_funcionalidades.md` §US-006
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AG-06, RN-AG-07, RN-TU-01, RN-EX-03

---

## FASE 2 — Pacientes

### [C-06] `pacientes-crud`
- **Estado**: `[x]` completado
- **Scope**: Gestión básica de pacientes
  - `POST /api/pacientes`, `GET /api/pacientes?q=`, `GET /api/pacientes/:id`, `PATCH /api/pacientes/:id`
  - `DELETE /api/pacientes/:id` como baja lógica (`activo = false`)
  - Validación: nombre y apellido obligatorios; email/documento único entre activos
  - Búsqueda parcial por apellido, nombre, teléfono o documento, case-insensitive
  - Bloqueo de turnos nuevos para pacientes inactivos (integración con C-03)
  - Tests: alta, duplicado `409`, búsqueda, baja lógica, turno con paciente inactivo
- **Dependencias**: C-02
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Paciente
  - `knowledge-base/06_funcionalidades.md` §US-010 a US-012
  - `knowledge-base/05_reglas_de_negocio.md` §RN-PA-01 a RN-PA-04

---

## FASE 3 — Reglas avanzadas de agenda

### [C-07] `bloqueos-agenda`
- **Estado**: `[x]` completado
- **Scope**: Bloqueos por profesional o sillón
  - Modelo `Bloqueo` y repositorio en memoria
  - `POST /api/bloqueos`, `GET /api/bloqueos?desde&hasta`, `DELETE /api/bloqueos/:id`
  - Validación: al menos un recurso; `fin > inicio`
  - `CrearTurno` rechaza con `409 TURNO_BLOQUEADO` si se superpone con un bloqueo
  - Excepción explícita solo para Administrador (`forzar: true` auditado)
  - Tests: bloqueo por profesional, por sillón, contiguo permitido, excepción autorizada
- **Dependencias**: C-02, C-03
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Bloqueo
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AG-11
  - `knowledge-base/06_funcionalidades.md` §US-007

---

### [C-08] `sobreturnos`
- **Estado**: `[ ]` pendiente
- **Scope**: Sobreturnos controlados
  - Flag `esSobreturno` en `Turno` y parámetro opcional en `POST /api/turnos`
  - Permite solapamiento con el mismo profesional; nunca con el mismo sillón
  - Requiere rol Administrador o Recepcionista (`403` si no)
  - Auditoría del usuario que autoriza
  - Tests: sobreturno válido, solapamiento de sillón rechazado, rol no autorizado
- **Dependencias**: C-07
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AG-12
  - `knowledge-base/06_funcionalidades.md` §US-008
  - `knowledge-base/07_flujos_principales.md` §Flujo 6
  - `knowledge-base/03_actores_y_roles.md` §RBAC

---

## FASE 4 — Seguridad

### [C-09] `auth-rbac`
- **Estado**: `[x]` completado
- **Scope**: Autenticación y autorización por roles
  - Modelo `Usuario` con `passwordHash` (bcrypt/argon2) y rol
  - `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
  - Sesión con cookie `httpOnly`, `secure` en producción, `sameSite=lax`; expiración configurable
  - Middleware `requireAuth` y `requireRole`; rutas públicas: `/health` y futuras de reserva
  - Profesional: solo lectura de sus turnos y pacientes asociados
  - Tests: login correcto/incorrecto, ruta protegida sin sesión, rol insuficiente, aislamiento por profesional
- **Dependencias**: C-02
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §RBAC
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AU-01 a RN-AU-05, §RN-SE-01
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-07

---

## FASE 5 — Persistencia

### [C-10] `sqlite-persistence`
- **Estado**: `[ ]` pendiente
- **Scope**: Adaptador SQLite y migraciones
  - Dependencia `better-sqlite3` (o `node:sqlite` si la versión de Node lo soporta)
  - Migración 001: `sucursal`, `usuario`, `profesional`, `sillon`, `prestacion`, `paciente`, `turno`, `bloqueo`
  - Índices: `(profesional_id, inicio, fin)`, `(sillon_id, inicio, fin)`, `(paciente_id, inicio)`, `(estado)`
  - Implementaciones `SqliteTurnoRepository` y `SqlitePacienteRepository` detrás de los mismos puertos
  - Constraint de exclusión lógica en aplicación + transacción para evitar doble reserva concurrente
  - `DATABASE_URL` con default `file:./data/turnos.db`; seed idempotente para desarrollo
  - Tests: paridad con repositorios en memoria, persistencia entre instancias, concurrencia básica
- **Dependencias**: C-03, C-05, C-06
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Entidades y §Índices
  - `knowledge-base/08_arquitectura_propuesta.md` §Patrones aplicados
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-04
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AG-04, RN-AG-05

---

## FASE 6 — Reserva online y automatización

### [C-11] `disponibilidad`
- **Estado**: `[ ]` pendiente
- **Scope**: Cálculo de huecos libres
  - `GET /api/disponibilidad?profesionalId&prestacionId&desde&hasta`
  - Genera slots según duración de la prestación y descuenta turnos activos y bloqueos
  - Respeta zona `America/Argentina/Buenos_Aires` y devuelve ISO UTC
  - No expone datos de pacientes
  - Tests: día completo, huecos parciales, bloqueo, solapamiento en el borde
- **Dependencias**: C-04, C-07, C-10
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-021
  - `knowledge-base/07_flujos_principales.md` §Flujo 5
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AG-01, RN-AG-04, RN-AG-05, RN-AG-14

---

### [C-12] `reserva-online`
- **Estado**: `[ ]` pendiente
- **Scope**: Reserva pública con confirmación por token
  - `POST /api/reservas` (público) con datos mínimos del paciente y slot elegido
  - Turno en estado `pendiente`; token opaco de confirmación/cancelación
  - `GET/PATCH /api/reservas/:token` para consultar, confirmar o cancelar
  - Manejo de carrera: si el slot se ocupó, `409 SLOT_NO_DISPONIBLE` y sugerencia de alternativas
  - Rate limiting básico por IP
  - Tests: reserva feliz, slot ocupado, token inválido, cancelación pública
- **Dependencias**: C-11, C-09
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/07_flujos_principales.md` §Flujo 5
  - `knowledge-base/03_actores_y_roles.md` §Rutas públicas
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AG-04, RN-AG-05, RN-TU-01
  - `knowledge-base/06_funcionalidades.md` §US-021

---

### [C-13] `recordatorios-whatsapp`
- **Estado**: `[ ]` pendiente
- **Scope**: Recordatorios y confirmaciones por WhatsApp
  - Integración con WhatsApp Business API detrás de un puerto `NotificacionService`
  - Job programado: envío 24 h y 2 h antes del turno
  - Plantillas con datos ficticios en desarrollo; token por variable de entorno
  - Registro de envíos (estado, timestamp, error) sin datos clínicos
  - Reintentos con backoff y deduplicación por turno/ventana
  - Tests: envío en ventana correcta, reintento, token ausente, deduplicación
- **Dependencias**: C-12
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-020
  - `knowledge-base/02_descripcion_general.md` §Integraciones externas
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AD-02, §RN-SE-01

---

### [C-14] `pagos-sena`
- **Estado**: `[ ]` pendiente
- **Scope**: Seña con Mercado Pago
  - Preferencia de pago asociada a la reserva; webhook de confirmación
  - El turno pasa a `confirmado` solo con pago acreditado
  - Idempotencia por `payment_id`; conciliación manual para pagos huérfanos
  - Credenciales por entorno; nunca en el repositorio
  - Tests: pago aprobado, rechazado, webhook duplicado, pago sin reserva
- **Dependencias**: C-12
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-022
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AD-02
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad y §Variables de entorno

---

## FASE 7 — Gestión, facturación y clínica

### [C-15] `facturacion-arca`
- **Estado**: `[ ]` pendiente
- **Scope**: Factura electrónica ARCA
  - Modelo `Comprobante` (tipo, punto de venta, número, CAE, estado)
  - Integración con web service de ARCA mediante puerto `FacturacionService`
  - Emisión explícita desde el turno atendido; sin simular una integración no configurada
  - Manejo de errores y reintentos; almacenamiento de la respuesta
  - Tests con adaptador fake: emisión exitosa, rechazo, reintento
- **Dependencias**: C-05, C-06, C-09
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AD-03
  - `knowledge-base/06_funcionalidades.md` §US-031
  - `knowledge-base/02_descripcion_general.md` §Integraciones externas
  - `knowledge-base/10_preguntas_abiertas.md` §IN-05

---

### [C-16] `obras-sociales-liquidaciones`
- **Estado**: `[ ]` pendiente
- **Scope**: Obras sociales, coseguros y liquidaciones
  - Modelos `ObraSocial`, `Plan`, `Cobertura`, `Liquidacion`
  - Cada prestación registra obra social, coseguro y estado de liquidación
  - Cálculo de liquidación por período y profesional; exportación CSV
  - Tests: cobertura parcial/total, liquidación cerrada, exportación
- **Dependencias**: C-15
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-032
  - `knowledge-base/04_modelo_de_datos.md` §Prestacion
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AD-01

---

### [C-17] `historia-clinica`
- **Estado**: `[ ]` pendiente
- **Scope**: Historia clínica y odontograma
  - Modelos `HistoriaClinica`, `Evolucion`, `Odontograma` (por pieza/diente)
  - Endpoints con autorización estricta: solo el profesional tratante y Administrador
  - Auditoría de accesos y cambios (quién, cuándo, qué)
  - Datos ficticios obligatorios en tests y demos
  - Tests: acceso autorizado/denegado, auditoría, evolución inmutable
- **Dependencias**: C-06, C-09
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-040
  - `knowledge-base/03_actores_y_roles.md` §RBAC
  - `knowledge-base/05_reglas_de_negocio.md` §RN-SE-03, RN-SE-04
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad

---

### [C-18] `multi-sucursal`
- **Estado**: `[ ]` pendiente
- **Scope**: Operación con múltiples sucursales
  - Filtros `sucursalId` en agenda, sillones, profesionales y disponibilidad
  - Aislamiento de datos por sucursal según rol
  - Migración para `turno.sucursal_id` si no está normalizado
  - Tests: agenda aislada, usuario de una sucursal no ve otra, sillón compartido prohibido
- **Dependencias**: C-10, C-09
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Sucursal
  - `knowledge-base/06_funcionalidades.md` §US-033
  - `knowledge-base/09_decisiones_y_supuestos.md` §SU-01

---

### [C-19] `reportes-analitica`
- **Estado**: `[ ]` pendiente
- **Scope**: Reportes operativos básicos
  - Ocupación por profesional/sillón, ausentismo, turnos por estado y ingresos estimados
  - `GET /api/reportes/ocupacion?desde&hasta&sucursalId`
  - Agregaciones SQL; sin datos personales en la respuesta
  - Tests: cálculo de ocupación, rango vacío, permisos
- **Dependencias**: C-10
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-030 y §Métricas
  - `knowledge-base/01_vision_y_objetivos.md` §Métricas de éxito
  - `knowledge-base/05_reglas_de_negocio.md` §RN-AD-01

---

## Resumen

| Fase | Changes | Foco |
|---|---|---|
| 0 — Cimientos | C-01, C-02 | Scaffolding y dominio |
| 1 — Núcleo de agenda | C-03, C-04, C-05 | Crear, consultar y cancelar turnos |
| 2 — Pacientes | C-06 | CRUD básico |
| 3 — Reglas avanzadas | C-07, C-08 | Bloqueos y sobreturnos |
| 4 — Seguridad | C-09 | Auth y RBAC |
| 5 — Persistencia | C-10 | SQLite |
| 6 — Reserva y automatización | C-11, C-12, C-13, C-14 | Disponibilidad, reserva, WhatsApp, seña |
| 7 — Gestión y clínica | C-15, C-16, C-17, C-18, C-19 | ARCA, obras sociales, historia clínica, multi-sucursal, reportes |

**Total: 19 changes.** El MVP demostrable se cierra con C-01 a C-06; el producto operable con C-07 a C-12.

### Asignación por integrante (entrega grupal de 5)

| Integrante | Changes asignados | Ola | Guía |
|---|---|---|---|
| Alejo Pavon | Fundación: Discovery, KB, roadmap, estado + integración de PRs | 0 y 6 | [`docs/equipo/alejo-pavon.md`](docs/equipo/alejo-pavon.md) |
| Nathaniel Herrera | C-01, C-02 | 1 | [`docs/equipo/nathaniel-herrera.md`](docs/equipo/nathaniel-herrera.md) |
| Lucas Timmermann | C-03, C-04, C-05 | 2 y 3 | [`docs/equipo/lucas-timmermann.md`](docs/equipo/lucas-timmermann.md) |
| Aracelly Caballero | C-06, C-10 | 2 y 4 | [`docs/equipo/aracelly-caballero.md`](docs/equipo/aracelly-caballero.md) |
| Javier Alaniz | C-09, C-07, C-08 | 3, 4 y 5 | [`docs/equipo/javier-alaniz.md`](docs/equipo/javier-alaniz.md) |

> C-11 a C-19 quedan **fuera del alcance del TP**: son la evolución posterior del producto (reserva online, WhatsApp, pagos, ARCA, historia clínica, multi-sucursal y reportes). No asignarlos para esta entrega.
> Reglas de trabajo, orden de integración y convenciones compartidas: [`docs/equipo/README.md`](docs/equipo/README.md).

### Primer item elegible

`C-01` (`foundation-setup`). No tiene dependencias y desbloquea todo el roadmap. Lo ejecuta Nathaniel Herrera en la ola 1.
