# Design

## Context

La API de pacientes ya valida los datos mínimos con Zod en `src/http/schemas/paciente.schema.ts`. `documento` y `telefono` se aceptaban como cualquier `string` opcional, por lo que se podían cargar valores incompletos o con letras. El código de este change ya está implementado y commiteado (commit "validar documento de 8 digitos y telefono de 10"). Ver proposal.md para la motivación.

## Goals / Non-Goals

**Goals:**

- Validar en el borde HTTP que `documento` tenga exactamente 8 dígitos y `telefono` exactamente 10 dígitos, solo números.
- Mantener ambos campos opcionales.
- Aplicar la misma regla al alta (`POST`) y a la edición (`PATCH`).

**Non-Goals:**

- Cambios en el dominio, los repositorios, la base de datos o los códigos de error.
- Restricciones de teclado o mensajes de error en el formulario web (C-20).

- **Baja de pacientes:** no cambia. Se mantiene la baja lógica de C-06 y no se implementa un borrado real, porque en SQLite la tabla `turno` referencia a `paciente` con `ON DELETE RESTRICT` y el spec de C-06 exige conservar el historial. La opción de dar de baja desde la pantalla queda pendiente en el frontend (C-20).

## Decisions

- **Validación en el schema Zod con regex.** Se define `documento` con `/^\d{8}$/` y `telefono` con `/^\d{10}$/`. La regex se declara una vez y se reutiliza en `crearPacienteSchema` y en `actualizarPacienteSchema`, garantizando la misma regla en alta y edición.
- **Campos opcionales.** Ambos siguen siendo `.optional()`: solo se validan cuando el cliente envía el campo. Un valor vacío (`""`) no cumple el formato y se rechaza; la ausencia del campo no se valida.
- **Mensajes en español.** Cada regex incluye un mensaje claro ("El documento debe tener exactamente 8 números (solo dígitos)" y "El teléfono debe tener exactamente 10 números (solo dígitos)"), que el error handler existente expone en el detalle por campo del `400 VALIDACION_FALLIDA`.
- **Sin cambios en dominio, repositorios, base de datos ni códigos de error.** La validación vive solo en el schema HTTP; el dominio y la persistencia no conocen el formato. Se reutiliza el código `VALIDACION_FALLIDA` ya existente.

## Limitaciones

- Un DNI de 7 dígitos no se puede cargar: la regla exige exactamente 8 dígitos.
- El formulario web todavía no limita las teclas ni muestra el error de formato; esa experiencia corresponde a C-20.

## Risks / Trade-offs

- [Valores válidos según el dominio pero rechazados por formato] → Se acepta: la decisión del equipo es que un DNI de 7 dígitos no se cargue.
- [El frontend no refleja la regla] → Deuda conocida, se resuelve en C-20; la API ya protege la integridad de los datos.
