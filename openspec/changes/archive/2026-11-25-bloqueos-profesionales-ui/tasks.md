# Tasks

## 1. Línea base y utilidades puras (TDD)

- [x] 1.1 Registrar la línea base de seguridad: ejecutar `npm test` antes de tocar archivos y verificar 403/403 en verde; si hay fallos previos, documentarlos como preexistentes en el informe del change.
- [x] 1.2 RED: agregar en `tests/unit/web/helpers.test.js` casos para `rangoDeBloqueo(desde, hasta)` que esperen `{ inicio, fin }` con `inicio` del primer día, `fin` del último día inclusive en ISO 8601 UTC, y rechazo de fechas invertidas e iguales; verificar que el test falla por función inexistente.
- [x] 1.3 GREEN: implementar `rangoDeBloqueo()` en `web/helpers.js` como función pura sobre `rangoDelDia()`, con error legible para `desde >= hasta`; verificar que el test nuevo pasa sin tocar el DOM.
- [x] 1.4 Triangulate: agregar casos de rango de varios días, cruce de mes/año y fecha igual; verificar que `rangoDeBloqueo()` mantiene el extremo final inclusivo y la conversión a `America/Argentina/Buenos_Aires`.
- [x] 1.5 Refactor: simplificar `rangoDeBloqueo()` sin importar DOM ni dependencias nuevas; verificar `npm test` en verde y que `web/helpers.js` siga siendo apto para importar en Node.
- [x] 1.6 RED/GREEN: actualizar el caso de `cargasPorVista("bloqueos")` para esperar `["catalogos", "bloqueos"]`, implementar el cambio en `web/helpers.js` y verificar que las cargas de `agenda`, `pacientes`, `nuevo-turno` y vistas desconocidas no se alteran.

## 2. Formulario de alta de bloqueos en `vistaBloqueos()`

- [x] 2.1 RED/GREEN: preparar el render de la pestaña para mostrar siempre el formulario (incluso con lista vacía) usando `.card form` y el selector de profesionales con `opcionesSelect()` y `persona()`; verificar con `npm test` que los helpers siguen en verde y con `npm run lint` que no hay errores en `web/app.js`.
- [x] 2.2 Agregar inputs `desde` y `hasta` tipo `date` con valor por defecto `hoyEnZona()`, y `motivo` obligatorio en el mismo formulario; verificar que la vista renderiza los tres campos y el botón de guardado sin clases ni assets nuevos.
- [x] 2.3 Implementar el envío a `POST /api/bloqueos` con `{ profesionalId, inicio, fin, motivo }` calculado con `rangoDeBloqueo()`; verificar que no se agregan reglas de negocio ni se envían campos del example.
- [x] 2.4 Validar `desde <= hasta` antes de la request y mostrar el error con `notificar()`; verificar que el error impide el POST, respeta el formato de mensajes existente y que los errores de la API siguen pasando por `manejarError()`.
- [x] 2.5 Tras el alta, mostrar confirmación con `notificar()` y recargar `cargarBloqueos()` antes de renderizar; verificar que el bloqueo creado aparece en la tabla y que la lista vacía deja de mostrarse.

## 3. Eliminación según el rol

- [x] 3.1 RED/GREEN: agregar en cada fila real de bloqueos una acción `data-accion="eliminar-bloqueo"` renderizada solo cuando `esGestion()` y el rol es `administrador`; verificar que `recepcionista` ve la tabla y el formulario sin ningún botón de eliminación.
- [x] 3.2 Implementar el manejador que envía `DELETE /api/bloqueos/:id` con el `id` codificado; verificar que usa la misma instancia `api()` y que no se inventan rutas ni códigos de error nuevos.
- [x] 3.3 Manejar éxito y error de la eliminación con `notificar()` y `manejarError()`, recargando la lista en ambos casos antes de renderizar; verificar que un `403` de la API no rompe la vista y que el bloqueo desaparece tras una eliminación correcta.

## 4. Bloqueo ilustrativo `Ejemplo`

- [x] 4.1 RED/GREEN: renderizar una fila o tarjeta de bloqueo etiquetada visiblemente como `Ejemplo`, usando el primer profesional de `estado.profesionales` y fechas demo fijas; verificar que aparece cuando `estado.bloqueos` está vacío junto al mensaje de estado vacío.
- [x] 4.2 Diferenciar el ejemplo de los bloqueos reales y omitirlo si no hay profesionales en el catálogo; verificar que nunca se envía en el POST, no tiene acción de eliminación y no se persiste ni en memoria ni en SQLite tras `cargarSeed()`.

## 5. Verificación del change

- [x] 5.1 Ejecutar `npm test` y verificar la suite completa en verde, incluidos los tests nuevos de `web/helpers.js` y la línea base de 403 tests.
- [x] 5.2 Ejecutar `npm run typecheck` y `npm run lint` y verificar que ambos terminan sin errores, sin usar `any` ni agregar dependencias.
- [x] 5.3 Verificar de forma manual en el navegador que el selector se llena al navegar a Bloqueos, el alta con rango válido funciona, el rango invertido muestra error sin POST, el ejemplo aparece con lista vacía y solo `administrador` ve la eliminación; registrar cualquier desviación.
- [x] 5.4 Confirmar que `src/`, `migrations/`, `src/http/routes/frontend.ts` y `package.json` no fueron tocados, que no hay carpeta `mockups/` y que el change queda sin commit ni push.

## Workflow follow-up

- Sincronizar el delta de `interfaz-web` al spec principal al archivar el change.
- Archivar el cambio tras la revisión y verificar el resultado; NO commitear ni pushear sin pedido explícito.
