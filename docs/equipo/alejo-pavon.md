# Alejo Pavon — Fundación e integración

## Tu rol

Ya entregaste la fundación. Ahora sos el integrador: subís el repo, revisás los PRs, mantenés el orden de merges y preparás la defensa. **No reimplementes el trabajo de los demás.**

**Ola:** 0 (hecha) y 6 (integración final).
**Changes:** no tenés C-NN de código asignado. Tu evidencia son los commits de la fundación y los merges.

## Lo que ya está entregado

| Etapa | Evidencia |
|---|---|
| Entorno y estado | `openspec/`, `.active-orchestrator-state.json` |
| Discovery | `docs/discovery/informe-discovery.md`, `.html`, `.pdf` |
| Knowledge Base | `knowledge-base/` (10 canónicos + README) |
| Roadmap | `CHANGES.md` (19 changes) |
| Plan del equipo | `docs/equipo/` (este documento y las 4 guías) |

Verificá tu autoría:

```bash
git log --author="Alejo Pavon" --oneline
git log --format='%h %an <%ae> %s' -10
```

> Los commits actuales de la fundación están a nombre de Alejo Pavon. Los otros cuatro integrantes deben configurar su propia identidad **antes** de commitear; si no, todo queda a tu nombre y la participación no es demostrable.

## Paso 1 — Subir el repositorio y dar acceso

```bash
# Desde la raíz del proyecto
git remote -v
# Si no hay remote:
git remote add origin https://github.com/<usuario>/<repo>.git

git branch -M main
git push -u origin main
```

En GitHub:

- [ ] Crear el repositorio (privado o público, según la cátedra).
- [ ] Invitar a Nathaniel, Lucas, Aracelly y Javier como colaboradores.
- [ ] Proteger `main`: prohibir push directo y exigir PR (opcional pero recomendado).
- [ ] Verificar que `node_modules/`, `dist/`, `.env` y `data/` no estén versionados.

## Paso 2 — Revisar cada PR

Checklist por PR:

- [ ] El autor del commit es el integrante correcto: `git log --format='%h %an <%ae> %s'`.
- [ ] La rama sigue el nombre acordado (`feat/c-XX-...`).
- [ ] El PR tiene título `C-XX — nombre-del-change` y descripción con pruebas.
- [ ] `npm ci && npm run typecheck && npm test` pasa en la rama.
- [ ] Se cumplen los criterios de aceptación del change en `CHANGES.md`.
- [ ] No hay secretos, datos reales de pacientes, `node_modules`, `dist`, `.env` ni `*.db`.
- [ ] Solo se tocaron los archivos del change o se justificó el cambio compartido.
- [ ] El checkbox del change quedó marcado en `CHANGES.md`.

Para probar una rama localmente:

```bash
git fetch origin
gh pr checkout <número>
npm ci
npm run typecheck
npm test
```

## Paso 3 — Mergear en orden y sin squash

**Usar “Create a merge commit”. No usar “Squash and merge”**: el squash reescribe el commit a nombre de quien mergea y borra la autoría del integrante.

Orden obligatorio:

| Orden | PR | Depende de |
|---|---|---|
| 1 | C-01 foundation-setup | — |
| 2 | C-02 core-domain-models | C-01 |
| 3 | C-03 turno-creation | C-02 |
| 4 | C-06 pacientes-crud | C-02 |
| 5 | C-04 agenda-queries | C-03 |
| 6 | C-05 turno-cancellation | C-03 |
| 7 | C-09 auth-rbac | C-02 + C-03 + C-04 (para scoping) |
| 8 | C-07 bloqueos-agenda | C-09 |
| 9 | C-10 sqlite-persistence | C-05 + C-06 |
| 10 | C-08 sobreturnos | C-07 |

Después de cada merge, avisá al grupo para que hagan:

```bash
git switch main
git pull --rebase
```

Si hay conflictos en archivos compartidos (`server.ts`, `routes/index.ts`, `crear-turno.ts`), resolvelos conservando **ambos** cambios y volvé a correr los tests antes de mergear.

## Paso 4 — Verificación final (definition of done del TP)

Con todo mergeado, en un clon limpio:

```bash
git clone <URL> verificacion
cd verificacion
npm ci
npm run typecheck
npm test
npm run dev
```

- [ ] `GET /health` responde `200`.
- [ ] Crear turno válido → `201`.
- [ ] Turno solapado por profesional → `409 TURNO_SOLAPADO_PROFESIONAL`.
- [ ] Turno solapado por sillón → `409 TURNO_SOLAPADO_SILLON`.
- [ ] Turno contiguo → `201`.
- [ ] Cancelar turno y recrearlo → `201`.
- [ ] Login, logout y ruta privada sin sesión → `401`.
- [ ] Paciente inactivo no recibe turno → `409`.
- [ ] `PERSISTENCE=sqlite` persiste tras reiniciar.
- [ ] Los 5 integrantes aparecen como autores:

```bash
git log --format='%an' | sort | uniq -c
```

- [ ] `README.md` refleja el estado real (KB y Roadmap completos; fases 0 a 6 según corresponda).
- [ ] `CHANGES.md` tiene marcados los changes implementados.
- [ ] No hay datos reales ni secretos.

## Paso 5 — Preparar la defensa

Cada integrante expone su parte (2–3 minutos):

| Integrante | Qué explica |
|---|---|
| Alejo | Fundación, Discovery, KB, roadmap, integración y estado del repo |
| Nathaniel | Scaffolding, arquitectura en capas, intervalo semiabierto y tests de borde |
| Lucas | Creación de turnos, doble solapamiento (profesional y sillón), cancelación |
| Aracelly | Pacientes, baja lógica y paso de memoria a SQLite |
| Javier | Login/sesión, RBAC, bloqueos y sobreturnos |

Guion sugerido:

1. Problema y hallazgo del Discovery: nadie demuestra públicamente el no-solapamiento por profesional **y** sillón.
2. Regla central y por qué `[inicio, fin)` evita falsos conflictos.
3. Demo en vivo: crear, chocar, cancelar, recrear.
4. Cómo se organizó el equipo y qué hizo cada uno.
5. Limitaciones y próximos pasos (C-11 a C-19).

## Reglas para no romper la autoría

- No hagas commits por otros ni les pidas que commiteen desde tu máquina.
- No mergees con squash.
- No reescribas la historia (`rebase -i`, `filter-branch`, `push --force`) una vez que el repo está compartido.
- Si un integrante no puede pushear, que comparta el repo o un parche; no commitees vos su código.

## Definition of Done

- [ ] Repo subido y colaboradores invitados.
- [ ] Los 10 changes del TP mergeados en orden.
- [ ] Los 5 integrantes tienen commits propios en `main`.
- [ ] Verificación final en clon limpio aprobada.
- [ ] README y CHANGES actualizados.
- [ ] Defensa ensayada con los 5 integrantes.
