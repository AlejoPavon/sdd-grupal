# Tasks

## 1. Dominio

- [x] 1.1 Agregar TurnoEnElPasadoError (code TURNO_EN_EL_PASADO) en src/domain/turno/turno.errors.ts y verificar npm run typecheck
- [x] 1.2 Agregar validación en CrearTurno.execute: if (input.inicio.getTime() < Date.now()) throw new TurnoEnElPasadoError() y verificar npm run typecheck

## 2. Capa HTTP

- [x] 2.1 Mapear TurnoEnElPasadoError a HTTP 400 en src/http/error-handler.ts y verificar npm run typecheck

## 3. Tests

- [x] 3.1 Actualizar fechas fijas 2026-11-18 a 2027-01-15 en los archivos afectados y verificar npm test
- [x] 3.2 Agregar caso de test para turno en el pasado (400 TURNO_EN_EL_PASADO) y verificar npm test

## 4. Verificación

- [x] 4.1 Ejecutar npm run typecheck y npm test completos sin regresiones
