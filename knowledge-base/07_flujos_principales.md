# Flujos Principales

Cada flujo se documenta extremo a extremo. Los flujos marcados **[MVP]** son los que debe cubrir el primer change.

## Flujo 1: Crear turno sin solapamientos [MVP]

**Disparador**: la recepcionista envía `POST /api/turnos`.
**Actor**: Recepcionista / Administrador.

**Pasos**:
1. **HTTP** recibe el body y valida el schema con Zod (`pacienteId`, `profesionalId`, `sillonId`, `prestacionId`, `inicio`).
2. **Aplicación** carga paciente, profesional, sillón y prestación desde sus repositorios.
3. **Dominio** verifica existencia y estado activo de los cuatro recursos (RN-AG-08, RN-AG-09).
4. **Dominio** calcula `fin = inicio + duracionMinutos` (RN-AG-02) y valida `fin > inicio` (RN-AG-03).
5. **Dominio** busca turnos activos del profesional que se superpongan con `[inicio, fin)` (RN-AG-04).
6. **Dominio** busca turnos activos del sillón que se superpongan con `[inicio, fin)` (RN-AG-05).
7. Si no hay conflictos, **Infraestructura** persiste el turno en estado `pendiente`.
8. **HTTP** responde `201` con el turno creado.

```text
Recepcionista → API → Caso de uso → Dominio → Repositorio
                                              ← turno persistido
             ← 201 { id, inicio, fin, estado }
```

**Casos de error**:
- Recurso inexistente → `404` (`PACIENTE_NO_ENCONTRADO`, `PROFESIONAL_NO_ENCONTRADO`, `SILLON_NO_ENCONTRADO`, `PRESTACION_NO_ENCONTRADA`).
- Recurso inactivo → `409` (`RECURSO_INACTIVO`).
- Intervalo inválido (`fin <= inicio`) → `400` (`TURNO_INTERVALO_INVALIDO`).
- Solapamiento de profesional → `409` (`TURNO_SOLAPADO_PROFESIONAL`) con el turno en conflicto.
- Solapamiento de sillón → `409` (`TURNO_SOLAPADO_SILLON`) con el turno en conflicto.

## Flujo 2: Turnos contiguos (caso borde) [MVP]

**Disparador**: se crea un turno que empieza exactamente al `fin` de otro.

**Pasos**:
1. Turno A: `[09:00, 09:30)`.
2. Turno B: `[09:30, 10:00)`.
3. La comparación de solapamiento es `A.inicio < B.fin && A.fin > B.inicio`.
4. Para B: `09:30 < 09:30` es falso → no hay solapamiento.
5. Ambos turnos se persisten.

**Casos de error**:
- Si el turno empieza un minuto antes (09:29), el solapamiento es verdadero y se rechaza.

## Flujo 3: Cancelación de turno [MVP]

**Disparador**: la recepcionista envía `PATCH /api/turnos/:id/cancelar`.

**Pasos**:
1. **Aplicación** busca el turno por `id`.
2. **Dominio** valida que el estado permita cancelar (RN-TU-01).
3. **Dominio** cambia el estado a `cancelado` y registra `cancelledAt`.
4. **Infraestructura** persiste el cambio.
5. **HTTP** responde `200` con el turno actualizado.
6. Un turno nuevo en el mismo horario ya no encuentra conflicto (RN-AG-07).

**Casos de error**:
- Turno inexistente → `404`.
- Turno ya `atendido` → `409` (`TRANSICION_INVALIDA`).
- Turno ya `cancelado` → `200` idempotente, sin cambios.

## Flujo 4: Consulta de agenda [MVP]

**Disparador**: `GET /api/turnos?desde=2026-11-18T03:00:00Z&hasta=2026-11-19T03:00:00Z`.

**Pasos**:
1. **HTTP** valida el rango y los filtros opcionales (`profesionalId`, `sillonId`).
2. **Aplicación** consulta turnos activos que intersectan el rango.
3. **Infraestructura** aplica índices `(profesionalId, inicio, fin)` y `(sillonId, inicio, fin)`.
4. **HTTP** devuelve la lista ordenada por `inicio` con paciente y prestación resumidos.

**Casos de error**:
- `desde >= hasta` → `400` (`RANGO_INVALIDO`).

## Flujo 5: Reserva online [etapa posterior]

**Disparador**: el paciente abre el link público y elige un horario.

**Pasos**:
1. El paciente consulta `/api/disponibilidad` con profesional y prestación.
2. El sistema calcula huecos libres aplicando las mismas reglas de solapamiento del dominio.
3. El paciente solicita la reserva y el turno queda `pendiente`.
4. Se envía confirmación por WhatsApp/email.
5. La recepción confirma o el pago de la seña confirma automáticamente.

**Casos de error**:
- El hueco se ocupó entre la consulta y la reserva → `409` y se ofrece otro horario.

## Flujo 6: Sobreturno [etapa posterior]

**Disparador**: una urgencia requiere un turno adicional.

**Pasos**:
1. La recepcionista marca `esSobreturno: true`.
2. El dominio permite el solapamiento con el profesional.
3. El dominio **rechaza** el solapamiento con el sillón.
4. El turno queda auditado con el flag y el usuario que lo autorizó.
