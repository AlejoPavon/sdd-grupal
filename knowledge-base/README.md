# Turnos Odontología — Base de Conocimiento

Base de conocimiento generada por **kb-creator** (modo import) a partir de:

- [`../docs/discovery/informe-discovery.md`](../docs/discovery/informe-discovery.md) — investigación de 20 sistemas, matriz ponderada y MVP recomendado.
- [`../docs/discovery/discovery.md`](../docs/discovery/discovery.md) — checklist de discovery (problema, usuarios, reglas, riesgos).

> Todo dato de paciente en esta base es ficticio. Prohibido usar datos reales de personas.

## Índice de Archivos

| Archivo | Contenido |
|---|---|
| [01_vision_y_objetivos.md](01_vision_y_objetivos.md) | Propósito, objetivos por actor, alcance v0.1 y fuera de alcance |
| [02_descripcion_general.md](02_descripcion_general.md) | Stack, arquitectura, integraciones y resumen de API |
| [03_actores_y_roles.md](03_actores_y_roles.md) | Actores, matriz RBAC y rutas públicas |
| [04_modelo_de_datos.md](04_modelo_de_datos.md) | Dominios, ERD, entidades, constraints, índices y seed |
| [05_reglas_de_negocio.md](05_reglas_de_negocio.md) | Reglas codificadas RN-AG, RN-TU, RN-PA, RN-AD, RN-SE, RN-EX |
| [06_funcionalidades.md](06_funcionalidades.md) | Épicas e historias de usuario con criterios de aceptación |
| [07_flujos_principales.md](07_flujos_principales.md) | Flujos de crear, cancelar, consultar agenda y reservar |
| [08_arquitectura_propuesta.md](08_arquitectura_propuesta.md) | Patrones, estructura de directorios, seguridad y variables de entorno |
| [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md) | Decisiones DD y supuestos SU con riesgos y validación |
| [10_preguntas_abiertas.md](10_preguntas_abiertas.md) | Inconsistencias IN y preguntas priorizadas PQ |

## Quick Start para Desarrolladores

1. Entender el dominio → [01](01_vision_y_objetivos.md), [03](03_actores_y_roles.md)
2. Entender los datos → [04](04_modelo_de_datos.md)
3. Entender las reglas → [05](05_reglas_de_negocio.md)
4. Entender la arquitectura → [02](02_descripcion_general.md), [08](08_arquitectura_propuesta.md)
5. Implementar → [07](07_flujos_principales.md), [06](06_funcionalidades.md)
6. Antes de codificar → [10](10_preguntas_abiertas.md)

## Resumen Ejecutivo

Sistema de turnos para consultorios odontológicos argentinos cuyo núcleo es una regla verificable: **ningún turno puede solaparse con otro del mismo profesional ni del mismo sillón**, con intervalos semiabiertos y cancelación que libera el horario. El MVP entrega una API REST en TypeScript + Node.js, con dominio aislado, persistencia en memoria y tests automatizados; facturación, cobros, obra social, historia clínica y reserva online quedan para etapas posteriores.

## Estado de la KB

- Modo: import (Mode A)
- Fuentes: Discovery del proyecto
- Fecha de generación: 2026-11-18
- Estado: generada; pendiente de revisión del usuario antes de planificar changes
