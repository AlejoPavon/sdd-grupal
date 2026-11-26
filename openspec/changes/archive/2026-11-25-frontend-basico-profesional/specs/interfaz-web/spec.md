# Spec Delta

## Purpose

Define el comportamiento observable del cliente web que permite al consultorio operar agenda, pacientes y bloqueos sobre la API existente, presentando la información en la zona horaria del consultorio y respetando los permisos por rol.

## ADDED Requirements

### Requirement: Acceso con sesión persistente

La interfaz SHALL permitir iniciar sesión con las credenciales demo, restaurar la sesión vigente al cargar la página y cerrarla mediante la API existente. Ante un `401` SHALL volver a la pantalla de acceso y mostrar un mensaje.

#### Scenario: Ingreso con credenciales válidas
- **WHEN** un usuario envía el formulario de acceso con credenciales válidas
- **THEN** la interfaz muestra la agenda con la identidad y el rol del usuario

#### Scenario: Sesión restaurada al recargar
- **WHEN** se recarga la página con una sesión válida
- **THEN** la interfaz muestra directamente la agenda sin pedir credenciales

#### Scenario: Cierre de sesión
- **WHEN** el usuario elige salir
- **THEN** la sesión se cierra en el servidor y se muestra la pantalla de acceso

#### Scenario: Sesión expirada
- **WHEN** una acción de la interfaz recibe `401`
- **THEN** se muestra el mensaje de sesión expirada y se vuelve a la pantalla de acceso

### Requirement: Consulta de la agenda del día

La interfaz SHALL mostrar los turnos activos que intersectan el día seleccionado, filtrables por profesional, con hora y fecha presentadas en `America/Argentina/Buenos_Aires` y un estado vacío cuando no hay resultados.

#### Scenario: Agenda con turnos
- **WHEN** el usuario elige una fecha y un profesional con turnos
- **THEN** se listan los turnos con inicio, fin, paciente, prestación, profesional, sillón y estado en la zona del consultorio

#### Scenario: Agenda vacía
- **WHEN** no hay turnos para los filtros elegidos
- **THEN** se muestra un mensaje de estado vacío en lugar de una tabla

#### Scenario: Turno cancelado
- **WHEN** se cancela un turno desde la agenda
- **THEN** la lista se actualiza y el turno deja de figurar entre los activos

### Requirement: Alta y búsqueda de pacientes

La interfaz SHALL permitir listar, buscar y crear pacientes usando la API existente, con datos ficticios y un mensaje de confirmación tras el alta.

#### Scenario: Buscar paciente
- **WHEN** el usuario busca por nombre, apellido o documento
- **THEN** se muestran solo los pacientes que coinciden

#### Scenario: Crear paciente
- **WHEN** se envía nombre y apellido válidos
- **THEN** se confirma el alta y el paciente aparece en el listado

#### Scenario: Selector de nuevo turno sin filtro previo
- **WHEN** el usuario abre la pantalla de nuevo turno después de haber buscado pacientes
- **THEN** el selector ofrece el listado completo de pacientes y no el resultado filtrado

### Requirement: Creación de turno desde catálogos

La interfaz SHALL ofrecer profesionales, sillones y prestaciones de la API, interpretar la fecha y hora elegidas en `America/Argentina/Buenos_Aires`, enviar el `inicio` como ISO 8601 UTC y volver a la agenda tras guardar.

#### Scenario: Guardar turno
- **WHEN** se eligen paciente, profesional, sillón, prestación y una hora local libre
- **THEN** se crea el turno, se confirma el guardado y se muestra en la agenda

#### Scenario: Fecha local convertida a UTC
- **WHEN** se elige una hora local del consultorio
- **THEN** la request envía el instante equivalente en ISO 8601 UTC con intervalo `[inicio, fin)`

### Requirement: Errores de negocio comprensibles

La interfaz SHALL mostrar el `message` de las respuestas de error y, para conflictos de turno, SHALL incluir el intervalo del turno en conflicto cuando `details` lo aporte.

#### Scenario: Conflicto de profesional
- **WHEN** la API responde `409 TURNO_SOLAPADO_PROFESIONAL` con `details.turnoEnConflicto`
- **THEN** se muestra el mensaje del error y el horario del turno que ocupa el profesional

#### Scenario: Permiso insuficiente
- **WHEN** la API responde `403`
- **THEN** se muestra un mensaje que indica que el usuario no tiene permiso

#### Scenario: Datos inválidos
- **WHEN** la API responde `400 VALIDACION_FALLIDA`
- **THEN** se muestra un mensaje que pide revisar los datos ingresados

### Requirement: Visualización de bloqueos según el rol

La interfaz SHALL mostrar la sección de bloqueos solo a `administrador` y `recepcionista`, y SHALL presentar los bloqueos devueltos por la API en la zona del consultorio.

#### Scenario: Rol de gestión
- **WHEN** inicia sesión un usuario con rol de gestión
- **THEN** la navegación incluye la sección de bloqueos y se pueden consultar los bloqueos

#### Scenario: Rol profesional
- **WHEN** inicia sesión un usuario con rol `profesional`
- **THEN** la sección de bloqueos no está disponible en la navegación

### Requirement: Entrega estática y segura

El servidor SHALL entregar los archivos de la interfaz sin exigir sesión y SHALL limitar los archivos servidos a una lista explícita, sin exponer otros archivos del repositorio.

#### Scenario: Acceso público al cliente
- **WHEN** se solicita `/` sin sesión
- **THEN** se sirve el documento HTML de la interfaz

#### Scenario: Archivo no permitido
- **WHEN** se solicita un archivo del repositorio como `/package.json`
- **THEN** se responde `404`

#### Scenario: Health check intacto
- **WHEN** se solicita `/health`
- **THEN** se responde `200` con `{ "status": "ok" }`

### Requirement: Presentación responsive y accesible

La interfaz SHALL conservar su usabilidad en 390x844 y 1440x900, con foco visible y respeto a `prefers-reduced-motion`.

#### Scenario: Vista móvil
- **WHEN** se abre la interfaz en 390x844
- **THEN** las vistas y formularios se adaptan al ancho sin perder controles

#### Scenario: Movimiento reducido
- **WHEN** el sistema solicita `prefers-reduced-motion`
- **THEN** las transiciones de la interfaz se desactivan
