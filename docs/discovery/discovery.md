# Discovery — Resultado estructurado (checklist de 11 puntos)

**Proyecto:** Sistema de turnos y agenda para consultorios odontológicos (Argentina)
**Fecha:** 2026-11-18
**Insumo principal:** [`informe-discovery.md`](./informe-discovery.md)
**Estado:** borrador para revisión del equipo (protocolo de inspección: Continuar / Ajustar / Parar acá).

---

## 1. Problema

Los consultorios odontológicos argentinos gestionan turnos con una combinación de agenda en papel, planillas, WhatsApp y sistemas antiguos. Eso produce **solapamiento de turnos**, **ausentismo**, **pérdida de ingresos** y **falta de trazabilidad**. Los sistemas existentes cubren agenda y automatización, pero **no publican una regla verificable de no-solapamiento por profesional y por sillón/box**, que es el núcleo operativo del consultorio.

## 2. Usuarios

- **Odontólogo/a independiente:** dueño del consultorio, atiende y administra.
- **Recepción / secretaría:** agenda, confirma, cobra y reprograma.
- **Profesional asociado:** comparte sillones y agenda con otros colegas.
- **Dueño/a de clínica o centro multidisciplinario:** gestiona varios profesionales, sedes y liquidaciones.
- **Paciente:** reserva, confirma, reprograma y paga (usuario final de la experiencia digital).

## 3. Casos de uso

1. Crear un turno para un paciente con un profesional, una prestación y un sillón.
2. Evitar que dos turnos se solapen para el mismo profesional o el mismo sillón.
3. Aceptar un turno que empieza exactamente cuando termina otro.
4. Reorganizar la agenda por cancelaciones, urgencias o sobreturnos.
5. Confirmar, recordar y reprogramar turnos.
6. Registrar la atención, el presupuesto y el cobro.
7. Consultar ocupación y métricas básicas de la agenda.

## 4. Competidores

Ver **sección A** del informe para la tabla completa (20 sistemas) y **sección B** para la matriz ponderada. Los cinco prioritarios para demo son Dentalink, Bilog, DentalSoft Argentina, Dentidad y Doctocliq.

## 5. Funcionalidades necesarias (MVP)

- Turnos sin solapamiento por **profesional** y por **sillón/box**.
- Agenda diaria y semanal con múltiples profesionales.
- Duración variable de prestaciones, bloqueos y sobreturnos.
- Gestión básica de pacientes.
- Errores de negocio explícitos y verificables.

## 6. Funcionalidades opcionales (diferenciadores)

- Recordatorios automáticos por WhatsApp/email.
- Reserva online 24/7 con link público.
- Seña o pago anticipado al reservar.
- Lista de espera y reprogramación autogestionada.

## 7. Reglas de negocio

1. Un turno ocupa un **profesional** y un **sillón/box** durante un intervalo `[inicio, fin)`.
2. Un profesional no puede tener dos turnos activos que se solapen.
3. Un sillón/box no puede tener dos turnos activos que se solapen.
4. Si un turno termina exactamente cuando empieza otro, **no hay solapamiento** (intervalos semiabiertos).
5. La duración surge de la prestación y puede ajustarse manualmente.
6. Bloqueos y sobreturnos deben respetar las reglas anteriores o requerir una excepción explícita.
7. Un turno cancelado libera el horario.

## 8. Integraciones

- **WhatsApp** (recordatorios y confirmaciones).
- **Mercado Pago** (señas y pagos).
- **AFIP/ARCA** (factura electrónica) — etapa posterior.
- **Google Calendar** y sitio web del consultorio — etapa posterior.
- **Obras sociales/prepagas** — etapa posterior.

## 9. Restricciones

- Mercado argentino, español rioplatense, precios en ARS.
- Datos sensibles de salud: no se usarán datos reales de pacientes en el repositorio ni en las pruebas.
- El trabajo es académico y debe poder ejecutarse localmente con Node.js/npm.
- Sin claves de API ni credenciales en el repositorio.
- El MVP no incluye interfaz gráfica obligatoria: puede ser una API o un módulo de dominio con tests.

## 10. Riesgos

- **Alcance:** intentar cubrir facturación, obras sociales y odontograma en el primer change.
- **Evidencia:** asumir funcionalidades no publicadas por los competidores; el informe debe mantener “No evidenciado”.
- **Datos:** filtrar datos reales de pacientes en ejemplos o capturas.
- **Reglas:** modelar mal los intervalos y aceptar solapamientos por error.
- **Precio:** comparar precios de distintos países sin aclarar moneda y mercado.

## 11. Preguntas abiertas

- ¿Qué sistemas cobran por sillón y cuáles por profesional? (DentalBox no pudo verificarse; se excluyó de la tabla).
- ¿Qué productos ofrecen exportación completa de datos y en qué formato?
- ¿Qué adecuación declarada a la Ley 25.326 tiene cada proveedor?
- ¿La facturación electrónica ARCA está incluida o es un add-on en cada producto?
- ¿Qué competidores permiten sobreturnos y con qué reglas?
- ¿Cuánto cuesta realmente migrar fichas y agendas desde otro sistema?
- ¿Qué funcionalidades de IA son reales y cuáles son anuncios comerciales?
