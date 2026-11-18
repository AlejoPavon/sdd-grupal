# Informe de Discovery — Sistema de Turnos Odontológicos (Argentina)

**Materia:** Metodología I — Tecnicatura Universitaria en Programación

**Trabajo:** Trabajo de Integración — Del Discovery al primer Change con Spec-Driven Development y Active Stack

**Integrantes:** Nathaniel Herrera, Lucas Timmermann, Aracelly Caballero, Javier Alaniz y Alejo Pavon

**Fecha:** 18/11/2026

**Versión:** 1.0

**Consultas web:** todas las fuentes se consultaron el **2026-11-18** (hora de Argentina).

---

## Resumen ejecutivo

Se investigaron **20 sistemas** de gestión de turnos y agenda odontológica: **10 de Argentina**, **5 de Latinoamérica** (Chile, Perú/México/Ecuador/Colombia y soluciones regionales) y **5 internacionales** de referencia (Estados Unidos y Australia). Para cada uno se relevaron sitio oficial, segmento, modalidad, agenda, reserva online, recordatorios, historia clínica/odontograma, administración, precio publicado y fuente con fecha. Toda funcionalidad no demostrada públicamente se registró como **“No evidenciado”**; no se completaron celdas por deducción.

Hallazgos principales:

1. **La agenda multi-profesional y la reserva online ya son estándar** en casi todos los productos argentinos y latinoamericanos relevados. El odontograma también dejó de ser diferencial: aparece en la mayoría de los sistemas específicamente dentales.
2. **La prevención explícita de solapamientos por sillón/box no está demostrada** en la mayoría de los sitios oficiales. Casi todos comunican “agenda” y “turnos sin conflicto”, pero **ninguno** de los relevados publica una regla verificable de no-solapamiento simultáneo por profesional **y** por sillón. Es el vacío más consistente y el núcleo del MVP propuesto.
3. **El mercado argentino premia la integración local**: WhatsApp, Mercado Pago, factura electrónica ARCA/AFIP y obras sociales aparecen como ejes de competencia (Dentidad, DentalSoft AR, Bilog, Reservo). Los productos internacionales no cubren estas integraciones.
4. **El precio no siempre es transparente**: varios productos argentinos no publican precios o cotizan a medida; los que publican en pesos (Dentatools ARS 76.500/mes; DenPro desde ARS 29.900/mes; AgendaPro ARS 7.900–15.900/mes) facilitan la comparación y la adopción.
5. **Los competidores con mayor puntuación ponderada** son Dentalink (4,65/5), Bilog (4,60), DentalSoft Argentina (4,55), Dentidad (4,50) y Doctocliq (4,45). En todos los casos, la fortaleza viene de la combinación de agenda + automatización + gestión administrativa, no de una única función clínica.

**MVP recomendado:** un sistema acotado que resuelva con reglas verificables la **creación de turnos sin solapamientos por profesional y por sillón/box**, con agenda diaria/semanal y gestión básica de pacientes. Como diferenciador: recordatorios automáticos y reserva online del paciente. Facturación avanzada, obras sociales, odontograma completo e integraciones clínicas quedan para etapas posteriores.

---

## Alcance y método

- **Alcance geográfico:** Argentina (prioridad), Latinoamérica y soluciones internacionales que puedan inspirar el mercado local.
- **Unidad de análisis:** software que permita gestionar turnos y agenda de pacientes odontológicos.
- **Fuentes admitidas:** sitios oficiales de cada proveedor, páginas de precios, centros de ayuda, documentación pública y páginas de producto. Se indicó URL y fecha de consulta.
- **Regla de evidencia:** una funcionalidad se marca **“Comprobado”** solo si el sitio oficial, la página de precios o la documentación pública la muestran. Las afirmaciones comerciales sin demostración se registran como **“Afirmación comercial”**. Lo que no está públicamente demostrado se registra como **“No evidenciado”**.
- **Límite:** no se crearon cuentas, no se contactó a proveedores y no se usaron datos personales reales. No se probaron demos; el análisis es de evidencia pública.

---

## A. Tabla comparativa de sistemas (ordenada por relevancia para Argentina)

> **Leyenda:** “No evidenciado” = no hay demostración pública en la fuente consultada. “Afirmación comercial” = el proveedor lo declara sin demostrarlo. La columna **Fuente** indica la página exacta consultada el **2026-11-18**.

| # | Producto / Proveedor | País · Segmento | Modalidad | Agenda multi-prof. / sillón | Reserva online | Recordatorios / WhatsApp | Odontograma | Cobros / facturación local | Precio publicado | Fuente (consulta 2026-11-18) |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | **Dentalink** / Engenis SpA (Healthatom) | Chile · consultorio y clínica | SaaS en la nube | Agenda online y multi-sucursal; **sillón: No evidenciado** | Sí | WhatsApp/email + IA; sí | Sí (odontograma y periodontograma) | Caja, cobros, financiamiento; **ARCA: No evidenciado** | CLP 35.000 / 41.000 / 53.500 por profesional, IVA incl. (Chile); **AR: cotización** | `softwaredentalink.com/planes`; `softwaredentalink.com/cl/planes` |
| 2 | **Bilog** / Bilog | Argentina · consultorio, clínica y universidad | SaaS | Turnos online y multi-profesional; **sillón: No evidenciado** | Sí | WhatsApp/SMS; sí | Sí | Factura electrónica, presupuestos, recetas | **No evidenciado** (el sitio declara que “no compite por precio”) | `bilog.com.ar` |
| 3 | **DentalSoft Argentina** / DentalSoft | Argentina · clínica odontológica | SaaS en la nube | Agenda y turnos multi-profesional; **sillón: No evidenciado** | Sí | WhatsApp + asistente virtual con IA; sí | Sí (+ ortodoncia) | Caja, Mercado Pago, obras sociales, presupuestos | **No evidenciado** | `dentalsoft.com.ar` |
| 4 | **Dentidad** / Dentidad | Argentina · consultorio odontológico | SaaS | Turnos online; **sillón: No evidenciado** | Sí, con seña por Mercado Pago | WhatsApp y email; sí | Sí | Factura C electrónica ARCA, caja y presupuestos | Planes publicados; **montos no visibles sin iniciar flujo** | `dentidad.com` |
| 5 | **Doctocliq** / Doctocliq | LATAM (Perú, México, Ecuador, Colombia) · dental y médico | SaaS | Agenda; **sillón: No evidenciado** | Sí | WhatsApp, Meta y Google; sí | Sí (odontograma y planes) | Caja y factura SUNAT (Perú) y adaptaciones locales; **ARCA: No evidenciado** | USD 19 / 29 / 49 por mes; plan gratuito | `doctocliq.com/planes` |
| 6 | **TotalMed** / TotalMed | Chile y LATAM · clínica estética con módulo odontológico | SaaS | Agenda; **sillón: No evidenciado** | Sí | Recordatorios por WhatsApp y email; sí | Sí (módulo odontología) | Boleta/factura electrónica SII (Chile) | Planes publicados; **montos no capturados en la consulta** | `totalmed.lat` |
| 7 | **Dentatools** / Dentatools | Argentina · consultorio y clínica | SaaS en la nube | Agenda compartida y auto-agendado; **sillón: No evidenciado** | Sí, link público de reservas | WhatsApp en un clic; sí | Sí | Cobros y cuentas en ARS; **facturación al paciente: No evidenciado** | **ARS 76.500/mes IVA incl.**, usuarios ilimitados, prueba gratis | `dentatools.co/ar/precios/` |
| 8 | **DenPro** / DenPro | Argentina · consultorio, multisede y cadena | SaaS en la nube | Turnos y lista de espera; **sillón: No evidenciado** | Sí | SMS; **WhatsApp: solo canal de soporte** | Sí | Facturación y seguros; **AFIP y obras sociales “en implementación”** | **ARS 29.900/mes** (plan Team); prueba 30 días | `denpro.ar/precios/` |
| 9 | **AgendaPro** / AgendaPro | Chile · multi-rubro salud y estética | SaaS | Agenda multi-profesional; **sillón: No evidenciado** | Sí (Google, Instagram, Facebook y link) | WhatsApp/email + IA; sí | **No evidenciado** | Caja, señas con Mercado Pago, comisiones, inventario | **ARS 7.900/mes** (1 profesional) y **ARS 15.900/mes** (2–5), IVA incl.; 14 días gratis | `agendapro.com/ar/planes` |
| 10 | **DentalSoft Chile** / DentalSoft | Chile · clínica dental | SaaS | Agenda, múltiples cajas y sucursales; **sillón: No evidenciado** | Sí (“Reserva en Línea”) | Confirmaciones; **WhatsApp: solo soporte** | Sí | Honorarios, pagos y presupuestos; **SII: No evidenciado** | **No evidenciado** | `dentalsoft.cl` |
| 11 | **Reservo** / Reservo | Argentina · policonsultorio y clínica | SaaS | Turnero online; multi-profesional; **sillón: No evidenciado** | Sí | **No evidenciado** | **No evidenciado** | Mercado Pago y factura AFIP/ARCA | **No evidenciado** | `reservo.com.ar` |
| 12 | **DentalHub** / DentalHub | Argentina · consultorio y clínica | SaaS | Turnos “sin conflicto”; **sillón: No evidenciado** | **No evidenciado** | WhatsApp y recordatorios automáticos; sí | Sí | Pagos con Mercado Pago y facturación | **No evidenciado** | `dentalhub.com.ar` |
| 13 | **Dentaly** / Dentaly | Argentina · clínica dental | SaaS web | Turnos; **multi-sillón: No evidenciado** | **No evidenciado** | **No evidenciado** | Sí | Finanzas e inventario; **facturación: No evidenciado** | **Plan gratuito** (según metadatos); planes pagos no evidenciados | `dentaly.com.ar` |
| 14 | **DentalFlow** / HASHEM | Argentina · consultorio y clínica | SaaS web | Agenda diaria, semanal y mensual; **sillón: No evidenciado** | **No evidenciado** | Recordatorio por WhatsApp; sí | Sí | Caja diaria; **facturación: No evidenciado** | **No evidenciado** | `dentalflow.com.ar` |
| 15 | **Odentix** / Odentix | Argentina · consultorio odontológico | SaaS | Agenda de turnos; **sillón: No evidenciado** | **No evidenciado** | WhatsApp y email automáticos; sí | Sí | Pagos; **facturación: No evidenciado** | **No evidenciado** | `odentix.com.ar` |
| 16 | **Open Dental** / Open Dental Software | EE. UU. · consultorio y clínica | On-premise (nube opcional) | Múltiples profesionales y *operatories* (sillones); sí | Sí (Web Sched, add-on) | eServices (add-on) | Sí | Reclamos y seguros de EE. UU.; **ARCA: No evidenciado** | **USD 199/mes** (12 meses) y luego **USD 149/mes**; otros países **USD 89/mes** | `opendental.com/site/fees.html` |
| 17 | **Dentrix** / Henry Schein One | EE. UU. · consultorio y DSO | On-premise | Múltiples profesionales y *operatories*; sí | Sí (módulo) | Patient Engage | Sí | Reclamos y seguros de EE. UU.; **ARCA: No evidenciado** | **No evidenciado** (cotización) | `dentrix.com` |
| 18 | **Cliniko** / Cliniko | Australia · salud aliada y consultorios | SaaS | Múltiples profesionales y salas; sí | Sí | Email/SMS | **No** | Facturación general; **ARCA: No evidenciado** | **USD 45/mes** (1 profesional) a **USD 395/mes** (26–200) | `cliniko.com/pricing/` |
| 19 | **tab32** / tab32 | EE. UU. · consultorio y grupo | SaaS | Múltiples profesionales y sillones; sí | Sí | Sí | Sí | Reclamos y seguros de EE. UU.; **ARCA: No evidenciado** | **USD 95/mes**, profesionales y usuarios ilimitados | `tab32.com/pricing` |
| 20 | **Curve Dental** / Curve Dental | EE. UU. y Canadá · consultorio | SaaS | Múltiples profesionales y *operatories*; sí | Sí | GRO (engagement) | Sí | Reclamos y seguros de EE. UU.; **ARCA: No evidenciado** | **No evidenciado** (cotización) | `curvedental.com/pricing` |

### Notas de la tabla

- **“Sillón: No evidenciado”** significa que el sitio oficial no publica una funcionalidad explícita de asignación de sillón/box ni una regla de no-solapamiento por sillón. No significa que el producto no la tenga: significa que **no está demostrado públicamente**.
- **Precio “No evidenciado”**: el proveedor no publica importes en su sitio oficial; se comercializa por cotización.
- **ARCA/AFIP**: se marca “No evidenciado” cuando el producto no declara facturación electrónica argentina en la fuente consultada. La existencia de facturación en otro país (SII, SUNAT) no se extrapola a Argentina.
- **Afirmaciones comerciales** (por ejemplo “el sistema n°1 en Argentina” de AgendaPro, “+1.500 clínicas” de Bilog o “+15.000 clientes” de Dentalink) se registran como declaraciones del proveedor; no se verificaron de forma independiente.

---

## B. Matriz de puntuación (0 a 5)

**Pesos:** Gestión de turnos y automatización **25 %**; Funcionalidad odontológica clínica **20 %**; Integraciones locales y WhatsApp **15 %**; Administración, cobros y facturación **15 %**; Experiencia del paciente **10 %**; Seguridad, exportación y trazabilidad **10 %**; Precio y facilidad de adopción **5 %**.

| # | Sistema | Turnos y automatización (25 %) | Clínico (20 %) | Integraciones locales (15 %) | Administración (15 %) | Experiencia paciente (10 %) | Seguridad y trazabilidad (10 %) | Precio y adopción (5 %) | **Total ponderado (0–5)** |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Dentalink | 5 | 5 | 4 | 5 | 5 | 4 | 3 | **4,65** |
| 2 | Bilog | 5 | 5 | 5 | 5 | 4 | 4 | 1 | **4,60** |
| 3 | DentalSoft Argentina | 5 | 5 | 5 | 5 | 4 | 3 | 2 | **4,55** |
| 4 | Dentidad | 5 | 4 | 5 | 5 | 5 | 3 | 3 | **4,50** |
| 5 | Doctocliq | 5 | 5 | 4 | 4 | 4 | 4 | 4 | **4,45** |
| 6 | TotalMed | 5 | 4 | 4 | 5 | 4 | 3 | 3 | **4,25** |
| 7 | Dentatools | 5 | 4 | 4 | 4 | 4 | 3 | 4 | **4,15** |
| 8 | DenPro | 5 | 4 | 3 | 4 | 4 | 4 | 5 | **4,15** |
| 9 | AgendaPro | 5 | 2 | 5 | 5 | 5 | 3 | 4 | **4,15** |
| 10 | tab32 | 5 | 5 | 1 | 4 | 4 | 4 | 5 | **4,05** |
| 11 | DentalSoft Chile | 5 | 5 | 2 | 5 | 3 | 3 | 2 | **4,00** |
| 12 | Curve Dental | 5 | 5 | 1 | 4 | 4 | 4 | 2 | **3,90** |
| 13 | Reservo | 4 | 3 | 5 | 5 | 3 | 3 | 2 | **3,80** |
| 14 | Open Dental | 5 | 5 | 1 | 3 | 3 | 4 | 4 | **3,75** |
| 15 | Dentrix | 5 | 5 | 1 | 4 | 3 | 4 | 1 | **3,75** |
| 16 | DentalHub | 4 | 4 | 4 | 4 | 3 | 2 | 2 | **3,60** |
| 17 | Dentaly | 4 | 4 | 2 | 4 | 3 | 2 | 5 | **3,45** |
| 18 | Cliniko | 5 | 2 | 1 | 3 | 4 | 4 | 4 | **3,25** |
| 19 | DentalFlow | 4 | 4 | 3 | 3 | 2 | 2 | 2 | **3,20** |
| 20 | Odentix | 4 | 4 | 3 | 3 | 2 | 2 | 2 | **3,20** |

### Nota metodológica

1. **Qué significa cada nota (0–5).** 0 = no evidenciado o ausente; 1 = mención comercial sin demostración; 2 = funcionalidad básica demostrada; 3 = funcionalidad demostrada con limitaciones claras; 4 = funcionalidad sólida y demostrada; 5 = funcionalidad diferencial, documentada y bien integrada.
2. **Tratamiento de “No evidenciado”.** No se otorgan puntos por deducción. Una celda “No evidenciado” **no suma** en la dimensión correspondiente y se explicita en la tabla A. Esto penaliza a los productos que no publican información, incluso si probablemente la tengan.
3. **Afirmaciones comerciales.** Frases como “líder”, “n°1” o cantidad de clientes no se usaron como evidencia de funcionalidad ni de adopción; solo se consideraron páginas de producto, precios y documentación.
4. **Dimensión “Integraciones locales”.** Se valoró la evidencia de WhatsApp, Mercado Pago y facturación AFIP/ARCA. Un producto internacional puede tener una excelente agenda y aun así obtener 1 en esta dimensión porque no cubre el mercado argentino.
5. **Dimensión “Clínico”.** Se valoró historia clínica, odontograma, periodontograma, imágenes, presupuestos y planes de tratamiento. Un sistema generalista sin odontograma no puede superar 2, aunque tenga una agenda excelente.
6. **Precio y facilidad de adopción.** Se valoró precio publicado, prueba gratuita y transparencia. Un precio bajo por cotización no verificable no se premió.

---

## C. Análisis competitivo

### C.1. Funcionalidades que ya son estándar de mercado

- Agenda con vista diaria y semanal y múltiples profesionales.
- Reserva online 24/7 mediante link público.
- Recordatorios automáticos por WhatsApp y/o email.
- Historia clínica digital con odontograma.
- Presupuestos y planes de tratamiento.
- Caja, cobros y registro de pagos.
- Facturación electrónica local en los productos argentinos (ARCA/AFIP) y en los chilenos (SII).
- App móvil o interfaz responsive para el profesional.

En Argentina, la combinación **agenda + WhatsApp + Mercado Pago + factura ARCA** ya es el piso competitivo, no un diferencial.

### C.2. Funcionalidades diferenciadoras reales

- **Automatización conversacional con IA** que atiende WhatsApp, propone horarios y agenda (Dentalink Contact Center IA, AgendaPro, DentalSoft AR, Doctocliq).
- **Seña o pago anticipado al reservar** con Mercado Pago y link de pago (Dentidad, AgendaPro, DentalSoft AR).
- **Facturación electrónica ARCA integrada** al flujo clínico y de caja (Dentidad, Bilog, Reservo).
- **Multi-sucursal y liquidación a profesionales** en un mismo sistema (Dentalink, DentalSoft AR/CL, Bilog).
- **Odontograma y periodontograma** con firma de documentos (Dentalink, DentalSoft CL/AR).
- **Analítica de gestión** y tableros de ocupación, facturación y ranking de profesionales (DentalSoft AR, Dentalink, Bilog).

### C.3. Vacíos frecuentes del mercado argentino

1. **Prevención de solapamientos por profesional *y* por sillón/box.** Ningún sitio oficial relevado publica una regla verificable de no-solapamiento simultáneo por ambos recursos. Es el vacío más consistente y el más fácil de especificar y testear.
2. **Precios claros en pesos argentinos.** Varios productos no publican precios o cotizan a medida; la comparación y la adopción se vuelven opacas.
3. **Portabilidad y exportación de datos.** La mayoría no publica un procedimiento de exportación completo ni un formato abierto.
4. **Cumplimiento explícito de la Ley 25.326 de Protección de Datos Personales.** Se declaran buenas prácticas y cifrado, pero no una adecuación normativa argentina verificable.
5. **Integración de obras sociales y prepagas** en el flujo diario de la pyme odontológica; suele quedar fuera del sistema o resolverse con planillas.
6. **Experiencia móvil real del paciente** (reserva, confirmación, seña y reprogramación sin llamar) en productos de precio accesible.
7. **Auditoría y trazabilidad de cambios en la agenda** (quién movió, canceló o sobreturnó un turno).

### C.4. Oportunidades de innovación

- **Motor de reglas de agenda como núcleo del producto:** profesional + sillón/box + duración variable + bloqueos + sobreturnos + lista de espera, con errores de negocio explícitos y testeables.
- **Reserva con seña y reprogramación autogestionada** por link, sin fricción y con impacto directo en ausentismo.
- **Precio transparente en ARS** y prueba gratuita sin tarjeta, como ventaja de adopción frente a los que cotizan.
- **API abierta y exportación completa** para reducir el miedo al encierro de datos.
- **Trazabilidad por evento** (creación, reprogramación, cancelación, sobreturno) como base de auditoría y confianza.
- **IA de recepción acotada** a agendar, confirmar y reprogramar, sin prometer diagnóstico ni reemplazar al profesional.

---

## D. Recomendación final

### D.1. Cinco competidores prioritarios para analizar mediante demo

1. **Dentalink** — el benchmark latinoamericano más completo en agenda, clínica y automatización.
2. **Bilog** — el competidor argentino con mayor cobertura funcional y respaldo local.
3. **DentalSoft Argentina** — referencia local en integración clínica, WhatsApp y Mercado Pago.
4. **Dentidad** — el flujo más claro de reserva con seña y facturación ARCA para consultorio pequeño.
5. **Doctocliq** — referencia regional de precio accesible y automatización con IA.

### D.2. Tres productos de referencia para experiencia de usuario

1. **AgendaPro** — claridad del flujo de reserva, link público y señas.
2. **Dentalink** — organización de la agenda y densidad de información clínica.
3. **Dentatools** — simplicidad de propuesta y precio único para el consultorio argentino.

### D.3. MVP sugerido

**Imprescindible (núcleo del change):**

- Creación de turnos **sin solapamientos por profesional y por sillón/box**.
- Agenda diaria y semanal con múltiples profesionales.
- Duración variable de prestaciones, bloqueos y sobreturnos.
- Gestión básica de pacientes (alta, edición y búsqueda).
- Errores de negocio explícitos y verificables (turno solapado, recurso ocupado, fin de agenda).

**Diferenciador (segunda iteración):**

- Recordatorios automáticos por WhatsApp/email.
- Reserva online 24/7 con link público.
- Seña o pago anticipado al reservar.
- Lista de espera y reprogramación autogestionada.

**Etapas posteriores (fuera del MVP):**

- Facturación electrónica ARCA y gestión de obras sociales/prepagas.
- Odontograma y periodontograma completos, imágenes y radiografías.
- Liquidaciones a profesionales y multi-sucursal.
- Integraciones con Google Calendar, AFIP/ARCA, Mercado Pago y API pública.
- IA de recepción y analítica avanzada.

**Justificación del recorte:** el MVP se concentra en la regla de negocio más verificable y menos cubierta por la competencia (no-solapamiento por profesional y sillón), lo que permite especificar escenarios dados/cuando/entonces y probarlos con tests automatizados. Todo lo demás se deja para etapas posteriores para no convertir el primer change en un módulo inabarcable.

---

## Verificación de fuentes

Se verificaron personalmente **8 fuentes** de distinto tipo (precios, planes, producto y documentación). Para cada una se contrastó lo que afirma el informe con lo que realmente muestra la URL consultada el **2026-11-18**.

| # | Fuente (URL) | Tipo | Qué afirma el informe | Qué se encontró | Resultado / corrección |
|---:|---|---|---|---|---|
| 1 | `opendental.com/site/fees.html` | Precios | Open Dental cuesta USD 199/mes el primer año y USD 149/mes después; USD 89/mes en otros países | La página oficial muestra **USD 199** inicial y **USD 149** reducido para EE. UU.; **USD 89** para otros países | **Confirmado** |
| 2 | `cliniko.com/pricing/` | Precios | Cliniko cuesta USD 45/mes para 1 profesional | La página muestra **USD 45/mes** (1 profesional), **USD 95** (2–5) y **USD 395** (26–200) | **Confirmado** |
| 3 | `agendapro.com/ar/planes` | Precios | AgendaPro cuesta ARS 7.900/mes (1 profesional) y ARS 15.900/mes (2–5), con 14 días gratis | La página muestra **ARS 7.900** y **ARS 15.900** IVA incl. y **14 días gratis**; “primeros 3 meses a $990” | **Confirmado**; se corrigió “el sistema n°1 en Argentina” a **afirmación comercial no verificada** |
| 4 | `doctocliq.com/planes` | Precios | Doctocliq tiene planes desde USD 19/mes y un plan gratuito | La página muestra **USD 19 / 29 / 49** por mes y un plan **USD 0** | **Confirmado** |
| 5 | `dentatools.co/ar/precios/` | Precios | Dentatools cuesta ARS 76.500/mes con IVA incluido y usuarios ilimitados | La página muestra **ARS 76.500/mes IVA incl.**, sin costo por asiento y prueba gratis sin tarjeta | **Confirmado** |
| 6 | `denpro.ar/precios/` | Precios / producto | DenPro cuesta ARS 29.900/mes (Team) y ofrece facturación AFIP y obras sociales | La página muestra **ARS 29.900/mes** (Team) y prueba de 30 días; los metadatos del sitio dicen **“AFIP y obras sociales en implementación”** | **Corregido:** se cambió “facturación AFIP activa” por **“en implementación / No evidenciado”** |
| 7 | `tab32.com/pricing` | Precios | tab32 arranca en USD 95/mes con profesionales y usuarios ilimitados | La página muestra **“Starts at $95/mo, unlimited providers and users”** y 14 días gratis | **Confirmado** |
| 8 | `softwaredentalink.com/cl/planes` | Precios / producto | Dentalink publica planes Esencial, Pro y Titanium y precios en CLP | La página chilena muestra **CLP 35.000 / 41.000 / 53.500** por profesional, IVA incl.; la página de Argentina **no publica montos** y pide cotización | **Ajustado:** el precio se consignó como **Chile (CLP)**; para Argentina se dejó **“cotización”** |

**Hallazgos de la verificación (para la reflexión):**

- El sitio de **DenPro** comunica “AFIP y obras sociales en implementación”: una lectura rápida podía convertir eso en “facturación AFIP disponible”. Se corrigió con **Ajustar** antes de cerrar el informe.
- **Dentalink** publica precios en Chile, pero no en su página de Argentina; mezclar ambos mercados habría sido un error. Se separó por país.
- Varias comparaciones de terceros atribuyen a Dentalink “precios variables según necesidades”, mientras el checkout chileno muestra montos concretos. La conclusión correcta es que **el precio depende del país y del canal**, no que “no publique precios”.
- La afirmación de AgendaPro “sistema n°1 en Argentina” es **comercial**, no un dato verificable; se excluyó de la matriz y se dejó como declaración del proveedor.

---

## Referencias

1. Dentalink — Planes. https://www.softwaredentalink.com/planes (consulta: 2026-11-18).
2. Dentalink Chile — Planes. https://www.softwaredentalink.com/cl/planes (consulta: 2026-11-18).
3. Dentalink Argentina. https://www.softwaredentalink.com/ar (consulta: 2026-11-18).
4. Bilog — Software de gestión odontológica. https://bilog.com.ar/ (consulta: 2026-11-18).
5. DentalSoft Argentina. https://www.dentalsoft.com.ar/ (consulta: 2026-11-18).
6. Dentidad — Software dental para Argentina. https://www.dentidad.com/ (consulta: 2026-11-18).
7. Doctocliq — Planes. https://doctocliq.com/planes (consulta: 2026-11-18).
8. TotalMed — Software para clínicas. https://totalmed.lat/ (consulta: 2026-11-18).
9. Dentatools Argentina — Precios. https://dentatools.co/ar/precios/ (consulta: 2026-11-18).
10. DenPro — Precios. https://www.denpro.ar/precios/ (consulta: 2026-11-18).
11. AgendaPro Argentina — Planes. https://agendapro.com/ar/planes (consulta: 2026-11-18).
12. DentalSoft Chile. https://www.dentalsoft.cl/ (consulta: 2026-11-18).
13. Reservo. https://www.reservo.com.ar/ (consulta: 2026-11-18).
14. DentalHub. https://dentalhub.com.ar/ (consulta: 2026-11-18).
15. Dentaly. https://www.dentaly.com.ar/ (consulta: 2026-11-18).
16. DentalFlow. https://www.dentalflow.com.ar/ (consulta: 2026-11-18).
17. Odentix. https://www.odentix.com.ar/ (consulta: 2026-11-18).
18. Open Dental — Fees. https://www.opendental.com/site/fees.html (consulta: 2026-11-18).
19. Dentrix. https://www.dentrix.com/ (consulta: 2026-11-18).
20. Cliniko — Pricing. https://www.cliniko.com/pricing/ (consulta: 2026-11-18).
21. tab32 — Pricing. https://www.tab32.com/pricing (consulta: 2026-11-18).
22. Curve Dental — Pricing. https://www.curvedental.com/pricing (consulta: 2026-11-18).
