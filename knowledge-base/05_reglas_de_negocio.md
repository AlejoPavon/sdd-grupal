# Reglas de Negocio

Cada regla tiene un código único `RN-{DOMINIO}-{NN}` para trazabilidad. Las reglas marcadas **[MVP]** son obligatorias para el primer change; el resto queda documentado para etapas posteriores.

## Dominio: Agenda y turnos (RN-AG)

- **RN-AG-01 [MVP] — Intervalo semiabierto.** Todo turno ocupa el intervalo `[inicio, fin)`. Un turno que termina exactamente cuando empieza otro **no** se solapa con él.
- **RN-AG-02 [MVP] — Duración desde la prestación.** La duración de un turno surge de `Prestacion.duracionMinutos`. Puede ajustarse manualmente solo si el usuario tiene permiso de Administrador o Recepcionista.
- **RN-AG-03 [MVP] — Fin posterior al inicio.** Un turno debe cumplir `fin > inicio`; en caso contrario se rechaza con `TURNO_INTERVALO_INVALIDO`.
- **RN-AG-04 [MVP] — No solapamiento por profesional.** No puede existir otro turno activo del mismo profesional cuyo intervalo se superponga con `[inicio, fin)`.
- **RN-AG-05 [MVP] — No solapamiento por sillón/box.** No puede existir otro turno activo del mismo sillón cuyo intervalo se superponga con `[inicio, fin)`.
- **RN-AG-06 [MVP] — Estados que ocupan agenda.** Solo los turnos en estado `pendiente` o `confirmado` ocupan agenda. `cancelado`, `ausente` y `atendido` no bloquean nuevos turnos.
- **RN-AG-07 [MVP] — Cancelación libera horario.** Al cancelar un turno, su estado pasa a `cancelado` y su intervalo deja de bloquear al profesional y al sillón.
- **RN-AG-08 [MVP] — Recursos activos.** No se puede crear un turno con un profesional, sillón o prestación inactivos (`activo = false`).
- **RN-AG-09 [MVP] — Existencia de referencias.** Paciente, profesional, sillón y prestación deben existir antes de crear el turno.
- **RN-AG-10 [MVP] — Agenda diaria y semanal.** La consulta de agenda devuelve los turnos activos de un rango, agrupables por profesional y por sillón.
- **RN-AG-11 — Bloqueos.** Un turno no puede superponerse con un `Bloqueo` del mismo profesional o sillón, salvo autorización explícita de Administrador.
- **RN-AG-12 — Sobreturnos.** Un sobreturno puede superponerse **solo** con otro turno del mismo profesional, nunca con otro turno del mismo sillón, y requiere rol Administrador o Recepcionista. Se registra con `esSobreturno = true`.
- **RN-AG-13 — Horario de atención.** Un turno debe caer dentro del horario configurado para el profesional/sucursal. Sin configuración, no se valida en v0.1.
- **RN-AG-14 — Zona horaria.** Las fechas se persisten en UTC y se interpretan en `America/Argentina/Buenos_Aires` para mostrar y validar horarios locales.

## Dominio: Turnos (RN-TU)

- **RN-TU-01 [MVP] — Estados válidos.** `pendiente → confirmado → atendido`; `pendiente|confirmado → cancelado`; `confirmado → ausente`. Cualquier otra transición se rechaza.
- **RN-TU-02 [MVP] — Trazabilidad.** Todo turno registra `createdBy`, `createdAt` y `updatedAt`. Las cancelaciones registran `cancelledAt`.
- **RN-TU-03 [MVP] — Identificador único.** El `id` del turno es un UUID generado por el sistema.
- **RN-TU-04 — Reprogramación.** Reprogramar equivale a cancelar el turno original y crear uno nuevo; ambos eventos quedan auditados. (Etapa posterior.)
- **RN-TU-05 — Historial.** Los turnos cancelados y atendidos se conservan; no se eliminan físicamente.

## Dominio: Pacientes (RN-PA)

- **RN-PA-01 [MVP] — Datos mínimos.** Nombre y apellido son obligatorios.
- **RN-PA-02 [MVP] — Baja lógica.** Un paciente inactivo no puede recibir turnos nuevos, pero su historial se conserva.
- **RN-PA-03 [MVP] — Duplicados.** No se permite un paciente activo con el mismo email o documento.
- **RN-PA-04 — Privacidad.** Prohibido usar datos reales de pacientes en el repositorio, tests, ejemplos o capturas. Todos los datos deben ser ficticios.

## Dominio: Administración y cobros (RN-AD)

- **RN-AD-01 — Precio de prestación.** El precio es una referencia; el cobro real se registra en caja (etapa posterior).
- **RN-AD-02 — Señas.** Una seña con Mercado Pago confirma el turno solo cuando el pago está acreditado (etapa posterior).
- **RN-AD-03 — Facturación.** La factura electrónica ARCA se emite desde el flujo de caja; no se inventa ni se simula como si estuviera integrada (etapa posterior).

## Dominio: Seguridad y cumplimiento (RN-SE)

- **RN-SE-01 [MVP] — Sin secretos.** El repositorio no contiene claves de API, tokens ni credenciales.
- **RN-SE-02 [MVP] — Datos ficticios.** Todos los ejemplos y pruebas usan datos ficticios.
- **RN-SE-03 — Datos sensibles de salud.** La historia clínica se trata como dato sensible; acceso mínimo y auditoría (etapa posterior).
- **RN-SE-04 — Ley 25.326.** El sistema debe poder declarar y demostrar medidas de protección de datos personales antes de operar con datos reales (etapa posterior).

## Dominio: Excepciones globales (RN-EX)

- **RN-EX-01 — Errores tipados.** Todo rechazo de negocio devuelve un código estable y un mensaje en español rioplatense.
- **RN-EX-02 — Sin decisiones improvisadas.** Si una regla no está especificada, no se implementa en Apply: se vuelve a Propose.
- **RN-EX-03 — Idempotencia de cancelación.** Cancelar un turno ya cancelado devuelve el mismo estado sin error 500.
