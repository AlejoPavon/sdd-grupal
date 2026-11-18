# Preguntas Abiertas

## Inconsistencias detectadas

### IN-01 — Cantidad de integrantes del grupo
**Documento A dice**: la consigna permite grupo de **hasta 3 integrantes** (`consignas.md`, sección de modalidad).
**Documento B dice**: el README del repositorio lista **5 integrantes** (Nathaniel Herrera, Lucas Timmermann, Aracelly Caballero, Javier Alaniz, Alejo Pavon).
**Impacto**: alto. Si la entrega es grupal, el grupo excede el máximo permitido y la participación individual exigida no puede demostrarse con 5 personas.
**Resolución (2026-11-18, por el usuario)**: la entrega se organiza con **5 integrantes** y cada uno tendrá commits propios. La asignación de tareas vive en `docs/equipo/`. Queda pendiente confirmar con la cátedra si acepta 5; si no, el trabajo está modularizado para reducirlo a 3 sin rehacerlo.

### IN-02 — “Ningún sistema resuelve el solapamiento” vs. agendas existentes
**Documento A dice**: el informe de Discovery concluye que ningún sitio oficial demuestra no-solapamiento simultáneo por profesional y sillón.
**Documento B dice**: Dentalink, Bilog y DentalSoft AR ofrecen agenda multi-profesional y control de sillones en su comunicación comercial.
**Impacto**: medio. La conclusión es una afirmación sobre **evidencia pública**, no sobre la capacidad real de los competidores.
**Resolución propuesta**: mantener el diferencial como “no evidenciado públicamente” y no como “no existe”; evitar afirmaciones absolutas en la defensa oral.

### IN-03 — “Sistema integral” vs. alcance del MVP
**Documento A dice**: el README describe un “sistema integral de gestión de turnos y agenda de pacientes”.
**Documento B dice**: el MVP de la KB excluye facturación, cobros, obra social, historia clínica y reserva online.
**Impacto**: medio. La expectativa del lector no coincide con lo que se entrega en v0.1.
**Resolución propuesta**: rotular el README como “MVP de agenda” y listar explícitamente lo que queda para etapas posteriores.

### IN-04 — Etapas de la fundación en el README
**Documento A dice**: el README lista las etapas 0, 1, 3, 4, 5 y 6; no figura una etapa 2.
**Documento B dice**: el plan de fundación incluye la Knowledge Base como etapa 2 entre Discovery y Roadmap.
**Impacto**: bajo. La numeración del README puede confundir la defensa y el seguimiento del avance.
**Resolución propuesta**: agregar la fila “2. Knowledge Base” cuando se actualice el README (lo hace el otro agente o el usuario).

### IN-05 — AFIP/ARCA “en implementación”
**Documento A dice**: algunos competidores comunican facturación AFIP como disponible.
**Documento B dice**: la verificación del Discovery encontró que en DenPro figura como “en implementación”, y en otros casos no hay evidencia.
**Impacto**: bajo para el MVP (no se implementa facturación), medio para el análisis competitivo.
**Resolución propuesta**: citar la fuente y la fecha exacta al comparar; no atribuir integraciones no verificadas.

## Preguntas abiertas (priorizadas)

| Prioridad | Pregunta | Bloquea | Decisor |
|---|---|---|---|
| Alta | ¿La cátedra acepta 5 integrantes? La consigna dice hasta 3 (IN-01). El grupo ya se organizó en 5. | Entrega y defensa | Usuario / cátedra |
| Alta | ¿La primera entrega debe incluir autenticación o alcanza con el contrato RBAC documentado? | Primer change | Usuario |
| Alta | ¿Se acepta una API REST sin frontend como entregable demostrable? | Alcance del change | Usuario / cátedra |
| Alta | ¿Los datos de la demo pueden ser ficticios y almacenados en memoria, o se exige persistencia? | Infraestructura del MVP | Usuario |
| Media | ¿El consultorio objetivo tiene una o varias sucursales? (SU-01) | Modelo y filtros | Usuario |
| Media | ¿Un turno puede incluir más de una prestación o un tratamiento con varios pasos? (SU-02) | Modelo de turno | Usuario |
| Media | ¿Se necesitan buffers de limpieza/preparación entre turnos? (SU-03) | Cálculo de disponibilidad | Usuario |
| Media | ¿El sillón es siempre obligatorio o hay atención a domicilio/sin sillón? (SU-04) | Regla RN-AG-05 | Usuario |
| Media | ¿Se deben validar feriados y horarios de atención en v0.1? (SU-05) | Regla RN-AG-13 | Usuario |
| Media | ¿Qué política de cancelación aplica (límite de horas, penalidad)? | Flujo de cancelación | Usuario |
| Baja | ¿Qué proveedor de WhatsApp se usará y quién paga la API? | Épica 3 | Usuario |
| Baja | ¿Se requiere Ley 25.326 explícita en la defensa o alcanza con la política de datos ficticios? | Documentación | Usuario |
| Baja | ¿Se necesita multi-idioma o solo español rioplatense? | UI posterior | Usuario |
| Baja | ¿Qué tan lejos se lleva la analítica (ocupación, ausentismo, ingresos)? | Épica 4 | Usuario |

## [DISCOVERY] Campos inferidos con baja confianza (Mode A)

- `[DISCOVERY]` `stack` no está definido en los documentos de Discovery. Se infirió **Node.js 20 LTS + TypeScript 5 + Fastify 4 + Zod + Vitest** a partir del README (badge Node.js LTS) y de la consigna (API o módulo de dominio). Confirmar antes de implementar.
- `[DISCOVERY]` `scale` se infirió como **team + public_multi_user (reserva online futura)** a partir de los actores (administrador, recepción, profesional, paciente). Confirmar si el alcance real es un consultorio único.
- `[DISCOVERY]` `needs_infra` se infirió como **false**: el MVP no requiere base de datos, colas ni contenedores. Cambia a `true` si se exige persistencia o despliegue.
- `[DISCOVERY]` `system_type` se infirió como **web_app (API REST)**; no hay interfaz gráfica en v0.1.
