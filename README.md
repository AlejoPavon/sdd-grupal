# 🦷 Turnos Odontología — Sistema de Gestión de Turnos y Agenda

> **Materia:** Metodología I — Tecnicatura Universitaria en Programación
>
> **Trabajo:** Integración — Del Discovery al primer Change con Spec-Driven Development y Active Stack
>
> **Integrantes:** Nathaniel Herrera · Lucas Timmermann · Aracelly Caballero · Javier Alaniz · Alejo Pavon

---

## 📋 ¿Qué es esto?

Sistema de gestión de turnos y agenda de pacientes para consultorios odontológicos, pensado para el mercado argentino. El proyecto se desarrolla siguiendo la metodología **Spec-Driven Development (SDD)** con el ciclo **OPSX** (`explore → propose → apply → verify → archive`), utilizando **Active Stack** como harness metodológico y **OpenSpec** como fuente de verdad del estado de cada cambio.

## 🎯 Objetivo

Recorrer de principio a fin el flujo de trabajo SDD: partir de una idea sin código, investigarla con método (Discovery), fundar el proyecto con un agente de IA y llevar una funcionalidad desde su especificación hasta su archivado mediante un ciclo OPSX completo.

---

## 🚀 Estado del Proyecto

### Fundación (`/active-orchestrator`)

| Etapa | Estado | Descripción |
|-------|--------|-------------|
| **Discovery** | ✅ Completada | Investigación de mercado con 20 sistemas relevados |
| **Knowledge Base** | ⏳ Pendiente | Base de conocimiento del dominio |
| **Roadmap** | ⏳ Pendiente | Plan de implementación (`CHANGES.md`) |
| **Task Management** | ⏳ Pendiente | Gestión de tareas local |
| **Find Skill** | ⏳ Pendiente | Búsqueda de skills relevantes |
| **Skill Registry** | ⏳ Pendiente | Registro de skills disponibles |
| **Agent Instruction** | ⏳ Pendiente | Reglas del agente (`AGENTS.md`) |

### Ciclo OPSX

| Paso | Estado |
|------|--------|
| Explore | ⏳ Pendiente |
| Propose | ⏳ Pendiente |
| Apply | ⏳ Pendiente |
| Verify | ⏳ Pendiente |
| Archive | ⏳ Pendiente |

---

## 📊 Discovery — Hallazgos principales

Se investigaron **20 sistemas** de gestión odontológica (10 argentinos, 5 latinoamericanos, 5 internacionales). Hallazgos clave:

1. **La agenda multi-profesional y la reserva online ya son estándar** en el mercado.
2. **Ningún sistema demuestra públicamente una regla verificable de no-solapamiento por profesional Y por sillón/box** — ese es el diferencial del MVP.
3. **El mercado argentino premia integraciones locales**: WhatsApp, Mercado Pago, ARCA/AFIP.

**Top 5 competidores** (por puntuación ponderada):

| # | Sistema | Puntaje |
|---|---------|---------|
| 1 | Dentalink | 4.65/5 |
| 2 | Bilog | 4.60/5 |
| 3 | DentalSoft Argentina | 4.55/5 |
| 4 | Dentidad | 4.50/5 |
| 5 | Doctocliq | 4.45/5 |

📄 Informe completo: [`docs/discovery/informe-discovery.md`](docs/discovery/informe-discovery.md)

---

## 🏗️ MVP Propuesto

Un sistema acotado que resuelva con reglas verificables:

- ✅ **Turnos sin solapamiento** por profesional y por sillón/box (intervalos semiabiertos `[inicio, fin)`)
- ✅ **Agenda diaria y semanal** con múltiples profesionales
- ✅ **Duración variable** de prestaciones, bloqueos y sobreturnos
- ✅ **Gestión básica de pacientes**
- ✅ **Errores de negocio explícitos** y verificables

---

## 🛠️ Stack Metodológico

| Herramienta | Uso |
|-------------|-----|
| **Active Stack** (modo Full) | Instalador del harness metodológico |
| **OpenSpec CLI** v2.1.0 | Fuente de verdad del ciclo OPSX |
| **OpenCode** | Agente de IA para desarrollo |
| **Engram** v3.7.2 | Memoria persistente entre sesiones |

## 📁 Estructura del Repositorio

```
turnos-odontologia/
├── docs/
│   └── discovery/
│       ├── discovery.md              # Discovery estructurado (11 puntos)
│       ├── informe-discovery.md      # Informe completo (20 sistemas)
│       └── informe-discovery.pdf     # Versión PDF
├── openspec/                         # Workspace de OpenSpec
│   ├── config.yaml
│   ├── specs/                        # Especificaciones
│   └── changes/                      # Changes OPSX
├── .active-orchestrator-state.json   # Estado de la fundación
├── .agents/                          # Skills de OpenCode
└── README.md
```

## 📝 Cómo reproducir

```bash
# 1. Clonar el repositorio
git clone https://github.com/AlejoPavon/sdd-grupal.git
cd sdd-grupal

# 2. Requisitos previos
# - Go 1.26+, Git, Node.js (LTS)
# - OpenCode o Claude Code instalado
# - Active Stack instalado en modo Full

# 3. Abrir con OpenCode y continuar la fundación
opencode
# Dentro de OpenCode: /active-orchestrator:init
```

---

## 📜 Licencia

Proyecto académico — Tecnicatura Universitaria en Programación.
