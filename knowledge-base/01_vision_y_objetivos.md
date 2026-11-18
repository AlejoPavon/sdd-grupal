# Visión y Objetivos

## Propósito del sistema

Un sistema de gestión de turnos y agenda para consultorios odontológicos del mercado argentino que garantiza, con reglas verificables, que no existan turnos solapados para un mismo profesional ni para un mismo sillón/box, y que ordena la operación diaria del consultorio (pacientes, agenda, prestaciones y cobros básicos).

El proyecto nace del Discovery de mercado documentado en [`../docs/discovery/informe-discovery.md`](../docs/discovery/informe-discovery.md): los sistemas relevados cubren agenda y automatización, pero ninguno publica una regla demostrable de no-solapamiento simultáneo por profesional y por sillón. Ese vacío es el núcleo del producto.

## Objetivos por actor

| Actor | Objetivo principal | Objetivos secundarios |
|---|---|---|
| Odontólogo/a independiente | Organizar su agenda sin superposiciones | Ver su día, duración real de prestaciones, reducir ausentismo |
| Recepción / secretaría | Crear y mover turnos sin errores | Confirmar, cancelar, reprogramar y registrar pacientes |
| Profesional asociado | Compartir sillones y agenda con reglas claras | Ver solo su agenda y sus turnos |
| Dueño/a de clínica | Controlar ocupación y operación | Métricas básicas, roles y permisos, multi-sucursal (etapa posterior) |
| Paciente | Reservar y confirmar sin llamar | Reprogramar, pagar seña (etapa posterior) |

## Alcance v0.1 (MVP)

- Creación de turnos con **prevención de solapamientos por profesional y por sillón/box**.
- Agenda diaria y semanal con múltiples profesionales.
- Duración variable de prestaciones según catálogo.
- Bloqueos de agenda y sobreturnos controlados.
- Gestión básica de pacientes (alta, edición, búsqueda y baja lógica).
- Cancelación de turnos con liberación del horario.
- API REST y módulo de dominio testeable; sin interfaz gráfica obligatoria.

## Fuera de alcance (v0.1)

- Facturación electrónica AFIP/ARCA y gestión de obras sociales/prepagas.
- Cobros con Mercado Pago y señas.
- Recordatorios automáticos por WhatsApp/email.
- Reserva online pública 24/7 y portal del paciente.
- Odontograma, periodontograma, imágenes y radiografías.
- Liquidaciones a profesionales y multi-sucursal operativa.
- Integraciones con Google Calendar, AFIP/ARCA y API pública.
- IA de recepción y analítica avanzada.

> Estas funcionalidades aparecen en el mercado y en el Discovery, pero se dejan para etapas posteriores para no convertir el primer change en un módulo inabarcable.

## Métricas de éxito

- **Cero solapamientos** detectados en la suite de tests para profesional y sillón.
- **100 % de los escenarios del spec** (feliz, error de negocio y borde) cubiertos por tests automatizados.
- **Tiempo de creación de un turno** menor a 1 segundo en el entorno local.
- **Trazabilidad**: todo turno registra quién lo creó y cuándo.
- **Reproducibilidad**: el repositorio se clona y los tests corren siguiendo únicamente el README.
