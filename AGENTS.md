# Turnos Odontología — Instrucciones para Agentes

> Este archivo (y su copia `CLAUDE.md`) es lo PRIMERO que todo agente lee al entrar al repo.
> Generado a partir de `knowledge-base/` y `CHANGES.md`. No editar a mano sin re-sincronizar ambos archivos.

---

## Stack Tecnológico

| Capa | Tecnología | Versión mínima | Notas |
|---|---|---|---|
| Runtime | Node.js | 22.13 / 24 LTS | `engines.node` en `package.json`; `better-sqlite3` usa prebuilds N-API |
| Lenguaje | TypeScript | 5.x | Modo estricto (`strict: true`) |
| Gestor de paquetes | npm | 10.x | `better-sqlite3` con prebuilds N-API; no requiere compilador |
| API HTTP | Fastify | 5.x | JSON, validación con schemas Zod manuales; `@fastify/cookie@11` |
| Validación | Zod | 4.x | Schemas de entrada y errores de negocio |
| Tests | Vitest | 5.x | Unitarios e integración |
| Persistencia (default dev) | Repositorio en memoria | — | `PERSISTENCE=memory`; seed ficticio, sin base de datos |
| Persistencia (SQLite) | SQLite + `better-sqlite3` | 13.x | `PERSISTENCE=sqlite`; `DATABASE_URL=file:./data/turnos.db` |
| Fechas | `Date`/ISO 8601 UTC | — | Zona de negocio: `America/Argentina/Buenos_Aires` |

Detalle completo: [knowledge-base/02_descripcion_general.md](knowledge-base/02_descripcion_general.md)

---

## Base de Conocimiento

La fuente de verdad del dominio vive en `knowledge-base/`. **Leé el archivo relevante ANTES de implementar.**

| Archivo | Cuándo leerlo |
|---|---|
| [01_vision_y_objetivos.md](knowledge-base/01_vision_y_objetivos.md) | Entender propósito y alcance |
| [02_descripcion_general.md](knowledge-base/02_descripcion_general.md) | Stack, arquitectura, integraciones y resumen de API |
| [03_actores_y_roles.md](knowledge-base/03_actores_y_roles.md) | Auth, RBAC, permisos |
| [04_modelo_de_datos.md](knowledge-base/04_modelo_de_datos.md) | Entidades, ERD, migraciones |
| [05_reglas_de_negocio.md](knowledge-base/05_reglas_de_negocio.md) | Reglas codificadas (RN-XX) |
| [06_funcionalidades.md](knowledge-base/06_funcionalidades.md) | Historias de usuario por épica |
| [07_flujos_principales.md](knowledge-base/07_flujos_principales.md) | Flujos E2E |
| [08_arquitectura_propuesta.md](knowledge-base/08_arquitectura_propuesta.md) | Patrones, estructura, env vars |
| [09_decisiones_y_supuestos.md](knowledge-base/09_decisiones_y_supuestos.md) | Decisiones DD y supuestos SU |
| [10_preguntas_abiertas.md](knowledge-base/10_preguntas_abiertas.md) | ⚠️ Inconsistencias a resolver ANTES de codear |

> ⚠️ Resolver las preguntas de prioridad **Alta** de `10_preguntas_abiertas.md` antes de arrancar el primer change (autenticación en primer change, API REST sin frontend, datos ficticios en memoria, aceptación de 5 integrantes).

---

## Skills Disponibles

Fuente de verdad: `.atl/skill-registry.md` (generado por `skill-registry`). Esta tabla solo mapea skill→rol.

| Agente | Rol | Skills que carga |
|---|---|---|
| **Backend Core** | Dominio y aplicación (entidades, reglas RN-AG/RN-TU, casos de uso) | `kb-creator`, `roadmap-generator`, `agent-instruction` |
| **Backend HTTP** | Rutas Fastify, validación Zod, mapeo de errores | `openspec-apply-change`, `openspec-explore`, `openspec-propose` |
| **Fundación** | Contexto e instrucciones, roadmap, registro de skills | `active-orchestrator`, `skill-registry`, `skill-creator`, `find-skills` |
| **Discovery/Research** | Investigación de mercado y competidores | `discovery-research`, `web-scraper` |
| **Diseño (futuro)** | Sistema visual y mockups (proyecto sin UI en v0.1) | `design-system`, `design-taste-frontend-v1`, `emil-design-eng` |
| **OpenSpec** | Ciclo explore/propose/apply/archive/sync/update | `openspec-explore`, `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-sync-specs`, `openspec-update-change` |

Cargá la skill correspondiente al contexto ANTES de escribir código.

> Los compact rules de cada skill los resuelve el orquestador desde `.atl/skill-registry.md` (generado por `skill-registry`; no versionado — no está en el repo). Esta tabla solo mapea skill→rol.

---

## Roadmap de Changes

El plan de implementación completo está en [CHANGES.md](CHANGES.md). Resumen:

- **Total**: 19 changes en 8 fases.
- **Camino crítico** (7): `C-01 → C-02 → C-03 → C-05 → C-10 → C-11 → C-12`.
- **Primer change**: `C-01` (foundation-setup).
- MVP demostrable se cierra con C-01 a C-06; producto operable con C-07 a C-12.

**Antes de iniciar un item**: leé [CHANGES.md](CHANGES.md), identificá las dependencias del change y los archivos de "Leer antes".

---

## Reglas Duras

> Reglas **globales** ya definidas en el archivo global de instrucciones del cliente activo (orquestador, governance, TDD, engram, design-mockups): el proyecto las **hereda**, no se repiten acá.

Acá van: (a) las reglas específicas de este proyecto, derivadas de su stack (Node 22.13 / TS 5 strict / Fastify 5 / Zod 4 / Vitest 5 / memoria o SQLite) y **confirmadas con el usuario**; y (b) las universales que el global no cubre. Son contrato; romperlas es un defecto. Formato `NUNCA X → hacer Y`:

1. NUNCA usar `any` en TypeScript → tipar estricto; componentes/tipos en `PascalCase`, funciones/variables en `camelCase`; `strict: true`.
2. NUNCA validar entrada fuera de Zod en el borde HTTP → schemas Zod en Fastify; el dominio no conoce Fastify/Zod/persistencia.
3. NUNCA poner reglas de solapamiento fuera del dominio → RN-AG-* viven en domain y se testean sin levantar el servidor.
4. NUNCA emitir error de negocio sin código estable → usar códigos (`TURNO_SOLAPADO_PROFESIONAL`, `TURNO_SOLAPADO_SILLON`, etc.) y shape `{ code, message, details }`.
5. NUNCA representar fechas fuera de ISO 8601 UTC → zona de negocio `America/Argentina/Buenos_Aires` solo en presentación; intervalos semiabiertos `[inicio, fin)`.
6. NUNCA acoplar el dominio o la aplicación a una DB → la persistencia va detrás de puertos `*Repository`; memoria es el default (`PERSISTENCE=memory`) y SQLite es opcional (`PERSISTENCE=sqlite`, C-10).
7. NUNCA usar datos reales de pacientes → todo dato de paciente es ficticio (KB README).
8. NUNCA saltear TDD → tests con Vitest; ciclo RED/GREEN/TRIANGULATE/REFACTOR (global).
9. NUNCA buildear, commitear o pushear sin pedido explícito del usuario.
10. NUNCA incluir `Co-Authored-By` de IA en commits → commits convencionales sin co-autoría IA.
11. NUNCA pushear directo a `main` → todo cambio en rama dedicada `feat/c-XX-...` e integración vía Pull Request tras pasar `npm run typecheck` y `npm test`.

---

## Flujo de Trabajo

```
1. Leer la KB relevante (knowledge-base/)        → entender el dominio
2. Identificar el change en CHANGES.md           → respetar dependencias
3. Acordar alcance y criterios de aceptación
4. Implementar y verificar respetando las reglas del proyecto
5. Registrar la evidencia y actualizar el estado en CHANGES.md
```

Aplicar TODAS las reglas duras en cada paso. Ante conflicto entre la KB y este archivo, las reglas duras prevalecen. Resolver las preguntas de prioridad Alta de `10_preguntas_abiertas.md` antes del primer change.