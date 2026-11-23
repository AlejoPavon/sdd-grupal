# Design

## Context

Estado actual: `Paciente` (dominio) y `PacienteRepository` (puerto) existen desde C-02, junto con `InMemoryPacienteRepository`, que ya soporta `crear`, `buscarPorId`, `buscarActivoPorId`, `buscarPorEmailODocumento`, `listar` y `actualizar`. No existen casos de uso ni rutas HTTP para pacientes. `CrearTurno` (C-03) busca al paciente con `buscarPorId` pero no valida `activo`. Ver proposal.md para la motivación.

## Goals / Non-Goals

**Goals:**
- Exponer CRUD básico de pacientes por HTTP con validación Zod.
- Bloquear turnos nuevos para pacientes inactivos.
- Mantener la unicidad de email/documento solo entre activos.

**Non-Goals:**
- Persistencia SQLite, auth/RBAC y bloqueos de agenda (changes posteriores).
- Historia clínica y datos sensibles (C-17).

## Decisions

- **Validación de duplicados en casos de uso, no en el repositorio.** El repositorio en memoria solo permite buscar (`buscarPorEmailODocumento` devuelve un solo resultado). El caso de uso de alta/actualización consulta ese método y, si encuentra un activo distinto, lanza un error de negocio con código estable. Esto mantiene al repositorio como adaptador tonto y al dominio/aplicación como dueño de las reglas.
- **Caso PATCH:** `buscarPorEmailODocumento` devuelve un único resultado y puede devolver al propio paciente, ocultando un duplicado real. Por eso `ActualizarPaciente` consulta email y documento por separado, solo los campos que se envían y cambian, comparando el `id` en cada consulta; es duplicado si alguna devuelve un paciente activo con `id` distinto al editado.
- **Reactivación:** al enviar `activo = true`, se validan el email y el documento actuales del paciente contra otros activos; si hay choque, `409 PACIENTE_DUPLICADO` y el paciente permanece inactivo.
- **Error de duplicado:** `PacienteDuplicadoError` se crea en `src/domain/paciente/paciente.errors.ts`, extiende `DominioError` (importada de `../turno/turno.errors.js`), con `code = "PACIENTE_DUPLICADO"` y el campo en conflicto (`email` o `documento`). No se modifica `turno.errors.ts`.
- **Mapeo HTTP:** en `src/http/error-handler.ts` se agrega un bloque propio para `PacienteDuplicadoError` que responde `409` con `code: error.code` y `details: { campo }`, sin datos de otro paciente. Debe ir ANTES del bloque de `DominioError` (que responde `400`).
- **Códigos existentes:** `PACIENTE_NO_ENCONTRADO` ya existe en `CODIGOS_NO_ENCONTRADO` (404) y `VALIDACION_FALLIDA` en el handler (400); no se crean códigos nuevos para eso.
- **Baja lógica vía DELETE** (mapea a actualización con `activo = false`), sin eliminación física. DELETE de activo → `200`; de ya inactivo → `200` idempotente; inexistente → `404`.
- **Búsqueda:** `listar(q?)` filtra por apellido, nombre, teléfono o documento, case-insensitive. Sin `q` devuelve solo activos. Con `q` también solo activos (US-011 CA-2).
- **GET por id:** devuelve pacientes activos e inactivos.

## Cambios mínimos y su pertenencia

- `src/application/crear-turno.ts` (C-03): agregar validación `if (!paciente.activo)` → `RecursoInactivoError("paciente", id)`. Mínimo y explícito; pertenece originalmente a C-03, se ajusta aquí por RN-PA-02.
- `src/infrastructure/persistence/in-memory-paciente-repository.ts` (C-02): `listar` debe filtrar solo activos (con y sin `q`). Cambio mínimo sobre código de C-02.

## Risks / Trade-offs

- [Race condition en duplicados] → En memoria no hay concurrencia real; en SQLite (C-10) se resuelve con constraint/índice único parcial.
- [Duplicado detectado por igualdad exacta de email/documento] → No se normaliza casing ni espacios; aceptable para v0.1.
- [Acoplamiento paciente→turno] → El dominio de pacientes importa `DominioError` y `RecursoNoEncontradoError` desde `turno.errors.ts`; deuda conocida para refactor futuro.