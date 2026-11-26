# Proposal

## Why

CrearTurno no valida que el inicio del turno sea futuro, por lo que hoy es posible agendar turnos en el pasado. Es un follow-up del change 	urno-creation (C-03) detectado al revisar las reglas de negocio.

## What Changes

- Se agrega el error de dominio TurnoEnElPasadoError con c�digo TURNO_EN_EL_PASADO en src/domain/turno/turno.errors.ts.
- Se agrega validaci�n en CrearTurno.execute: si input.inicio es anterior al momento actual, se lanza TurnoEnElPasadoError.
- Se mapea el error en src/http/error-handler.ts a HTTP 400.
- Se actualizan las fechas fijas 2026-11-18 a 2027-01-15 en los tests afectados para que sigan siendo futuras.

## Capabilities

### New Capabilities

- (ninguna)

### Modified Capabilities

- 	urnos: agrega el requisito de que el inicio del turno no sea anterior al momento actual; de lo contrario responde 400 con c�digo TURNO_EN_EL_PASADO.

## Impact

- C�digo afectado: src/domain/turno/turno.errors.ts, src/application/crear-turno.ts, src/http/error-handler.ts.
- Tests afectados: archivos con fechas fijas 2026-11-18.
- APIs: POST /api/turnos ahora puede responder 400 TURNO_EN_EL_PASADO.
- Dependencias: C-03 	urno-creation (DONE). Sin dependencias externas nuevas.
