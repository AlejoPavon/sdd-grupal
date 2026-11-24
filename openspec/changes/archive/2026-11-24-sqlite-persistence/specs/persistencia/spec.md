# persistencia

## ADDED Requirements

### Requirement: Configuración y migraciones

El sistema SHALL usar repositorios en memoria cuando `PERSISTENCE` no esté definido o sea `memory`, y SQLite cuando `PERSISTENCE=sqlite` usando DATABASE_URL (default file:./data/turnos.db).

#### Scenario: migraciones idempotentes [arranque]

- **GIVEN** una base vacía
- **WHEN** se ejecutan las migraciones dos veces
- **THEN** no falla y el schema queda igual
- **AND** existen los índices `(profesional_id, inicio, fin)`, `(sillon_id, inicio, fin)`, `(paciente_id, inicio)` y `(estado)` de la tabla `turno`

#### Scenario: default en memoria [arranque]

- **GIVEN** `PERSISTENCE` no definido
- **WHEN** arranca el servidor
- **THEN** usa repositorios en memoria

#### Scenario: sqlite con DATABASE_URL [arranque]

- **GIVEN** `PERSISTENCE=sqlite` y `DATABASE_URL=file:./data/turnos.db` definido
- **WHEN** arranca el servidor
- **THEN** usa SQLite en esa ruta (sin el prefijo `file:`)

### Requirement: Persistencia de pacientes

El sistema SHALL persistir pacientes con paridad de reglas respecto a memoria. El caso de uso sigue validando los duplicados; el índice único parcial es la última barrera y su violación se traduce a `PacienteDuplicadoError`.

#### Scenario: duplicado de email entre activos → PacienteDuplicadoError [repositorio]

- **GIVEN** un paciente activo con email `ana@paciente.local`
- **WHEN** se crea otro activo con el mismo email
- **THEN** lanza `PacienteDuplicadoError`

#### Scenario: duplicado de documento entre activos → PacienteDuplicadoError [repositorio]

- **GIVEN** un paciente activo con documento `00000001`
- **WHEN** se crea otro activo con el mismo documento
- **THEN** lanza `PacienteDuplicadoError`

#### Scenario: reactivar con email de otro activo → PacienteDuplicadoError [repositorio]

- **GIVEN** un paciente inactivo y otro activo con email `ana@paciente.local`
- **WHEN** se reactiva el inactivo con ese email
- **THEN** lanza `PacienteDuplicadoError`

#### Scenario: reutilizar email de inactivo es válido [repositorio]

- **GIVEN** un paciente inactivo con email `ana@paciente.local`
- **WHEN** se crea un paciente activo con el mismo email
- **THEN** la creación es exitosa

#### Scenario: listar solo activos con y sin q [repositorio]

- **GIVEN** pacientes activos e inactivos
- **WHEN** se lista con y sin `q`
- **THEN** devuelve solo activos filtrados

#### Scenario: búsqueda con tildes y mayúsculas [repositorio]

- **GIVEN** un paciente activo con apellido `Gómez`
- **WHEN** se busca con `q=GÓM`
- **THEN** se encuentra el paciente
- **AND** al buscar con `q=GOM` no se encuentra, igual que en memoria (no se normalizan tildes)

#### Scenario: actualizar inexistente → RecursoNoEncontradoError [repositorio]

- **GIVEN** un id inexistente
- **WHEN** se llama `actualizar`
- **THEN** lanza `RecursoNoEncontradoError`

### Requirement: Persistencia de turnos con paridad de reglas

El sistema SHALL persistir turnos con paridad de reglas respecto a memoria.

#### Scenario: crear y leer en nueva conexión [repositorio]

- **GIVEN** un turno válido del paciente `00000000-0000-4000-8000-000000000041` con el profesional `00000000-0000-4000-8000-000000000021` y sillón `00000000-0000-4000-8000-000000000011`
- **WHEN** se crea el turno y se abre una nueva conexión al mismo archivo
- **THEN** el turno se lee con los mismos datos (incluyendo `esSobreturno`, `notas`, `autorizadoPor`, `cancelledAt`)

#### Scenario: solapamiento de profesional → TurnoSolapadoError [repositorio]

- **GIVEN** un turno activo del profesional `00000000-0000-4000-8000-000000000021` en `[09:00,09:30)`
- **WHEN** se crea otro turno del mismo profesional en `[09:15,09:45)` con `esSobreturno=false`
- **THEN** lanza `TurnoSolapadoError`

#### Scenario: sobreturno del mismo profesional permitido [repositorio]

- **GIVEN** un turno activo del profesional `00000000-0000-4000-8000-000000000021` en `[09:00,09:30)`
- **WHEN** se crea un sobreturno del mismo profesional en `[09:15,09:45)` con `esSobreturno=true` y `autorizadoPor` definido
- **THEN** se persiste con `esSobreturno=true`

#### Scenario: sobreturno en sillón ocupado → TurnoSolapadoError por sillón [repositorio]

- **GIVEN** un turno activo en el sillón `00000000-0000-4000-8000-000000000011` en `[09:00,09:30)`
- **WHEN** se crea un sobreturno del mismo profesional en el mismo sillón en `[09:15,09:45)`
- **THEN** lanza `TurnoSolapadoError` por sillón (el sillón nunca se omite)

#### Scenario: turno contiguo permitido [repositorio]

- **GIVEN** un turno en `[09:00,09:30)`
- **WHEN** se crea otro en `[09:30,10:00)`
- **THEN** ambos coexisten (intervalos semiabiertos)

#### Scenario: turno cancelado no bloquea [repositorio]

- **GIVEN** un turno cancelado en `[09:00,09:30)`
- **WHEN** se crea otro en el mismo rango
- **THEN** la creación es exitosa

#### Scenario: doble reserva con conexiones distintas rechazada [repositorio]

- **GIVEN** dos repositorios SQLite con conexiones distintas al mismo archivo, y un turno creado con el primero en `[09:00,09:30)`
- **WHEN** el segundo crea un turno del mismo profesional en `[09:15,09:45)` con `esSobreturno=false`
- **THEN** lanza `TurnoSolapadoError`

#### Scenario: cancelar turno persiste estado y cancelledAt [repositorio]

- **GIVEN** un turno activo
- **WHEN** se actualiza a cancelado
- **THEN** persiste estado cancelado y `cancelledAt`

#### Scenario: buscarSolapado con excluirId [repositorio]

- **GIVEN** un turno existente
- **WHEN** se llama `buscarSolapado*` con `excluirId` igual a su id
- **THEN** no se considera a sí mismo

#### Scenario: listar con filtros desde, hasta y estados [repositorio]

- **GIVEN** turnos existentes
- **WHEN** se lista con `desde`, `hasta` y estados
- **THEN** aplica `fin > desde`, `inicio < hasta` y estados, en el mismo orden que memoria

#### Scenario: actualizar inexistente → RecursoNoEncontradoError [repositorio]

- **GIVEN** un id inexistente
- **WHEN** se llama `actualizar`
- **THEN** lanza `RecursoNoEncontradoError`

### Requirement: Integración HTTP con PERSISTENCE=sqlite

El sistema SHALL exponer la persistencia vía HTTP con paridad de códigos.

#### Scenario: paciente inactivo → 409 RECURSO_INACTIVO [HTTP]

- **GIVEN** un paciente inactivo y un usuario autenticado (tests/helpers/auth.ts)
- **WHEN** se crea un turno para él
- **THEN** responde 409 `RECURSO_INACTIVO`

#### Scenario: solapamiento → 409 TURNO_SOLAPADO_PROFESIONAL [HTTP]

- **GIVEN** un turno activo del profesional `00000000-0000-4000-8000-000000000021` en `[09:00,09:30)` y un usuario autenticado
- **WHEN** se crea otro del mismo profesional en `[09:15,09:45)` con `esSobreturno=false`
- **THEN** responde 409 `TURNO_SOLAPADO_PROFESIONAL`

#### Scenario: turno disponible tras reinicio [HTTP]

- **GIVEN** un turno creado con `PERSISTENCE=sqlite` y un usuario autenticado
- **WHEN** se reinicia el servidor sobre el mismo archivo
- **THEN** el turno sigue disponible

#### Scenario: sesiones en memoria tras reinicio [HTTP]

- **GIVEN** un usuario logueado
- **WHEN** se reinicia el servidor
- **THEN** hay que volver a loguearse

### Requirement: Arranque y seed

El sistema SHALL cargar el seed solo si la base está vacía y de forma idempotente.

#### Scenario: seed no duplica filas [arranque]

- **GIVEN** el servidor arrancó una vez con seed
- **WHEN** arranca una segunda vez sobre el mismo archivo
- **THEN** no duplica filas

#### Scenario: login con DEMO_PASSWORD sigue funcionando [arranque]

- **GIVEN** el servidor arrancado dos veces
- **WHEN** se hace login con `DEMO_PASSWORD`
- **THEN** el login es exitoso

### Requirement: Entidades de apoyo

El sistema SHALL persistir entidades de apoyo con paridad.

#### Scenario: usuarios: buscar por email sin distinguir mayúsculas ni espacios [repositorio]

- **GIVEN** un usuario `admin@demo.local` con `passwordHash`, y otro con `profesionalId`
- **WHEN** se busca con `  ADMIN@demo.local ` y se lee el segundo usuario
- **THEN** se obtiene el primero con el hash intacto
- **AND** el segundo conserva `profesionalId` (en los demás, la propiedad queda ausente y no `null`)

#### Scenario: profesionales: especialidades como arreglo [repositorio]

- **GIVEN** un profesional creado con especialidades
- **WHEN** se lee
- **THEN** las especialidades se obtienen como arreglo

#### Scenario: sillones se leen igual [repositorio]

- **GIVEN** un sillón creado
- **WHEN** se lee
- **THEN** se obtiene igual

#### Scenario: prestaciones se leen igual [repositorio]

- **GIVEN** una prestación creada
- **WHEN** se lee
- **THEN** se obtiene igual

#### Scenario: bloqueo de profesional se guarda y se lee igual [repositorio]

- **GIVEN** un bloqueo del profesional `00000000-0000-4000-8000-000000000021` en `[09:00,09:30)` con motivo `Capacitación demo` y `creadoPor` definido
- **WHEN** se crea y se lee con una conexión nueva al mismo archivo
- **THEN** se obtienen los mismos datos, con `sillonId` ausente (no `null`)

#### Scenario: bloqueo de sillón y bloqueo con ambos recursos [repositorio]

- **GIVEN** un bloqueo del sillón `00000000-0000-4000-8000-000000000011` y otro con profesional y sillón a la vez
- **WHEN** se consulta `buscarSolapadoPorProfesional` y `buscarSolapadoPorSillon` con un intervalo que los superpone
- **THEN** cada consulta devuelve solo los bloqueos de su recurso, y el que tiene ambos aparece en las dos

#### Scenario: bloqueo contiguo no solapa [repositorio]

- **GIVEN** un bloqueo del profesional en `[09:00,09:30)`
- **WHEN** se consulta el solapamiento con `[09:30,10:00)`
- **THEN** no se devuelve ningún bloqueo (intervalos semiabiertos)

#### Scenario: listar bloqueos con filtros y orden [repositorio]

- **GIVEN** varios bloqueos de distintos recursos y horarios
- **WHEN** se lista con `desde`, `hasta`, `profesionalId` o `sillonId`
- **THEN** aplica `fin > desde`, `inicio < hasta` y los recursos, ordenados por `inicio` y, en empate, por orden de creación

#### Scenario: eliminar bloqueo [repositorio]

- **GIVEN** un bloqueo existente
- **WHEN** se elimina y luego se consulta por id y por solapamiento
- **THEN** no se encuentra
- **AND** eliminar un id inexistente no lanza error

Los bloqueos se consultan por otro puerto y no entran en la transacción de crear turno.
