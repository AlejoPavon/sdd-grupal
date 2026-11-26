# pacientes Specification

## Purpose
Permite registrar, buscar, consultar, actualizar y desactivar pacientes, manteniendo el historial de turnos y bloqueando turnos nuevos para pacientes inactivos.

## Requirements

### Requirement: Alta de paciente con datos mínimos
El sistema SHALL crear un paciente cuando se envían nombre y apellido válidos, persistiendo `activo = true` por defecto y respondiendo `201` con el paciente creado.

#### Scenario: Alta feliz
- **GIVEN** un repositorio sin pacientes activos con el email `demo@paciente.local`
- **WHEN** se envía `POST /api/pacientes` con `{ "nombre": "Paciente", "apellido": "Demo", "email": "demo@paciente.local" }`
- **THEN** se crea el paciente con `activo = true` y se responde `201` con su id

#### Scenario: Alta con nombre faltante
- **GIVEN** un request sin el campo `nombre`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `nombre`

#### Scenario: Alta con apellido faltante
- **GIVEN** un request sin el campo `apellido`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `apellido`

### Requirement: Unicidad de email y documento entre activos
El sistema SHALL rechazar con `409` y código `PACIENTE_DUPLICADO` cuando se intenta crear o reactivar un paciente activo con un email o documento ya usado por otro paciente activo.

#### Scenario: Duplicado por email
- **GIVEN** un paciente activo con email `dup@paciente.local`
- **WHEN** se crea otro paciente activo con el mismo email
- **THEN** se responde `409` con código `PACIENTE_DUPLICADO` y no se persiste

#### Scenario: Duplicado por documento
- **GIVEN** un paciente activo con documento `00000001`
- **WHEN** se crea otro paciente activo con el mismo documento
- **THEN** se responde `409` con código `PACIENTE_DUPLICADO` y no se persiste

#### Scenario: Reutilizar email de paciente dado de baja
- **GIVEN** un paciente inactivo con email `baja@paciente.local`
- **WHEN** se crea un paciente activo con el mismo email
- **THEN** la creación es exitosa y se responde `201`

#### Scenario: Reactivar con email duplicado
- **GIVEN** un paciente inactivo con email `x@paciente.local` y otro activo con el mismo email
- **WHEN** se envía `PATCH /api/pacientes/:id` con `{ "activo": true }`
- **THEN** se responde `409` con código `PACIENTE_DUPLICADO` y el paciente permanece inactivo

#### Scenario: Reactivar con documento duplicado
- **GIVEN** un paciente inactivo con documento `00000002` y otro activo con el mismo documento
- **WHEN** se envía `PATCH /api/pacientes/:id` con `{ "activo": true }`
- **THEN** se responde `409` con código `PACIENTE_DUPLICADO` y el paciente permanece inactivo

### Requirement: Búsqueda parcial case-insensitive
El sistema SHALL buscar pacientes por apellido, nombre, teléfono o documento de forma parcial y sin distinguir mayúsculas, devolviendo solo pacientes activos por defecto.

#### Scenario: Búsqueda parcial
- **GIVEN** pacientes activos "Demo" y "Prueba"
- **WHEN** se busca con `q=dEm`
- **THEN** se devuelven solo los pacientes activos que coinciden

#### Scenario: Búsqueda no devuelve inactivos
- **GIVEN** un paciente activo "Demo" y uno inactivo "Oculto"
- **WHEN** se busca con `q=oc`
- **THEN** no se devuelve el paciente inactivo

#### Scenario: Listado sin q devuelve solo activos
- **GIVEN** un paciente activo y uno inactivo
- **WHEN** se lista sin `q`
- **THEN** se devuelven únicamente los pacientes activos

### Requirement: Consulta por id
El sistema SHALL devolver un paciente por id, incluyendo pacientes inactivos.

#### Scenario: GET existente
- **GIVEN** un paciente con id conocido
- **WHEN** se envía `GET /api/pacientes/:id`
- **THEN** se responde `200` con el paciente

#### Scenario: GET inexistente
- **GIVEN** un id que no existe
- **WHEN** se envía `GET /api/pacientes/:id`
- **THEN** se responde `404` con código `PACIENTE_NO_ENCONTRADO`

### Requirement: Baja lógica de paciente
El sistema SHALL desactivar un paciente (`activo = false`) sin eliminar su historial; el paciente sigue accesible por `GET /api/pacientes/:id` con `activo = false` y no aparece en el listado.

#### Scenario: Baja lógica
- **GIVEN** un paciente activo
- **WHEN** se envía `DELETE /api/pacientes/:id`
- **THEN** se responde `200`, el paciente queda con `activo = false`, sigue accesible por GET y no aparece en el listado

#### Scenario: DELETE de paciente ya inactivo
- **GIVEN** un paciente inactivo
- **WHEN** se envía `DELETE /api/pacientes/:id`
- **THEN** se responde `200` sin cambios (idempotente)

#### Scenario: DELETE de paciente inexistente
- **GIVEN** un id que no existe
- **WHEN** se envía `DELETE /api/pacientes/:id`
- **THEN** se responde `404` con código `PACIENTE_NO_ENCONTRADO`

### Requirement: Actualización con unicidad
El sistema SHALL permitir actualizar un paciente, rechazando con `409` y código `PACIENTE_DUPLICADO` si el nuevo email o documento ya está en uso por otro paciente activo, sin fallar al editar el propio paciente. El campo `activo` puede modificarse (reactivación permitida), sujeta a la misma unicidad.

#### Scenario: PATCH con email de otro activo
- **GIVEN** dos pacientes activos A y B
- **WHEN** se actualiza A usando el email de B (conservando su propio documento)
- **THEN** se responde `409` con código `PACIENTE_DUPLICADO` y no se persiste

#### Scenario: PATCH con documento duplicado
- **GIVEN** dos pacientes activos A y B
- **WHEN** se actualiza A usando el documento de B
- **THEN** se responde `409` con código `PACIENTE_DUPLICADO` y no se persiste

#### Scenario: PATCH a sí mismo
- **GIVEN** un paciente activo con email y documento propios
- **WHEN** se actualiza manteniendo su propio email y documento
- **THEN** la actualización es exitosa

#### Scenario: PATCH inexistente
- **GIVEN** un id que no existe
- **WHEN** se envía `PATCH /api/pacientes/:id`
- **THEN** se responde `404` con código `PACIENTE_NO_ENCONTRADO`

#### Scenario: Reactivar paciente
- **GIVEN** un paciente inactivo cuyo email y documento no están en uso por otro activo
- **WHEN** se envía `PATCH /api/pacientes/:id` con `{ "activo": true }`
- **THEN** el paciente queda activo

### Requirement: Autenticación obligatoria en rutas de pacientes

El sistema SHALL exigir una sesión válida en todas las rutas de pacientes y SHALL responder `401` con código `NO_AUTENTICADO` cuando la request no incluye una sesión válida.

#### Scenario: Listado sin sesión

- **WHEN** se envía `GET /api/pacientes` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Alta sin sesión

- **WHEN** se envía `POST /api/pacientes` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`
- **AND** no se persiste ningún paciente

#### Scenario: Baja sin sesión

- **WHEN** se envía `DELETE /api/pacientes/:id` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`

### Requirement: Mutaciones de pacientes reservadas a administrador y recepcionista

El sistema SHALL permitir crear, actualizar y dar de baja pacientes solo a usuarios con rol `administrador` o `recepcionista`, y SHALL responder `403` con código `SIN_PERMISO` a cualquier otro rol autenticado.

#### Scenario: Profesional intenta crear un paciente

- **WHEN** un usuario autenticado con rol `profesional` envía `POST /api/pacientes`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Profesional intenta actualizar un paciente

- **WHEN** un usuario autenticado con rol `profesional` envía `PATCH /api/pacientes/:id`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Profesional intenta dar de baja un paciente

- **WHEN** un usuario autenticado con rol `profesional` envía `DELETE /api/pacientes/:id`
- **THEN** se responde `403` con código `SIN_PERMISO`
- **AND** el paciente sigue activo

#### Scenario: Recepcionista crea un paciente

- **WHEN** un usuario autenticado con rol `recepcionista` envía `POST /api/pacientes` con datos válidos
- **THEN** se responde `201` con el paciente creado

### Requirement: Scoping de profesional a sus pacientes asociados

El sistema SHALL limitar a un usuario con rol `profesional` a los pacientes que tienen al menos un turno, en cualquier estado, con su `profesionalId`; en `GET /api/pacientes` SHALL filtrar el listado y en `GET /api/pacientes/:id` SHALL responder `403` con código `SIN_PERMISO` si el paciente no está asociado. Si el usuario no tiene `profesionalId` vinculado, SHALL responder `403` con código `SIN_PERMISO`.

#### Scenario: Listado acotado a pacientes asociados

- **GIVEN** un usuario `profesional` vinculado al profesional A, un paciente con turno del profesional A y otro paciente solo con turnos del profesional B
- **WHEN** se envía `GET /api/pacientes`
- **THEN** la respuesta incluye solo al paciente asociado al profesional A

#### Scenario: Búsqueda acotada a pacientes asociados

- **GIVEN** un usuario `profesional` vinculado al profesional A
- **WHEN** se envía `GET /api/pacientes?q=<texto>` que coincide con pacientes propios y ajenos
- **THEN** la respuesta incluye solo los pacientes propios que coinciden con la búsqueda

#### Scenario: Paciente no asociado por id

- **GIVEN** un paciente sin turnos del profesional A
- **WHEN** un usuario `profesional` vinculado al profesional A envía `GET /api/pacientes/:id`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Paciente asociado por id

- **GIVEN** un paciente con al menos un turno del profesional A
- **WHEN** un usuario `profesional` vinculado al profesional A envía `GET /api/pacientes/:id`
- **THEN** se responde `200` con el paciente

#### Scenario: Asociación derivada de un turno cancelado

- **GIVEN** un paciente cuyo único turno con el profesional A está cancelado
- **WHEN** un usuario `profesional` vinculado al profesional A envía `GET /api/pacientes`
- **THEN** el paciente aparece en la respuesta

#### Scenario: Profesional sin vínculo

- **GIVEN** un usuario con rol `profesional` y sin `profesionalId`
- **WHEN** se envía `GET /api/pacientes` o `GET /api/pacientes/:id`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Administrador y recepcionista sin scoping

- **GIVEN** un usuario con rol `administrador` o `recepcionista`
- **WHEN** se envía `GET /api/pacientes`
- **THEN** la respuesta incluye los pacientes activos sin restricción por profesional

### Requirement: Formato de documento y teléfono

El sistema SHALL validar en el alta (`POST /api/pacientes`) y en la edición (`PATCH /api/pacientes/:id`) que `documento`, cuando venga informado, contenga exactamente 8 dígitos y solo números, y que `telefono`, cuando venga informado, contenga exactamente 10 dígitos y solo números. Ambos campos SHALL seguir siendo opcionales. Cuando un valor no cumpla el formato, el sistema SHALL responder `400` con código `VALIDACION_FALLIDA` y el detalle del campo inválido.

#### Scenario: Documento y teléfono válidos en el alta

- **GIVEN** un request de alta con `documento` `12345678` y `telefono` `1122334455`
- **WHEN** se envía `POST /api/pacientes` con esos datos
- **THEN** se responde `201` con el paciente creado

#### Scenario: Documento de 7 dígitos en el alta

- **GIVEN** un request de alta con `documento` `1234567`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `documento`

#### Scenario: Documento con letras en el alta

- **GIVEN** un request de alta con `documento` `1234abcd`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `documento`

#### Scenario: Teléfono de 9 dígitos en el alta

- **GIVEN** un request de alta con `telefono` `112233445`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `telefono`

#### Scenario: Teléfono con letras en el alta

- **GIVEN** un request de alta con `telefono` `11223abcd5`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `telefono`

#### Scenario: Alta sin documento ni teléfono

- **GIVEN** un request de alta con nombre y apellido y sin `documento` ni `telefono`
- **WHEN** se envía `POST /api/pacientes`
- **THEN** se responde `201` con el paciente creado

#### Scenario: Edición con documento inválido

- **GIVEN** un paciente existente
- **WHEN** se envía `PATCH /api/pacientes/:id` con `documento` `1234567`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `documento`

#### Scenario: Edición con teléfono inválido

- **GIVEN** un paciente existente
- **WHEN** se envía `PATCH /api/pacientes/:id` con `telefono` `112233445`
- **THEN** se responde `400` con código `VALIDACION_FALLIDA` y el detalle del campo `telefono`
