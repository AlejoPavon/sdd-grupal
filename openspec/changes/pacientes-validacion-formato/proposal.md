# Proposal

## Why

La API de pacientes aceptaba cualquier texto en `documento` y `telefono`, lo que permitía cargar identificadores incompletos o con letras y dejaba datos inconsistentes en la base. El equipo definió que el documento debe tener exactamente 8 dígitos y el teléfono exactamente 10 dígitos, ambos solo con números, manteniéndolos opcionales. Validar el formato en el borde HTTP evita datos inválidos sin tocar el dominio ni la persistencia.

## Justificación de la elección del change

Es un ajuste pedido por el equipo sobre la capability `pacientes` (C-06), que ya está archivada. Se eligió como change propio porque:

- Contiene una sola regla verificable: formato de `documento` y `telefono` en la entrada HTTP.
- Está acotado a la validación de la API: no toca dominio, repositorios, base de datos ni el frontend.
- Se puede implementar, probar y archivar de forma independiente, sin depender de otros changes abiertos.

## What Changes

- El schema Zod de pacientes (`src/http/schemas/paciente.schema.ts`) valida que `documento` tenga exactamente 8 dígitos y `telefono` exactamente 10 dígitos, solo números.
- Ambos campos siguen siendo opcionales: se validan solo si vienen informados.
- La validación aplica al alta (`POST /api/pacientes`) y a la edición (`PATCH /api/pacientes/:id`).
- Ante un valor inválido se responde `400` con código `VALIDACION_FALLIDA` y el detalle por campo.
- Sin cambios en el dominio, los repositorios, la base de datos ni los códigos de error.

## Capabilities

### Modified Capabilities

- `pacientes`: se agrega la validación de formato de `documento` (8 dígitos) y `telefono` (10 dígitos) en el alta y la edición.

## Impact

- `src/http/schemas/paciente.schema.ts`: nuevas reglas de formato con mensajes en español.
- `tests/integration/pacientes.test.ts`: tests de formato para alta y edición, y actualización de los datos de prueba que no cumplían el formato.
- Fuera de alcance: el frontend, que corresponde a C-20. No se modifica el dominio, los repositorios ni la base de datos.
## Sobre "eliminar pacientes" (dar de baja)

La baja de pacientes ya está implementada en la API desde C-06: `DELETE /api/pacientes/:id` hace una baja lógica. El paciente queda inactivo (`activo = false`), desaparece del listado y no se le pueden dar turnos nuevos, pero no se borra, para conservar el historial de turnos. Este change no modifica esa regla.

Lo que falta es el botón "Dar de baja" en la página web. Eso corresponde al frontend (C-20) y queda fuera del alcance de este change.