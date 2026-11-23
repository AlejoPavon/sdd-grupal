# Spec Delta

## Purpose

Permite consultar los recursos de referencia de la agenda (profesionales, sillones y prestaciones) para armar la UI de agenda y validar selecciones al crear turnos.

## ADDED Requirements

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