# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
