# Equipo — Plan de trabajo para la entrega

> Documento operativo para repartir el trabajo del MVP entre los 5 integrantes.
> El alcance técnico vive en [`CHANGES.md`](../../CHANGES.md); la base conceptual, en [`knowledge-base/`](../../knowledge-base/).

## 1. Integrantes y responsabilidad

| Integrante | Etapa / changes | Ola | Evidencia principal |
|---|---|---|---|
| Alejo Pavon | Fundación: Discovery, KB, roadmap, estado + integración de PRs | 0 y 6 | Commits de `docs/discovery/`, `knowledge-base/`, `CHANGES.md`, estado; merges |
| Nathaniel Herrera | C-01 `foundation-setup`, C-02 `core-domain-models` | 1 | Scaffolding, dominio, tests de solapamiento |
| Lucas Timmermann | C-03 `turno-creation`, C-04 `agenda-queries`, C-05 `turno-cancellation` | 2 y 3 | Endpoints de turnos y tests de conflicto |
| Aracelly Caballero | C-06 `pacientes-crud`, C-10 `sqlite-persistence` | 2 y 4 | CRUD de pacientes, migraciones y adaptador SQLite |
| Javier Alaniz | C-09 `auth-rbac`, C-07 `bloqueos-agenda`, C-08 `sobreturnos` | 3, 4 y 5 | Login/sesiones, bloqueos y sobreturnos |

**Fuera de alcance del TP:** C-11 a C-19 (reserva online, WhatsApp, pagos, ARCA, obras sociales, historia clínica, multi-sucursal, reportes). No tomarlos para esta entrega.

## 2. Estado de partida

- La fundación está completa: entorno, estado, Discovery, KB y roadmap.
- El código de C-01 a C-10 ya está integrado en `main`: API, dominio, auth, pacientes, bloqueos, sobreturnos y persistencia SQLite.
- Alejo ya tiene commits de la fundación. Los otros cuatro integrantes deben generar sus propios commits con su nombre y email.

## 3. Olas de trabajo (orden obligatorio)

```text
OLA 0 — Fundación (hecha por Alejo)
  └── repositorio con docs, KB y CHANGES.md

OLA 1 — Nathaniel
  └── C-01 foundation-setup
        └── C-02 core-domain-models
              │
OLA 2 — paralelo, después de mergear C-02
  ├── Lucas: C-03 turno-creation
  └── Aracelly: C-06 pacientes-crud

OLA 3 — después de mergear C-03
  ├── Lucas: C-04 agenda-queries → C-05 turno-cancellation
  └── Javier: C-09 auth-rbac (rebasa cuando C-04 esté mergeado)

OLA 4 — después de C-05, C-06 y C-09
  ├── Aracelly: C-10 sqlite-persistence
  └── Javier: C-07 bloqueos-agenda

OLA 5 — después de C-07
  └── Javier: C-08 sobreturnos

OLA 6 — Alejo
  └── revisión final, README, verificación y preparación de la defensa
```

**Regla de oro:** nadie empieza su change hasta que el PR del que depende esté mergeado en `main` y haya hecho `git pull`. Si se adelanta, va a trabajar sobre una base que todavía no existe.

## 4. Convenciones compartidas (contrato entre todos)

Estas decisiones ya están en la KB. No cambiarlas sin acordarlo con el equipo.

- **Stack:** Node.js 22.13 / 24 LTS, TypeScript 5 estricto, Fastify 5, Zod 4, Vitest 5, ESM.
- **Fechas:** ISO 8601 UTC en la API; zona de negocio `America/Argentina/Buenos_Aires` solo para mostrar.
- **Intervalos:** semiabiertos `[inicio, fin)`. `A` y `B` se solapan si `A.inicio < B.fin && A.fin > B.inicio`.
- **Estados de turno:** `pendiente | confirmado | atendido | cancelado | ausente`.
- **Errores HTTP:** JSON `{ "code": "...", "message": "...", "details": {...} }`, con códigos estables (`TURNO_SOLAPADO_PROFESIONAL`, `TURNO_SOLAPADO_SILLON`, `TURNO_INTERVALO_INVALIDO`, etc.).
- **Estructura:** `src/domain`, `src/application`, `src/infrastructure`, `src/http`; tests en `tests/unit` y `tests/integration`.
- **Datos:** todos ficticios. Prohibido usar nombres, teléfonos, documentos o historias de pacientes reales.
- **Secretos:** ninguno en el repo. `.env` ignorado; `.env.example` con valores de ejemplo.
- **Sin UI:** el entregable es API REST + tests. No se construye frontend.

### Propiedad de archivos

| Área | Dueño | Archivos |
|---|---|---|
| Base, servidor, configuración | Nathaniel | `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/main.ts`, `src/http/server.ts` |
| Dominio de turnos | Lucas | `src/domain/turno/**`, `src/application/*turno*`, `src/http/routes/turnos.ts`, tests de turnos |
| Pacientes y persistencia | Aracelly | `src/domain/paciente/**`, `src/http/routes/pacientes.ts`, `src/infrastructure/persistence/**`, `migrations/**`, tests de pacientes y persistencia |
| Auth, bloqueos, sobreturnos | Javier | `src/domain/usuario/**`, `src/domain/bloqueo/**`, `src/application/auth/**`, `src/http/plugins/auth.ts`, `src/http/routes/bloqueos.ts`, tests de auth y bloqueos |
| Integración | Alejo | `README.md`, `CHANGES.md`, revisión de PRs |

Si dos personas necesitan tocar el mismo archivo (por ejemplo `src/http/routes/index.ts`), **conservar los dos registros** al resolver el conflicto; no borrar el trabajo del otro.

## 5. Flujo Git obligatorio

Cada integrante trabaja en su propia rama y abre un Pull Request. **No se pushea directo a `main`.**

```bash
git clone <URL-del-repo>
cd <carpeta-del-repo>
npm ci             # instala exactamente las versiones de package-lock.json

# Identidad propia: sin esto, el commit queda a nombre de otro
git config user.name "Nombre Apellido"
git config user.email "tu-email-de-github@users.noreply.github.com"

git switch main
git pull --rebase
git switch -c feat/c-03-turno-creation

# ... implementar ...

npm run typecheck
npm test
git status
git add <archivos-de-tu-change>
git commit -m "feat(turnos): crear turno con validacion de solapamientos"
git push -u origin feat/c-03-turno-creation
```

- Un PR por change (o por par de changes si la guía lo indica).
- Título del PR: `C-03 — turno-creation`.
- En la descripción: qué hiciste, cómo lo probaste y qué criterios de aceptación cumplís.
- Commits chicos y con prefijo: `feat(turnos):`, `fix(pacientes):`, `test(dominio):`, `docs(equipo):`.
- No commitear `node_modules/`, `dist/`, `.env`, `*.db`, capturas temporales ni datos reales.
- Antes de pedir review: `git fetch origin && git rebase origin/main` y resolver conflictos.

### Integración (lo hace Alejo)

- Revisar que el autor del commit sea el integrante correcto: `git log --format='%h %an <%ae> %s'`.
- Mergear con **“Create a merge commit”**. **No usar squash**: el squash deja el commit a nombre de quien mergea y borra la autoría del integrante.
- Orden: Nathaniel → Lucas/Aracelly (ola 2) → Lucas/Javier (ola 3) → Aracelly/Javier (ola 4) → Javier (ola 5).
- Después de cada merge, avisar al resto para que hagan `git pull --rebase`.

## 6. Verificación antes de cada PR

Checklist mínimo (copiarlo en la descripción del PR):

- [ ] `npm run typecheck` pasa sin errores.
- [ ] `npm test` pasa completo.
- [ ] El endpoint nuevo responde lo esperado con `curl` o test de integración.
- [ ] Los tests cubren caso feliz, error de negocio y caso borde.
- [ ] No hay secretos, datos reales ni archivos generados en el commit.
- [ ] Solo se tocaron archivos del change asignado (o se justificó el cambio compartido).
- [ ] Se actualizó el checkbox del change en `CHANGES.md` (solo la línea propia).

Comandos de referencia:

```bash
npm run typecheck
npm test
npm run dev
curl -s http://localhost:3000/health
```

## 7. Participación demostrable

Para la defensa, cada integrante debe poder:

1. Mostrar **al menos 2 commits propios** (uno por change, como mínimo) con `git log --author="Su Nombre" --oneline`.
2. Explicar qué regla de la KB implementó y por qué.
3. Mostrar el test que prueba su regla y correrlo en vivo.
4. Indicar qué archivos le pertenecen y cómo se integran con los del resto.
5. Mencionar una decisión o dificultad concreta que haya resuelto.

Cada guía individual tiene una sección **Evidencia para la defensa** con los puntos exactos que hay que guardar.

## 8. Nota académica: 5 integrantes vs. consigna

La consigna de la materia permite **hasta 3 integrantes**. El grupo decidió organizarse en **5** y el trabajo está dividido para que los cinco tengan commits propios. Antes de la entrega hay que confirmar con la cátedra si acepta 5 integrantes.

Si la cátedra no lo acepta, la división ya está modularizada para reducir a 3 sin rehacer el trabajo:

- **Persona 1:** C-01, C-02, C-03 (base y creación de turnos).
- **Persona 2:** C-04, C-05, C-06 (consultas, cancelación y pacientes).
- **Persona 3:** C-07, C-08, C-09, C-10 (seguridad, reglas avanzadas y persistencia).

## 9. Enlaces útiles

- [`CHANGES.md`](../../CHANGES.md) — alcance, dependencias y criterios de cada change.
- [`knowledge-base/05_reglas_de_negocio.md`](../../knowledge-base/05_reglas_de_negocio.md) — reglas RN.
- [`knowledge-base/07_flujos_principales.md`](../../knowledge-base/07_flujos_principales.md) — flujos esperados.
- [`knowledge-base/08_arquitectura_propuesta.md`](../../knowledge-base/08_arquitectura_propuesta.md) — estructura de carpetas y patrones.
- [`docs/discovery/informe-discovery.md`](../discovery/informe-discovery.md) — investigación y MVP recomendado.
