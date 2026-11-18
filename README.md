# 🦷 Turnos Odontología — Sistema de Gestión de Turnos y Agenda

![SDD](https://img.shields.io/badge/Methodology-Spec--Driven_Development-00ADD8?style=for-the-badge&logo=blueprint&logoColor=white)
![OpenSpec](https://img.shields.io/badge/OpenSpec-v2.1.0-14b8a6?style=for-the-badge&logo=buffer&logoColor=white)
![Active Stack](https://img.shields.io/badge/Active_Stack-Full_Mode-6366f1?style=for-the-badge&logo=stackshare&logoColor=white)
![Engram](https://img.shields.io/badge/Memory-Engram_v3.7.2-f59e0b?style=for-the-badge&logo=databricks&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)
![OpenCode](https://img.shields.io/badge/AI_Agent-OpenCode-8b5cf6?style=for-the-badge&logo=openai&logoColor=white)

Sistema integral de gestión de turnos y agenda de pacientes para consultorios odontológicos en Argentina. Desarrollado bajo la metodología **Spec-Driven Development (SDD)** con el ciclo **OPSX** (`explore → propose → apply → verify → archive`), utilizando **Active Stack** como harness metodológico y **OpenSpec** como fuente de verdad para el ciclo de vida del software.

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
| **0. Preparación del Entorno** | ✅ Completada | Active Stack Full, OpenSpec 2.1.0, Engram 3.7.2 | Equipo |
| **1. Discovery & Investigación** | ✅ Completada | `docs/discovery/informe-discovery.md` (20 sistemas) | Equipo |
| **2. Knowledge Base (KB)** | ⏳ En Progreso | `knowledge-base/` (dominio, arquitectura y decisiones) | Alejo Pavon |
| **3. Roadmap** | ⏳ Pendiente | `CHANGES.md` (lista priorizada de changes y dependencias) | Equipo |
| **4. Task Management** | ⏳ Pendiente | Tracking local en `.active-stack/roadmap.json` | Equipo |
| **5. Find Skill & Registry** | ⏳ Pendiente | `.atl/skill-registry.md` (skills instaladas y auditadas) | Equipo |
| **6. Agent Instructions** | ⏳ Pendiente | `AGENTS.md` / `CLAUDE.md` con reglas del agente | Equipo |

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
│   └── discovery/
│       ├── discovery.md                  # Checklist estructurado de 11 puntos
│       ├── informe-discovery.md          # Informe completo con tabla de 20 sistemas
│       ├── informe-discovery.html        # Render HTML del informe
│       └── informe-discovery.pdf         # Versión imprimible para entrega
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
- **Node.js LTS (v20+)** & **NPM**
- **Go 1.26+** (requerido únicamente si compila Active Stack desde fuente)
- **OpenCode** o **Claude Code**

---

### Step 1: Clone the Repository

```bash
git clone git@github.com:AlejoPavon/sdd-grupal.git
cd sdd-grupal
```

### Step 2: Active Stack Setup

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

### Step 3: Verify Tooling

Asegúrese de que las herramientas CLI externas estén en su `$PATH`:

```bash
# Validar OpenSpec CLI
openspec --version

# Validar Engram
engram --version
```

---

### Step 4: Run the Foundation Orchestrator

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
