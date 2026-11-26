# Design

## Context

CrearTurno (C-03) valida recursos, solapamientos y bloqueos, pero no el momento del turno. Las fechas fijas de los tests (2026-11-18) dejan de ser futuras con el paso del tiempo, lo que puede hacer fallar tests que asumen turnos v�lidos. Este change agrega la validaci�n m�nima y actualiza esas fechas.

## Goals / Non-Goals

**Goals:**
- Rechazar la creaci�n de turnos cuyo inicio sea anterior al momento actual con 400 TURNO_EN_EL_PASADO.
- Mantener la validaci�n en el dominio/aplicaci�n (no en el borde HTTP) para que sea testeable sin servidor.
- Actualizar fechas fijas de tests a 2027-01-15.

**Non-Goals:**
- No se valida fecha m�xima futura ni horario de atenci�n.
- No se modifica la zona horaria ni el c�lculo de in.

## UI Mockups

Decision: no (no UI)

## Decisions

- **Validaci�n en CrearTurno.execute.** Se compara input.inicio.getTime() < Date.now() y se lanza TurnoEnElPasadoError. Se coloca al inicio de execute, antes de cargar recursos, para fallar r�pido y evitar trabajo innecesario. Alternativa: validar en el handler HTTP; se descarta para mantener el dominio aislado y testeable sin servidor.
- **Comparaci�n estricta <.** Un inicio igual al momento actual se considera v�lido (sem�ntica de "anterior").
- **Nuevo error de dominio.** TurnoEnElPasadoError extiende DominioError con code = "TURNO_EN_EL_PASADO", consistente con el resto de errores del m�dulo.
- **Mapeo centralizado.** error-handler.ts traduce TurnoEnElPasadoError (por instancia/c�digo) a HTTP 400 con shape { code, message, details }.
- **Fechas de tests.** Se reemplaza 2026-11-18 por 2027-01-15 en los archivos afectados para mantener turnos futuros.

## Risks / Trade-offs

- [Reloj del sistema] la validaci�n depende de Date.now(); en tests con fechas fijas futuras no hay riesgo. Tests que creen turnos "ahora" deben usar fechas futuras.
- [Concurrencia] la comparaci�n no es at�mica con la persistencia; aceptable en v0.1.

## Migration Plan

No aplica migraci�n de datos. Se integra en rama eat/c-XX-turno-fecha-pasada y se fusiona v�a PR tras pasar 
pm run typecheck y 
pm test.

## Open Questions

- (ninguna)
