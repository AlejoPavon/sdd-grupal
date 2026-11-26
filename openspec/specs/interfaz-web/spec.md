# interfaz-web Specification

## Purpose

Define el comportamiento observable del cliente web que permite al consultorio operar agenda, pacientes y bloqueos sobre la API existente, presentando la información en la zona horaria del consultorio y respetando los permisos por rol.

## Requirements

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

La interfaz SHALL mostrar la sección de bloqueos solo a `administrador` y `recepcionista`, SHALL presentar los bloqueos devueltos por la API en la zona del consultorio y SHALL ofrecer en esa sección solo las acciones permitidas para el rol de la sesión.

#### Scenario: Rol de gestión

- **WHEN** inicia sesión un usuario con rol de gestión
- **THEN** la navegación incluye la sección de bloqueos, se pueden consultar los bloqueos y crear bloqueos

#### Scenario: Rol profesional

- **WHEN** inicia sesión un usuario con rol `profesional`
- **THEN** la sección de bloqueos no está disponible en la navegación

#### Scenario: Acciones por rol dentro de la sección

- **WHEN** un `recepcionista` y un `administrador` abren la pestaña de bloqueos
- **THEN** ambos ven el formulario de alta y el listado, y solo el `administrador` ve la acción de eliminación

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

### Requirement: Alta de bloqueos desde la pestaña de bloqueos

La interfaz SHALL permitir a `administrador` y `recepcionista` crear un bloqueo de profesional mediante la API existente, enviando `profesionalId`, `inicio`, `fin` y `motivo`, y SHALL recargar el listado y mostrar una confirmación tras el alta.

#### Scenario: Bloqueo creado desde la interfaz

- **WHEN** se elige un profesional, un rango de fechas válido y un motivo, y se envía el formulario
- **THEN** la interfaz envía `POST /api/bloqueos` con `profesionalId`, `inicio`, `fin` y `motivo`
- **AND** tras la respuesta satisfactoria muestra una confirmación y vuelve a consultar los bloqueos

#### Scenario: La API rechaza el alta

- **WHEN** la API responde un error al crear el bloqueo
- **THEN** la interfaz muestra el mensaje de error al usuario sin presentar el bloqueo como creado

### Requirement: Selector de profesionales para bloqueos

La interfaz SHALL poblar el selector de profesionales del formulario con los datos devueltos por `GET /api/profesionales`, presentando el nombre de cada profesional y una opción inicial que obliga a elegir uno.

#### Scenario: Profesionales disponibles al navegar a bloqueos

- **WHEN** el usuario abre la pestaña de bloqueos
- **THEN** el selector contiene los profesionales del catálogo y ninguno aparece preseleccionado

#### Scenario: Selector sin bloqueos reales

- **WHEN** la API devuelve una lista de bloqueos vacía
- **THEN** el formulario y su selector de profesionales siguen disponibles

### Requirement: Rango de fechas del formulario de bloqueos

La interfaz SHALL ofrecer fechas `desde` y `hasta` con valor inicial igual al día actual en `America/Argentina/Buenos_Aires`, interpretar ambos extremos como días completos de esa zona en ISO 8601 UTC con extremo final inclusivo, y rechazar localmente un rango invertido o de un solo día antes de enviar la request.

#### Scenario: Fechas por defecto y conversión del rango

- **WHEN** se abre el formulario y se eligen `desde` y `hasta`
- **THEN** ambos campos muestran inicialmente el día actual de la zona del consultorio
- **AND** la request envía el inicio del primer día y el fin del último día en ISO 8601 UTC

#### Scenario: Rango de varios días

- **WHEN** se elige un `hasta` posterior a `desde`
- **THEN** el bloqueo comprende todos los días desde `desde` hasta `hasta`, inclusive

#### Scenario: Fecha invertida o igual

- **WHEN** `hasta` es anterior o igual a `desde`
- **THEN** la interfaz muestra un mensaje de error y no envía la request

### Requirement: Bloqueo ilustrativo en la pestaña de bloqueos

La interfaz SHALL mostrar un bloqueo de ejemplo claramente etiquetado `Ejemplo`, con el primer profesional del catálogo y fechas demo fijas, aun cuando no existan bloqueos reales, sin persistirlo ni alterar las respuestas de la API.

#### Scenario: Lista real vacía

- **WHEN** la API devuelve ningún bloqueo
- **THEN** la pestaña muestra el bloqueo etiquetado `Ejemplo` junto al mensaje de lista vacía

#### Scenario: Lista real con bloqueos

- **WHEN** la API devuelve bloqueos reales
- **THEN** el ejemplo se muestra diferenciado de los bloqueos reales y no se agrega a la API ni al seed

### Requirement: Eliminación de bloqueos por administración

La interfaz SHALL ofrecer una acción de eliminación de bloqueos solo a `administrador`, invocar `DELETE /api/bloqueos/:id` y recargar el listado tras una eliminación correcta.

#### Scenario: Eliminación por administrador

- **WHEN** un `administrador` elimina un bloqueo desde la interfaz
- **THEN** se envía `DELETE /api/bloqueos/:id`, se muestra una confirmación y el bloqueo deja de figurar en el listado

#### Scenario: Eliminación rechazada

- **WHEN** la API responde un error al eliminar el bloqueo
- **THEN** la interfaz muestra el mensaje de error y mantiene el bloqueo en el listado

#### Scenario: Recepcionista sin acción de eliminación

- **WHEN** un `recepcionista` consulta los bloqueos
- **THEN** no se muestra ninguna acción de eliminación
