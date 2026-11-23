# Proposal

## Why

El MVP necesita gestionar pacientes (alta, búsqueda, baja lógica) para asignarles turnos, y actualmente solo existe el repositorio en memoria de C-02 sin casos de uso ni endpoints. Además, `CrearTurno` (C-03) no bloquea turnos para pacientes inactivos, incumpliendo RN-PA-02.

## What Changes

- Nueva capability `pacientes`: CRUD básico de pacientes con validación de datos mínimos, unicidad de email/documento entre activos, búsqueda parcial case-insensitive, baja lógica (`activo = false`) y PATCH.
- Modificación de `CrearTurno` (C-03) para rechazar con `409 RECURSO_INACTIVO` cuando el paciente está inactivo.
- Ajuste mínimo de `InMemoryPacienteRepository.listar` (C-02) para devolver solo pacientes activos por defecto, con y sin `q`.
- Nuevo error de negocio con código estable para duplicado de paciente activo.

## Capabilities

### New Capabilities
- `pacientes`: gestión de pacientes (alta, búsqueda, detalle, actualización y baja lógica).

### Modified Capabilities
- `turnos`: el requisito "Recursos activos" se amplía para incluir al paciente inactivo (`409 RECURSO_INACTIVO`).

## Impact

- `src/application` (nuevos casos de uso de pacientes), `src/http/routes` (nueva ruta `/api/pacientes`), `src/http/schemas` (schema Zod), `src/http/server.ts` (registro), `src/application/crear-turno.ts` (check de activo), `src/infrastructure/persistence/in-memory-paciente-repository.ts` (filtro por activo en listar).
- Sin cambios de persistencia (sigue en memoria) ni de autenticación. SQLite, auth y bloqueos de agenda quedan fuera de alcance.