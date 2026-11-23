# Tasks

## 1. Error de duplicado y repositorio

- [ ] 1.1 Crear `PacienteDuplicadoError` en `src/domain/paciente/paciente.errors.ts` (extiende `DominioError` de `turno.errors.ts`, `code = "PACIENTE_DUPLICADO"`, campo en conflicto); agregar el bloque del handler en `src/http/error-handler.ts` antes de `DominioError` (409, `details: { campo }`); test de integración que verifique que un duplicado responde 409 (no 400) con `code: PACIENTE_DUPLICADO` y `details.campo`
- [ ] 1.2 Ajustar `InMemoryPacienteRepository.listar` (C-02) para devolver solo activos con y sin `q`; verificar con tests unitarios existentes del repo (escenarios de listado)

## 2. Casos de uso de pacientes

- [ ] 2.1 Crear `CrearPaciente` con validación de datos mínimos y duplicado activo (email/documento) → 409; tests unitarios cubriendo alta feliz, duplicado por email/documento, reutilización de inactivo
- [ ] 2.2 Crear `BuscarPacientes` y `ObtenerPaciente` (404 `PACIENTE_NO_ENCONTRADO`); tests unitarios cubriendo GET existente/inexistente y búsqueda parcial
- [ ] 2.3 Crear `ActualizarPaciente` con validación de duplicado excluyendo al propio paciente (incluyendo reactivación con `activo = true` → 409 si hay duplicado); tests unitarios cubriendo PATCH propio, email/doc duplicado, inexistente, reactivación
- [ ] 2.4 Crear `DesactivarPaciente` (baja lógica idempotente); tests unitarios cubriendo DELETE activo, ya inactivo, inexistente

## 3. Schemas y rutas HTTP

- [ ] 3.1 Crear schema Zod para paciente (alta/patch) con `VALIDACION_FALLIDA` 400; tests de validación por campo
- [ ] 3.2 Crear rutas `/api/pacientes` (POST, GET, GET/:id, PATCH/:id, DELETE/:id) y registrar en `server.ts`; tests de integración HTTP cubriendo todos los escenarios del spec de pacientes

## 4. Integración con turnos

- [ ] 4.1 Ajustar `CrearTurno` (C-03) para validar paciente activo → 409 `RECURSO_INACTIVO`; test de integración de turno con paciente inactivo

## 5. Verificación de cobertura y cierre

- [ ] 5.1 Verificar que cada escenario de los specs `pacientes` y `turnos` (delta) tenga al menos un test
- [ ] 5.2 Ejecutar `npm run typecheck` y `npm test` y verificar que todo pasa
- [ ] 5.3 Marcar `[x]` en la línea de C-06 en `CHANGES.md`