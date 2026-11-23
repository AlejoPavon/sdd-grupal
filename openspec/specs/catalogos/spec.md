# catalogos Specification

## Purpose

Permite consultar los recursos de referencia de la agenda (profesionales, sillones y prestaciones) para armar la UI de agenda y validar selecciones al crear turnos.

## Requirements

### Requirement: Listar profesionales

El sistema SHALL devolver, mediante `GET /api/profesionales`, la lista de profesionales registrados.

#### Scenario: Listado de profesionales

- **WHEN** se envía `GET /api/profesionales`
- **THEN** se responde `200` con un arreglo de profesionales

### Requirement: Listar sillones

El sistema SHALL devolver, mediante `GET /api/sillones`, la lista de sillones registrados.

#### Scenario: Listado de sillones

- **WHEN** se envía `GET /api/sillones`
- **THEN** se responde `200` con un arreglo de sillones

### Requirement: Listar prestaciones

El sistema SHALL devolver, mediante `GET /api/prestaciones`, la lista de prestaciones registradas.

#### Scenario: Listado de prestaciones

- **WHEN** se envía `GET /api/prestaciones`
- **THEN** se responde `200` con un arreglo de prestaciones

### Requirement: Autenticación obligatoria en catálogos

El sistema SHALL exigir una sesión válida en los listados de profesionales, sillones y prestaciones y SHALL responder `401` con código `NO_AUTENTICADO` cuando la request no incluye una sesión válida.

#### Scenario: Profesionales sin sesión

- **WHEN** se envía `GET /api/profesionales` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Sillones sin sesión

- **WHEN** se envía `GET /api/sillones` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Prestaciones sin sesión

- **WHEN** se envía `GET /api/prestaciones` sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Catálogos con cualquier rol autenticado

- **WHEN** un usuario autenticado con rol `administrador`, `recepcionista` o `profesional` envía `GET /api/profesionales`, `GET /api/sillones` o `GET /api/prestaciones`
- **THEN** se responde `200` con el listado correspondiente
