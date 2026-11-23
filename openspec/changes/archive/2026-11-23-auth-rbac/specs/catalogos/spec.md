# Spec Delta

## ADDED Requirements

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
