# Tasks

## 1. Validación en el schema

- [x] 1.1 Definir en `src/http/schemas/paciente.schema.ts` la regex `^\d{8}$` para `documento` con mensaje en español, reutilizada en alta y edición
- [x] 1.2 Definir en `src/http/schemas/paciente.schema.ts` la regex `^\d{10}$` para `telefono` con mensaje en español, reutilizada en alta y edición
- [x] 1.3 Mantener `documento` y `telefono` como opcionales en `crearPacienteSchema` y `actualizarPacienteSchema`

## 2. Tests por escenario

- [x] 2.1 Test de alta con documento y teléfono válidos (`12345678` y `1122334455`) → `201`
- [x] 2.2 Tests de alta con documento de 7 y 9 dígitos y con letras → `400 VALIDACION_FALLIDA`
- [x] 2.3 Tests de alta con teléfono de 9 dígitos y con letras → `400 VALIDACION_FALLIDA`
- [x] 2.4 Test de alta sin documento ni teléfono → `201`
- [x] 2.5 Tests de PATCH con documento inválido y con teléfono inválido → `400` sin modificar el paciente
- [x] 2.6 Test de PATCH con documento y teléfono válidos → `200`

## 3. Datos de prueba existentes

- [x] 3.1 Actualizar en `tests/integration/pacientes.test.ts` solo los documentos de prueba que no cumplían el formato, sin borrar ni debilitar tests

## 4. Verificación

- [x] 4.1 Ejecutar `npm run typecheck` en verde
- [x] 4.2 Ejecutar `npm run lint` en verde
- [x] 4.3 Ejecutar `npm test` en verde
