# Nathaniel Herrera — Cimientos (C-01 y C-02)

## Tu rol

Sos la base técnica del equipo. Sin tu primer PR nadie más puede empezar. Tu trabajo define el esqueleto del proyecto y el contrato de dominio que Lucas, Aracelly y Javier van a usar.

**Ola:** 1 (bloqueante para todos).
**Changes:** `C-01 foundation-setup` y `C-02 core-domain-models`.
**Guía canónica:** [`CHANGES.md`](../../CHANGES.md) §C-01 y §C-02.

## Antes de empezar

- [ ] Leer `knowledge-base/02_descripcion_general.md`, `04_modelo_de_datos.md`, `05_reglas_de_negocio.md`, `08_arquitectura_propuesta.md` y `09_decisiones_y_supuestos.md`.
- [ ] Tener Node.js 20 LTS o superior y npm 10+.
- [ ] Clonar el repo que sube Alejo y verificar que `knowledge-base/` y `CHANGES.md` existen.
- [ ] Configurar tu identidad de Git (ver abajo).

## Git

```bash
git config user.name "Nathaniel Herrera"
git config user.email "tu-email-de-github@users.noreply.github.com"

git switch main
git pull --rebase
git switch -c feat/c-01-foundation
```

Hacé **dos PRs separados**:

1. `feat/c-01-foundation` → `C-01`.
2. Cuando el PR 1 esté mergeado: `git switch main && git pull --rebase && git switch -c feat/c-02-core-domain` → `C-02`.

No mezcles los dos changes en un solo PR: si C-01 tiene un problema, C-02 no debería quedar bloqueado.

---

## C-01 — `foundation-setup`

### Objetivo

Dejar un proyecto TypeScript + Fastify que arranque, compile, testee y tenga un health check. Nada más.

### Archivos que te pertenecen

- `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`
- `src/main.ts`, `src/http/server.ts`
- `.env.example`, `.gitignore`
- `tests/integration/health.test.ts`

### Implementación

1. Crear `package.json` con:
   - `"type": "module"`, `"engines": { "node": ">=20" }`.
   - Scripts: `dev` (`tsx watch src/main.ts`), `build` (`tsc -p tsconfig.json`), `start` (`node dist/main.js`), `test` (`vitest run`), `test:watch` (`vitest`), `typecheck` (`tsc --noEmit`), `lint` (`eslint .`).
   - Dependencias: `fastify`, `zod`, `dotenv`.
   - Dev: `typescript`, `vitest`, `tsx`, `@types/node`, `eslint`, `typescript-eslint`.
2. `tsconfig.json`: `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `strict: true`, `noUncheckedIndexedAccess: true`, `esModuleInterop: true`, `skipLibCheck: true`, `outDir: dist`, `rootDir: src`.
   - **Sin aliases (`@/...`)**: usá imports relativos. Así `tsc` + `node dist/main.js` funcionan sin herramientas extra.
   - **Importante:** con `NodeNext` los imports relativos en TypeScript llevan `.js` (`import { buildServer } from "./http/server.js"`). Es la causa número uno de errores de arranque.
3. `src/http/server.ts`: exportar `buildServer()` que crea una instancia de Fastify, registra `GET /health` → `{ status: "ok" }` y devuelve la instancia.
4. `src/main.ts`: importar `"dotenv/config"` al inicio, importar `buildServer`, leer `PORT` (default `3000`), `await app.listen({ port, host: "0.0.0.0" })`.
5. `.env.example`:
   ```text
   PORT=3000
   NODE_ENV=development
   TZ=America/Argentina/Buenos_Aires
   ```
6. `.gitignore`: `node_modules/`, `dist/`, `.env`, `*.db`, `data/`, `.DS_Store`.
7. `vitest.config.ts` con `test.environment: "node"` y `test.include: ["tests/**/*.test.ts"]`.
8. `eslint.config.js` mínimo con `typescript-eslint` recommended.
9. Test `tests/integration/health.test.ts`: usar `app.inject({ method: "GET", url: "/health" })` y verificar `200` + `{ status: "ok" }`.

### Verificación

```bash
npm install
npm run typecheck
npm test
npm run lint
npm run dev
curl -s http://localhost:3000/health
```

### Criterios de aceptación

- [ ] `npm run typecheck`, `npm test` y `npm run lint` pasan.
- [ ] `GET /health` responde `200` con `{ "status": "ok" }`.
- [ ] No hay secretos ni `.env` commiteado.
- [ ] El proyecto arranca desde cero con `npm ci`.

### Commits sugeridos

```text
chore(setup): crear scaffolding TypeScript con Fastify y Vitest
test(setup): cubrir health check
docs(setup): documentar variables de entorno de desarrollo
```

---

## C-02 — `core-domain-models`

### Objetivo

Definir el dominio puro (sin Fastify ni persistencia) y los repositorios en memoria. Este es el contrato que usan todos los demás.

### Archivos que te pertenecen

- `src/domain/turno/intervalo.ts`
- `src/domain/turno/estado-turno.ts`
- `src/domain/turno/turno.ts`
- `src/domain/turno/turno.errors.ts`
- `src/domain/paciente/paciente.ts`
- `src/domain/profesional/profesional.ts`
- `src/domain/sillon/sillon.ts`
- `src/domain/prestacion/prestacion.ts`
- `src/domain/usuario/usuario.ts`
- `src/domain/sucursal/sucursal.ts`
- `src/application/ports/*.ts`
- `src/infrastructure/persistence/in-memory-*.ts`
- `src/infrastructure/seed.ts`
- `tests/unit/domain/*.test.ts`, `tests/unit/infrastructure/*.test.ts`

### Implementación

1. **`Intervalo`**
   - Constructor con `inicio: Date`, `fin: Date`.
   - Lanzar `IntervaloInvalidoError` si alguna fecha es inválida o si `fin <= inicio`.
   - `seSuperponeCon(otro: Intervalo): boolean` → `this.inicio < otro.fin && this.fin > otro.inicio`.
   - `duracionMinutos(): number`.
   - `static desdeInicioDuracion(inicio: Date, minutos: number): Intervalo`.
   - No usar strings de fecha en el dominio: `Date` en UTC.

2. **`EstadoTurno`**
   - Unión `"pendiente" | "confirmado" | "atendido" | "cancelado" | "ausente"`.
   - `puedeTransicionarA(desde, hacia): boolean` con las transiciones de `RN-TU-01`.
   - `ocupaAgenda(estado): boolean` → `true` solo para `pendiente` y `confirmado`.

3. **Entidades** (interfaces o tipos, no clases con lógica de infraestructura):
   - `Paciente`: `id`, `nombre`, `apellido`, `documento?`, `telefono?`, `email?`, `fechaNacimiento?`, `notas?`, `activo`, `createdAt`, `updatedAt`.
   - `Profesional`: `id`, `nombre`, `apellido`, `matricula`, `especialidades`, `activo`.
   - `Sillon`: `id`, `nombre`, `sucursalId`, `activo`.
   - `Prestacion`: `id`, `codigo`, `nombre`, `duracionMinutos`, `precio?`, `activo`.
   - `Turno`: `id`, `pacienteId`, `profesionalId`, `sillonId`, `prestacionId`, `inicio`, `fin`, `estado`, `esSobreturno`, `notas?`, `createdBy`, `autorizadoPor?`, `createdAt`, `updatedAt`, `cancelledAt?`.
   - `Usuario`: `id`, `email`, `passwordHash`, `nombre`, `apellido`, `rol`, `activo`.
   - `Sucursal`: `id`, `nombre`, `direccion`, `timezone`, `activa`.
   - IDs con `crypto.randomUUID()`.

4. **Errores de dominio** con `code` estable:
   - `IntervaloInvalidoError` → `TURNO_INTERVALO_INVALIDO`
   - `TurnoSolapadoError` → recibe `recurso: "profesional" | "sillon"` y `turnoEnConflicto`; expone `TURNO_SOLAPADO_PROFESIONAL` o `TURNO_SOLAPADO_SILLON`.
   - `RecursoNoEncontradoError` → `PACIENTE_NO_ENCONTRADO`, `PROFESIONAL_NO_ENCONTRADO`, etc.
   - `RecursoInactivoError` → `RECURSO_INACTIVO`.
   - `TransicionInvalidaError` → `TRANSICION_INVALIDA`.

5. **Puertos** (interfaces en `application/ports`):
   - `TurnoRepository`: `crear`, `buscarPorId`, `listar(filtros)`, `buscarSolapadoPorProfesional(profesionalId, intervalo, excluirId?)`, `buscarSolapadoPorSillon(sillonId, intervalo, excluirId?)`, `actualizar`.
   - `PacienteRepository`: `crear`, `buscarPorId`, `buscarActivoPorId`, `buscarPorEmailODocumento`, `listar(q?)`, `actualizar`.
   - `ProfesionalRepository`, `SillonRepository`, `PrestacionRepository`, `UsuarioRepository`: `buscarPorId`, `listar`, y los métodos de creación que necesites.
   - `listar` de turnos acepta `{ desde?, hasta?, profesionalId?, sillonId?, estados? }`.

6. **Repositorios en memoria** con `Map<string, T>`. Los métodos de solapamiento deben filtrar solo estados que ocupan agenda y usar `Intervalo.seSuperponeCon`. El repositorio no decide reglas: recibe el intervalo y devuelve coincidencias.

7. **Seed** (`src/infrastructure/seed.ts`): 1 sucursal, 2 sillones, 2 profesionales, 4 prestaciones (consulta 30, limpieza 45, endodoncia 90, control 15), 3 pacientes ficticios y 3 usuarios demo con `passwordHash` placeholder (`"cambiar-en-c-09"`; Javier los reemplaza al implementar auth). IDs fijos y documentados. Sin datos reales.

8. **Tests obligatorios**:
   - `[09:00, 09:30)` vs `[09:30, 10:00)` → **no** se superpone.
   - `[09:00, 10:00)` vs `[09:30, 10:30)` → **sí**.
   - `[09:00, 11:00)` contiene a `[09:30, 10:00)` → **sí**.
   - Intervalos idénticos → **sí**.
   - `fin <= inicio` → lanza `IntervaloInvalidoError`.
   - Turno cancelado no aparece en la búsqueda de solapamientos.
   - Transiciones válidas e inválidas de `EstadoTurno`.

### Verificación

```bash
npm run typecheck
npm test
```

### Criterios de aceptación

- [ ] El dominio no importa Fastify, Zod ni ningún repositorio concreto.
- [ ] La regla de borde `fin == inicio` está cubierta por un test que pasa.
- [ ] Los repositorios en memoria permiten crear y consultar turnos.
- [ ] El seed usa solo datos ficticios.
- [ ] `npm test` pasa completo.

### Commits sugeridos

```text
feat(domain): agregar intervalo semiabierto y estados de turno
feat(domain): definir entidades y errores del dominio
feat(application): definir puertos de repositorio
feat(infrastructure): implementar repositorios en memoria y seed demo
test(domain): cubrir solapamientos, bordes y transiciones
```

---

## Evidencia para la defensa

Guardá y mostrá:

1. `git log --author="Nathaniel Herrera" --oneline` con tus commits.
2. Salida de `npm test` con los tests de solapamiento en verde.
3. Explicación en 1 minuto del predicado `inicio < otro.fin && fin > otro.inicio` y por qué el caso `09:30` no es conflicto.
4. El árbol de carpetas de `src/` y por qué el dominio está separado de Fastify.
5. Qué decisión tomaste con `NodeNext` y los imports `.js`.

## Definition of Done

- [ ] C-01 y C-02 mergeados en `main` con tus commits.
- [ ] `npm ci && npm run typecheck && npm test` pasa en `main`.
- [ ] Avisaste al equipo que la ola 2 está desbloqueada.
- [ ] Tu nombre aparece como autor en `git log`.

## No tocar

- No implementes endpoints de turnos, pacientes, auth, bloqueos ni sobreturnos: son de Lucas, Aracelly y Javier.
- No agregues base de datos: C-10 es de Aracelly.
- No cambies las reglas de negocio de la KB para que tu código pase. Si algo no cierra, consultá al equipo.
