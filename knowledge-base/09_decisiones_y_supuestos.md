# Decisiones y Supuestos

## Decisiones documentadas

### DD-01 — Stack TypeScript + Node.js
**Decisión**: implementar el backend con Node.js 20 LTS, TypeScript 5, Fastify 4, Zod y Vitest.
**Contexto**: el repositorio declara Node.js LTS; la consigna permite API o módulo de dominio sin interfaz gráfica.
**Alternativas consideradas**: Python + FastAPI; Java + Spring Boot; Node.js + Express.
**Justificación**: un solo lenguaje para dominio, API y tests; tipado estricto para reglas de agenda; arranque y testeo rápidos; Express fue descartado por validación y errores más manuales.
**Trade-offs aceptados**: menos batteries-included que Spring; se agregan dependencias explícitas para validación y test.

### DD-02 — Dominio primero, infraestructura después
**Decisión**: las reglas de solapamiento y transición de estados viven en `src/domain` y no dependen de HTTP ni de la base.
**Contexto**: el núcleo del producto es una regla de negocio verificable; la consigna exige tests que la demuestren.
**Alternativas consideradas**: lógica dentro de los handlers HTTP; ORM con validaciones en la base.
**Justificación**: tests unitarios rápidos, errores tipados y posibilidad de reutilizar el dominio en la reserva online o en un CLI.
**Trade-offs aceptados**: más archivos y mapeos que un CRUD directo.

### DD-03 — API REST sin interfaz gráfica en v0.1
**Decisión**: entregar endpoints REST y documentación; no construir frontend.
**Contexto**: la consigna acepta API o módulo de dominio; el tiempo de la fundación y del primer change es acotado.
**Alternativas consideradas**: panel web mínimo; aplicación de escritorio.
**Justificación**: permite demostrar las reglas de negocio con tests y `curl` sin invertir en UI.
**Trade-offs aceptados**: la demo visual queda para una etapa posterior; se documentan las rutas para un frontend futuro.

### DD-04 — Repositorio en memoria para el MVP
**Decisión**: `InMemoryTurnoRepository` e `InMemoryPacienteRepository` en v0.1.
**Contexto**: el primer change debe ser reproducible sin instalar ni configurar una base de datos.
**Alternativas consideradas**: SQLite desde el inicio; PostgreSQL con Docker.
**Justificación**: cero fricción para clonar y correr tests; la interfaz de repositorio permite migrar sin tocar el dominio.
**Trade-offs aceptados**: los datos no persisten entre reinicios; no hay consultas SQL ni transacciones reales.

### DD-05 — Intervalos semiabiertos y UTC
**Decisión**: todo turno ocupa `[inicio, fin)`, con timestamps UTC y visualización en `America/Argentina/Buenos_Aires`.
**Contexto**: los turnos contiguos son normales en odontología y las fechas deben ser consistentes entre entornos.
**Alternativas consideradas**: intervalos cerrados `[inicio, fin]`; guardar hora local sin zona.
**Justificación**: evita falsos solapamientos en el borde y elimina ambigüedad por husos horarios.
**Trade-offs aceptados**: el cliente debe convertir a hora local; se documenta la convención en la API.

### DD-06 — Errores de negocio con códigos estables
**Decisión**: devolver `{ code, message, details }` y mapear cada error de dominio a un status HTTP.
**Contexto**: los tests y el frontend necesitan distinguir “sillón ocupado” de “profesional ocupado”.
**Alternativas consideradas**: mensajes libres; un único `400` genérico.
**Justificación**: permite tests determinísticos y mensajes claros para la recepción.
**Trade-offs aceptados**: mantener un catálogo de códigos y su documentación.

### DD-07 — Sin autenticación en v0.1
**Decisión**: postergar login y RBAC efectivo; dejar el contrato documentado.
**Contexto**: el primer change se concentra en la regla de agenda.
**Alternativas consideradas**: JWT desde el inicio; sesiones con cookies.
**Justificación**: reduce alcance y dependencies; evita simular seguridad a medias.
**Trade-offs aceptados**: la API no debe exponerse a Internet hasta implementar autenticación.

## Supuestos inferidos

### SU-01 — Una sucursal operativa en v0.1
**Supuesto**: el MVP asume una sola sucursal activa; el modelo incluye `Sucursal` para no bloquear el crecimiento.
**Origen**: el Discovery no relevó requisitos multi-sucursal y la consigna prioriza el núcleo de agenda.
**Riesgo si es falso**: habría que filtrar agenda y sillones por sucursal antes de operar.
**Cómo validar**: preguntar al usuario en `10_preguntas_abiertas.md` (PQ-05).

### SU-02 — Un turno corresponde a una sola prestación
**Supuesto**: cada turno tiene exactamente una prestación y una duración.
**Origen**: simplificación del modelo; el mercado permite tratamientos con múltiples pasos.
**Riesgo si es falso**: tratamientos largos requerirían varios turnos enlazados.
**Cómo validar**: PQ-06.

### SU-03 — No hay buffers entre turnos
**Supuesto**: la duración de la prestación incluye limpieza y preparación del sillón.
**Origen**: el Discovery no menciona tiempos de buffer y el MVP no los modela.
**Riesgo si es falso**: se necesitaría `bufferMinutos` por prestación o sillón.
**Cómo validar**: PQ-07.

### SU-04 — El sillón es obligatorio
**Supuesto**: todo turno requiere un sillón, incluso si el profesional atiende en un consultorio propio.
**Origen**: la regla de no-solapamiento por sillón es el diferenciador del producto.
**Riesgo si es falso**: consultorios de un solo profesional con un solo sillón funcionan igual, pero clínicas con sillones compartidos no.
**Cómo validar**: PQ-08.

### SU-05 — El sistema no valida feriados ni horarios de atención en v0.1
**Supuesto**: no se configura calendario laboral ni feriados.
**Origen**: no aparece en el Discovery ni en el MVP recomendado.
**Riesgo si es falso**: se podrían crear turnos en días no laborables.
**Cómo validar**: PQ-09.

### SU-06 — Los datos de pacientes serán ficticios durante el TP
**Supuesto**: no se cargan datos reales en la demo.
**Origen**: prohibición explícita de la consigna (sección de datos de pacientes).
**Riesgo si es falso**: incumplimiento de privacidad y de la Ley 25.326.
**Cómo validar**: revisión en el checklist de verificación.
