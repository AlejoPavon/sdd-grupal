# Actores y Roles

## Actores del sistema

| Actor | Descripción | Cómo interactúa |
|---|---|---|
| Administrador/a del consultorio | Dueño o responsable de la clínica; configura profesionales, sillones, prestaciones y usuarios | API autenticada / panel (posterior) |
| Recepcionista | Gestiona agenda, pacientes y turnos del día | API autenticada |
| Profesional (odontólogo/a) | Atiende turnos; consulta su agenda | API autenticada |
| Paciente | Solicita, confirma o cancela un turno | Link público de reserva (etapa posterior) |
| Sistema | Valida reglas de negocio y persiste cambios | Procesos internos |

## RBAC — Matriz de permisos

**Recursos:** Pacientes (PA), Turnos (TU), Agenda (AG), Profesionales (PR), Sillones (SI), Prestaciones (PS), Usuarios (US), Reportes (RE).

| Rol | PA | TU | AG | PR | SI | PS | US | RE |
|---|---|---|---|---|---|---|---|---|
| Administrador | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | R |
| Recepcionista | CRUD | CRUD | CRUD | R | R | R | — | R |
| Profesional | R (sus pacientes) | R (sus turnos) | R (su agenda) | R | R | R | — | — |
| Paciente (público) | — | C (solicitud) | R (disponibilidad) | R | — | R | — | — |

**Leyenda:** C = crear, R = leer, U = actualizar, D = borrar (baja lógica). “—” = sin permiso.

### Reglas de autorización

- **RN-AU-01:** toda ruta `/api/*` requiere autenticación, salvo las rutas públicas declaradas abajo.
- **RN-AU-02:** un profesional solo puede leer turnos y pacientes asociados a sus propios turnos.
- **RN-AU-03:** solo Administrador y Recepcionista pueden crear, mover o cancelar turnos de terceros.
- **RN-AU-04:** la baja de un usuario, profesional, sillón o prestación es **lógica** (`activo = false`), nunca física, para preservar la trazabilidad de turnos históricos.
- **RN-AU-05:** el rol Paciente no puede leer datos clínicos ni datos de otros pacientes.

## Rutas públicas

| Ruta | Método | Motivo | Estado |
|---|---|---|---|
| `/health` | GET | Monitoreo | MVP |
| `/api/disponibilidad` | GET | Consulta de huecos para reserva | Etapa posterior |
| `/api/reservas` | POST | Solicitud de turno del paciente | Etapa posterior |
| `/api/reservas/:token` | GET/PATCH | Confirmar o cancelar por token | Etapa posterior |

> En v0.1 no hay autenticación implementada: el MVP se concentra en las reglas de agenda. El contrato de RBAC queda documentado para cuando se incorpore autenticación.

## Usuarios semilla (desarrollo)

| Usuario | Rol | Uso |
|---|---|---|
| `admin@demo.local` | Administrador | Configuración y pruebas |
| `recepcion@demo.local` | Recepcionista | Alta de turnos |
| `odonto1@demo.local` | Profesional | Agenda propia |

> Todos los datos de ejemplo son ficticios. Prohibido usar datos reales de pacientes.
