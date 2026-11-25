# Turnos Odontología — Sistema de Gestión de Turnos y Agenda

![SDD](https://img.shields.io/badge/Methodology-Spec--Driven_Development-00ADD8?style=for-the-badge&logo=blueprint&logoColor=white)
![OpenSpec](https://img.shields.io/badge/OpenSpec-v2.1.0-14b8a6?style=for-the-badge&logo=buffer&logoColor=white)
![Active Stack](https://img.shields.io/badge/Active_Stack-Full_Mode-6366f1?style=for-the-badge&logo=stackshare&logoColor=white)
![Engram](https://img.shields.io/badge/Memory-Engram_v3.7.2-f59e0b?style=for-the-badge&logo=databricks&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)
![OpenCode](https://img.shields.io/badge/AI_Agent-OpenCode-8b5cf6?style=for-the-badge&logo=openai&logoColor=white)

Sistema de gestión de turnos y agenda para consultorios odontológicos en Argentina, con foco en un **MVP de agenda sin solapamientos** por profesional y por sillón. Desarrollado bajo la metodología **Spec-Driven Development (SDD)** con el ciclo **OPSX** (`explore → propose → apply → verify → archive`), utilizando **Active Stack** como harness metodológico y **OpenSpec** como fuente de verdad para el ciclo de vida del software.

> **Materia:** Metodología I — Tecnicatura Universitaria en Programación  
> **Integrantes:** Nathaniel Herrera · Lucas Timmermann · Aracelly Caballero · Javier Alaniz · Alejo Pavon  
> **Fecha:** Noviembre 2026

---

## Architecture & Methodology

El proyecto implementa un enfoque centrado en especificaciones rigurosas (**Spec-Driven Development**) antes de escribir cualquier línea de código de producción:

- **Harness & Sustrato:** [Active Stack](https://github.com/Group-Active-IA/active-stack) en modo Full, proveyendo skills de fundación, catálogo de herramientas y configuración del agente.
- **Ciclo de Desarrollo:** OPSX (`explore → propose → apply → verify → archive`) gobernado por OpenSpec CLI.
- **Orquestación:** `/active-orchestrator` conduciendo las 7 etapas de la fundación guiada bajo protocolo de inspección (*Continuar / Ajustar / Parar acá*).
- **Memoria Persistente:** Engram CLI para trazabilidad y continuidad de contexto entre sesiones del agente.
- **Verificación:** Escenarios de aceptación basados en pruebas automatizadas y reglas de negocio formales.

---

## Fundación del Proyecto (`/active-orchestrator`)

Estado de avance del proceso de fundación del repositorio:

| Etapa | Estado | Artefactos / Salida | Responsable / Rol |
|---|:---:|---|---|
| **0. Preparación del Entorno** | Completada | Active Stack Full, OpenSpec 2.1.0, Engram 3.7.2 | Equipo |
| **1. Discovery & Investigación** | Completada | `docs/discovery/informe-discovery.md` (20 sistemas) | Equipo |
| **2. Knowledge Base (KB)** | Completada | `knowledge-base/` (10 archivos canónicos + README) | Alejo Pavon |
| **3. Roadmap** | Completada | `CHANGES.md` (19 changes, 8 fases) | Alejo Pavon |
| **4. Task Management** | Completada | Tracking local en `.active-stack/roadmap.json` | Equipo |
| **5. Find Skill & Registry** | Completada | `.atl/skill-registry.md` (skills instaladas y auditadas) | Equipo |
| **6. Agent Instructions** | Completada | `AGENTS.md` / `CLAUDE.md` con reglas del agente | Equipo |

### Reparto del equipo

El detalle operativo, las ramas y los criterios de cada tarea están en [`docs/equipo/README.md`](docs/equipo/README.md).

| Integrante | Changes asignados | Ola |
|---|---|---|
| Alejo Pavon | Fundación (Discovery, KB, roadmap, estado) + integración de PRs | 0 y 6 |
| Nathaniel Herrera | C-01 `foundation-setup`, C-02 `core-domain-models` | 1 |
| Lucas Timmermann | C-03 `turno-creation`, C-04 `agenda-queries`, C-05 `turno-cancellation` | 2 y 3 |
| Aracelly Caballero | C-06 `pacientes-crud`, C-10 `sqlite-persistence` | 2 y 4 |
| Javier Alaniz | C-09 `auth-rbac`, C-07 `bloqueos-agenda`, C-08 `sobreturnos` | 3, 4 y 5 |

---

## Core Features & Discovery Findings

### Investigación de Mercado (20 Sistemas)
Se relevó el mercado argentino, latinoamericano e internacional (10 AR, 5 LATAM, 5 Global). 
- **Hallazgo Crítico:** La prevención explícita de solapamientos simultáneos por **profesional** y por **sillón/box dental** no está demostrada públicamente en los sistemas comerciales analizados.
- **Top Competidores Ponderados:** Dentalink (4.65/5), Bilog (4.60/5), DentalSoft Argentina (4.55/5), Dentidad (4.50/5), Doctocliq (4.45/5).

### Reglas de Negocio del MVP
1. **Asignación Dual Inmutable:** Todo turno activo ocupa un profesional y un sillón/box durante un intervalo de tiempo `[inicio, fin)`.
2. **No Solapamiento por Profesional:** Un odontólogo no puede tener dos turnos activos superpuestos.
3. **No Solapamiento por Sillón:** Un sillón dental no puede asignarse a más de un turno activo simultáneamente.
4. **Intervalos Semiabiertos:** Si el Turno A termina a las `15:00` y el Turno B inicia a las `15:00`, **no existe solapamiento**.
5. **Liberación de Agenda:** Las cancelaciones liberan el profesional y el box de forma inmediata y auditable.

---

## Detailed Project Structure

```text
.
├── .active-orchestrator-state.json       # Estado del orquestador y etapas de fundación
├── .agents/                              # Configuración y skills locales del agente
│   └── skills/
│       ├── openspec-apply-change/
│       ├── openspec-archive-change/
│       ├── openspec-explore/
│       ├── openspec-propose/
│       ├── openspec-sync-specs/
│       └── openspec-update-change/
├── .claude/                              # Compatibilidad de skills para Claude Code
├── docs/                                 # Documentación y evidencias
│   ├── discovery/
│   │   ├── discovery.md                  # Checklist estructurado de 11 puntos
│   │   ├── informe-discovery.md          # Informe completo con tabla de 20 sistemas
│   │   ├── informe-discovery.html        # Render HTML del informe
│   │   └── informe-discovery.pdf         # Versión imprimible para entrega
│   └── equipo/                           # Reparto de tareas y guías por integrante
│       ├── README.md                     # Olas, convenciones y flujo Git
│       ├── alejo-pavon.md
│       ├── nathaniel-herrera.md
│       ├── lucas-timmermann.md
│       ├── aracelly-caballero.md
│       └── javier-alaniz.md
├── knowledge-base/                       # Base de conocimiento (10 canónicos + README)
├── src/                                  # Código de la aplicación
│   ├── domain/                           # Entidades, value objects y reglas de negocio
│   ├── application/                      # Casos de uso y puertos de repositorio
│   ├── infrastructure/                   # Adaptadores en memoria, SQLite y seed
│   └── http/                             # Servidor Fastify, rutas, schemas y plugins
├── tests/                                # Tests unitarios e integración (Vitest)
├── migrations/                           # Migraciones SQL de SQLite (C-10)
├── data/                                 # Base SQLite local (ignorada por git)
├── package.json                          # Dependencias, scripts y engines
├── package-lock.json                     # Versiones exactas (usar `npm ci`)
├── tsconfig.json / vitest.config.ts / eslint.config.js
├── .npmrc                                # ignore-scripts (prebuilds N-API)
├── .env.example                          # Variables de entorno de ejemplo
├── CHANGES.md                            # Roadmap: 19 changes en 8 fases
├── openspec/                             # Workspace OpenSpec
│   ├── config.yaml                       # Reglas de herramientas y esquemas
│   ├── changes/                          # Changes activos y archivados
│   │   └── archive/                      # Historial de cambios completados
│   └── specs/                            # Especificaciones consolidadas
├── .gitignore
└── README.md                             # Documentación principal del proyecto
```

---

## Installation & Setup

Siga estos pasos para replicar el entorno de desarrollo y continuar la fundación.

### Prerequisites
- **Git 2.40+**
- **Node.js 22.13 LTS o 24 LTS** (evitá las versiones impares 23 y 25) & **npm 10+**
- **Go 1.26+** (requerido únicamente si compila Active Stack desde fuente)
- **OpenCode** o **Claude Code**

> [!IMPORTANT]
> El proyecto **no soporta Node 20** (`better-sqlite3@13` exige Node `>=22` y `eslint@10` exige `>=22.13`) ni las versiones impares 23/25 (no soportadas por Vitest 5). `package.json` declara `engines.node: "^22.13.0 || ^24.0.0 || >=26.0.0"` y `.npmrc` activa `engine-strict`, así que npm rechaza la instalación con un mensaje claro si la versión no cumple.

---

### Step 1: Clone the Repository

```bash
git clone git@github.com:AlejoPavon/sdd-grupal.git
cd sdd-grupal
```

### Step 2: Install Dependencies

```bash
npm ci                 # instala las versiones exactas de package-lock.json
cp .env.example .env   # opcional: ajustar PORT, PERSISTENCE y DATABASE_URL
```

> [!NOTE]
> `better-sqlite3@13` incluye binarios N-API precompilados para Windows, Linux y macOS. El archivo `.npmrc` fija `ignore-scripts=true` para que npm **no** intente compilar con `node-gyp`: no hace falta Visual Studio ni build tools de C++. Es seguro para el proyecto: `esbuild` (usado por `tsx` y `vitest`) también funciona sin su `postinstall`.
>
> Si necesitás ejecutar los scripts de instalación por algún motivo, usá `npm ci --ignore-scripts=false` (en Windows requerirá las build tools de C++ para `better-sqlite3`).
>
> `.npmrc` también fija `engine-strict=true`: npm rechaza la instalación si Node no cumple `engines.node`, en lugar de fallar más tarde en runtime.

La API usa `PERSISTENCE=memory` por defecto (seed ficticio en memoria). Para persistir en SQLite, configurá `PERSISTENCE=sqlite` y `DATABASE_URL=file:./data/turnos.db`; la carpeta `data/` se crea automáticamente y está ignorada por git.

### Step 3: Verify the Installation

```bash
npm run typecheck      # TypeScript estricto sin errores
npm test               # suite completa (Vitest)
npm run dev            # levanta la API en http://localhost:3000
# en otra terminal:
curl -s http://localhost:3000/health
```

Scripts disponibles: `dev`, `build`, `start`, `test`, `test:watch`, `typecheck` y `lint`.

> [!NOTE]
> El stack usa `fastify@5`, `@fastify/cookie@11` y `zod@4` (migraciones mayores ya aplicadas). `npm audit` reporta **0 vulnerabilidades**.

### Step 4: Active Stack Setup

Active Stack provee los harnesses metodológicos necesarios para OpenCode:

```bash
# Si aún no tiene Active Stack compilado:
git clone https://github.com/Group-Active-IA/active-stack.git /tmp/active-stack
cd /tmp/active-stack
./build.sh

# Instalar en modo Full para OpenCode
./active-stack install --mode full --agent opencode --yes
cd -
```

> [!NOTE]  
> Esto inyecta `active-orchestrator`, `sdd-orchestrator`, Engram MCP y las skills requeridas en `~/.config/opencode/`.

---

### Step 5: Verify Tooling

Asegúrese de que las herramientas CLI externas estén en su `$PATH`:

```bash
# Validar OpenSpec CLI
openspec --version

# Validar Engram
engram --version
```

---

### Step 6: Run the Foundation Orchestrator

Abra OpenCode dentro del directorio del proyecto:

```bash
opencode
```

Una vez dentro de la sesión de OpenCode, invoque el orquestador para continuar las fases pendientes:

```text
/active-orchestrator:init
```

> [!IMPORTANT]  
> En cada etapa de la fundación, aplique el **protocolo de inspección** antes de aceptar: revise lo generado y elija con criterio propio entre **Continuar**, **Ajustar** o **Parar acá**.
