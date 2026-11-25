# Descripción General

## Stack tecnológico

| Capa | Tecnología | Versión mínima | Notas |
|---|---|---|---|
| Runtime | Node.js | 22.13 / 24 LTS | `engines.node: ^22.13.0 \|\| ^24.0.0 \|\| >=26.0.0`; Node 20 no es compatible con `better-sqlite3@13` ni con `eslint@10` |
| Lenguaje | TypeScript | 5.x | Modo estricto (`strict: true`) |
| Gestor de paquetes | npm | 10.x | `better-sqlite3` trae prebuilds N-API; no requiere compilador ni Visual Studio |
| API HTTP | Fastify | 5.x | JSON, validación con schemas Zod manuales; `@fastify/cookie@11` |
| Validación | Zod | 4.x | Schemas de entrada y errores de negocio |
| Tests | Vitest | 5.x | Unitarios e integración |
| Persistencia (default dev) | Repositorio en memoria | — | `PERSISTENCE=memory`; seed ficticio, sin base de datos |
| Persistencia (SQLite) | SQLite + `better-sqlite3` | 13.x | `PERSISTENCE=sqlite`; `DATABASE_URL=file:./data/turnos.db` |
| Fechas | `Date`/ISO 8601 UTC | — | Zona de negocio: `America/Argentina/Buenos_Aires` |

**Decisión de stack:** el README del repositorio declara Node.js LTS y la consigna permite una API o un módulo de dominio sin interfaz gráfica. Se elige TypeScript + Node.js por tipado del dominio, velocidad de testeo y facilidad de reproducción local. Ver `09_decisiones_y_supuestos.md` (DD-01).

## Arquitectura general

Arquitectura en capas con el dominio en el centro y dependencias hacia adentro:

```text
┌──────────────────────────────────────────────┐
│  HTTP / Fastify (infrastructure/http)         │
│  - rutas, validación Zod, mapeo de errores    │
└───────────────────┬──────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│  Aplicación (application)                     │
│  - casos de uso: crearTurno, cancelarTurno    │
│  - puertos: TurnoRepository, PacienteRepo     │
└───────────────────┬──────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│  Dominio (domain)                             │
│  - entidades y value objects                  │
│  - reglas RN-AG-*, RN-TU-*                    │
│  - errores de negocio tipados                 │
└───────────────────┬──────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│  Infraestructura (infrastructure)             │
│  - InMemoryTurnoRepository                    │
│  - InMemoryPacienteRepository                 │
└──────────────────────────────────────────────┘
```

El dominio no conoce Fastify, Zod ni la persistencia. Las reglas de solapamiento viven en el dominio y se testean sin levantar el servidor.

## Integraciones externas

| Servicio | Propósito | Tipo | Estado |
|---|---|---|---|
| WhatsApp Business API | Recordatorios y confirmaciones | REST/webhook | Etapa posterior |
| Mercado Pago | Señas y pagos | REST/SDK | Etapa posterior |
| AFIP/ARCA | Factura electrónica | Web service | Etapa posterior |
| Google Calendar | Sincronización de agenda | REST/OAuth | Etapa posterior |
| Obras sociales/prepagas | Validación y liquidación | API/archivo | Etapa posterior |

El MVP **no** requiere credenciales ni servicios externos. Esto mantiene el repositorio reproducible y sin secretos.

## API REST (resumen)

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| `GET` | `/health` | Health check | MVP |
| `POST` | `/api/turnos` | Crear turno con validación de solapamientos | MVP |
| `GET` | `/api/turnos` | Listar turnos por rango, profesional o sillón | MVP |
| `GET` | `/api/turnos/:id` | Obtener un turno | MVP |
| `PATCH` | `/api/turnos/:id/cancelar` | Cancelar y liberar horario | MVP |
| `GET` | `/api/pacientes` | Listar/buscar pacientes | MVP |
| `POST` | `/api/pacientes` | Alta de paciente | MVP |
| `PATCH` | `/api/pacientes/:id` | Editar paciente | MVP |
| `GET` | `/api/profesionales` | Listar profesionales | MVP |
| `GET` | `/api/sillones` | Listar sillones/boxes | MVP |
| `GET` | `/api/prestaciones` | Listar prestaciones y duraciones | MVP |
| `GET` | `/api/disponibilidad` | Consultar huecos libres | Etapa posterior |
| `POST` | `/api/reservas` | Reserva online pública | Etapa posterior |

### Convenciones

- Fechas y horas en **ISO 8601 UTC** (`2026-11-18T13:00:00.000Z`); la zona de negocio se aplica en la capa de presentación.
- Intervalos **semiabiertos** `[inicio, fin)`: un turno que termina a las 10:30 y otro que empieza a las 10:30 **no** se solapan.
- Errores de negocio con código estable (`TURNO_SOLAPADO_PROFESIONAL`, `TURNO_SOLAPADO_SILLON`, `TURNO_FUERA_DE_HORARIO`, etc.).
- Respuestas de error en JSON: `{ "code": "...", "message": "...", "details": {...} }`.
