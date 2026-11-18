# Modelo de Datos

## Dominios

- **Agenda:** profesionales, sillones/boxes, prestaciones, turnos, bloqueos.
- **Pacientes:** datos de contacto y referencia del paciente.
- **Organización:** sucursales y usuarios (multi-sucursal en etapa posterior).
- **Clínica:** historia clínica, odontograma y evoluciones (etapa posterior).

## ERD (Entity Relationship Diagram)

```text
Sucursal 1 ──── * Sillon
Sucursal 1 ──── * Usuario
Profesional 1 ── * Turno
Sillon 1 ─────── * Turno
Prestacion 1 ─── * Turno
Paciente 1 ────── * Turno
Profesional 1 ── * Bloqueo
Sillon 1 ─────── * Bloqueo
Paciente 1 ────── 1 HistoriaClinica (posterior)
HistoriaClinica 1 ─ * Evolucion (posterior)
```

## Entidades

### Paciente
- `id`: UUID (PK)
- `nombre`: string, obligatorio
- `apellido`: string, obligatorio
- `documento`: string, opcional (dato ficticio en pruebas)
- `telefono`: string, opcional
- `email`: string, opcional
- `fechaNacimiento`: date, opcional
- `notas`: text, opcional
- `activo`: boolean, default `true`
- `createdAt`, `updatedAt`: timestamp UTC
- **Relaciones:** 1 → * `Turno`
- **Constraints:** `email` único si está presente; `documento` único si está presente.
- **Índices:** `(apellido, nombre)`, `telefono`, `email`.

### Profesional
- `id`: UUID (PK)
- `nombre`, `apellido`: string
- `matricula`: string, única
- `especialidades`: string[]
- `activo`: boolean
- **Relaciones:** 1 → * `Turno`, 1 → * `Bloqueo`
- **Índices:** `matricula`, `activo`.

### Sillon
- `id`: UUID (PK)
- `nombre`: string (ej. “Sillón 1”)
- `sucursalId`: UUID (FK)
- `activo`: boolean
- **Relaciones:** 1 → * `Turno`, 1 → * `Bloqueo`
- **Constraints:** `(sucursalId, nombre)` único.
- **Índices:** `(sucursalId, activo)`.

### Prestacion
- `id`: UUID (PK)
- `codigo`: string, único
- `nombre`: string
- `duracionMinutos`: integer > 0
- `precio`: decimal (ARS), opcional
- `activo`: boolean
- **Relaciones:** 1 → * `Turno`
- **Índices:** `codigo`, `activo`.

### Turno
- `id`: UUID (PK)
- `pacienteId`: UUID (FK, obligatorio)
- `profesionalId`: UUID (FK, obligatorio)
- `sillonId`: UUID (FK, obligatorio)
- `prestacionId`: UUID (FK, obligatorio)
- `inicio`: timestamp UTC (obligatorio)
- `fin`: timestamp UTC (obligatorio, > `inicio`)
- `estado`: enum `pendiente | confirmado | atendido | cancelado | ausente`, default `pendiente`
- `esSobreturno`: boolean, default `false`
- `notas`: text, opcional
- `createdBy`: UUID (FK Usuario)
- `createdAt`, `updatedAt`: timestamp UTC
- `cancelledAt`: timestamp UTC, opcional
- **Constraints:**
  - `fin > inicio`.
  - No puede existir otro turno **activo** (`pendiente` o `confirmado`) con el mismo `profesionalId` que se solape en `[inicio, fin)`.
  - No puede existir otro turno **activo** con el mismo `sillonId` que se solape en `[inicio, fin)`.
- **Índices:** `(profesionalId, inicio, fin)`, `(sillonId, inicio, fin)`, `(pacienteId, inicio)`, `estado`.

### Bloqueo
- `id`: UUID (PK)
- `profesionalId`: UUID (FK, opcional)
- `sillonId`: UUID (FK, opcional)
- `inicio`, `fin`: timestamp UTC
- `motivo`: string
- **Constraints:** al menos uno de `profesionalId` o `sillonId`; `fin > inicio`.
- **Índices:** `(profesionalId, inicio, fin)`, `(sillonId, inicio, fin)`.

### Usuario
- `id`: UUID (PK)
- `email`: string, único
- `passwordHash`: string
- `nombre`, `apellido`: string
- `rol`: enum `administrador | recepcionista | profesional`
- `activo`: boolean
- `createdAt`: timestamp UTC

### Sucursal
- `id`: UUID (PK)
- `nombre`: string
- `direccion`: string
- `timezone`: string, default `America/Argentina/Buenos_Aires`
- `activa`: boolean

## Seed data inicial

| Entidad | Datos ficticios |
|---|---|
| Sucursal | “Consultorio Demo”, Av. Ficticia 123, CABA |
| Sillones | “Sillón 1”, “Sillón 2” |
| Profesionales | Dra. Ana Demo (matrícula DEMO-001), Dr. Bruno Demo (DEMO-002) |
| Prestaciones | Consulta (30 min), Limpieza (45 min), Endodoncia (90 min), Control (15 min) |
| Pacientes | “Paciente Demo Uno”, “Paciente Demo Dos”, “Paciente Demo Tres” |
| Turnos | Ninguno al iniciar; se crean en tests y demos |

> **Regla de privacidad:** todo dato de ejemplo debe ser ficticio. No se almacenan datos reales de pacientes en el repositorio, en los tests ni en las capturas.
