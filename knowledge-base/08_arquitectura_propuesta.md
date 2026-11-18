# Arquitectura Propuesta

## Patrones aplicados

| Patrón | Dónde se usa | Por qué |
|---|---|---|
| Arquitectura en capas / puertos y adaptadores | `domain`, `application`, `infrastructure`, `http` | Aísla las reglas de agenda de Fastify y de la persistencia |
| Repository | `TurnoRepository`, `PacienteRepository`, etc. | Permite empezar en memoria y migrar a SQLite/PostgreSQL sin tocar el dominio |
| Caso de uso (application service) | `CrearTurno`, `CancelarTurno` | Orquesta repositorios y reglas en una transacción lógica |
| Errores de dominio tipados | `TurnoSolapadoError`, `IntervaloInvalidoError` | Códigos estables y mapeo HTTP determinístico |
| Validación en el borde | Zod en `http/schemas` | El dominio recibe datos ya tipados |
| Value objects | `Intervalo`, `EstadoTurno` | Encapsula la comparación semiabierta y las transiciones válidas |

## Estructura de directorios

```text
turnos-odontologia/
├── src/
│   ├── domain/
│   │   ├── turno/
│   │   │   ├── turno.ts
│   │   │   ├── intervalo.ts
│   │   │   ├── estado-turno.ts
│   │   │   └── turno.errors.ts
│   │   ├── paciente/
│   │   ├── profesional/
│   │   ├── sillon/
│   │   └── prestacion/
│   ├── application/
│   │   ├── crear-turno.ts
│   │   ├── cancelar-turno.ts
│   │   └── ports/
│   │       ├── turno-repository.ts
│   │       └── paciente-repository.ts
│   ├── infrastructure/
│   │   └── persistence/
│   │       ├── in-memory-turno-repository.ts
│   │       └── in-memory-paciente-repository.ts
│   ├── http/
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── error-handler.ts
│   └── main.ts
├── tests/
│   ├── unit/
│   │   └── dominio/
│   └── integration/
│       └── api/
├── docs/
│   └── discovery/
├── knowledge-base/
├── openspec/
│   ├── specs/
│   └── changes/
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Seguridad

- **Autenticación:** no implementada en v0.1; contrato RBAC documentado en `03_actores_y_roles.md`. Cuando se incorpore, sesiones con cookie `httpOnly` + `secure` o JWT de corta duración.
- **Autorización:** por rol y por pertenencia (un profesional solo ve sus turnos).
- **Validación de input:** Zod en todas las rutas; rechazo temprano con `400`.
- **Errores:** no exponer stack traces ni detalles internos en producción.
- **Secretos:** ninguno en el repositorio; `.env` ignorado por git y `.env.example` con valores ficticios.
- **Datos de salud:** la historia clínica no existe en v0.1. Antes de incorporarla se exige cifrado en reposo, auditoría de accesos y política de retención.
- **Privacidad:** datos de pacientes siempre ficticios en tests, seeds, documentación y capturas (Ley 25.326).

## Variables de entorno

| Variable | Descripción | Ejemplo | Sensible |
|---|---|---|---|
| `PORT` | Puerto HTTP | `3000` | N |
| `NODE_ENV` | Entorno | `development` | N |
| `TZ` | Zona horaria del proceso | `America/Argentina/Buenos_Aires` | N |
| `LOG_LEVEL` | Nivel de logs | `info` | N |
| `DATABASE_URL` | Conexión a base (etapa posterior) | `postgres://...` | S |
| `WHATSAPP_TOKEN` | Token de WhatsApp (etapa posterior) | — | S |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de pagos (etapa posterior) | — | S |

## Decisiones de diseño

- El **dominio no importa** Fastify, Zod ni el repositorio concreto.
- Los tests de solapamiento son unitarios y no requieren levantar el servidor.
- La persistencia en memoria se pierde al reiniciar: es aceptable en v0.1 y se reemplaza por un adaptador SQL cuando el change lo pida.
- La API devuelve fechas en UTC; el cliente muestra la hora local argentina.
