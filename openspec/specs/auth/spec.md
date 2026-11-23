# auth Specification

## Purpose
Permite autenticar usuarios con sesión de servidor y aplicar autorización por rol y por pertenencia, de modo que solo usuarios identificados accedan a la API y cada rol opere únicamente sobre los datos que le corresponden.

## Requirements

### Requirement: Inicio de sesión con credenciales válidas

El sistema SHALL autenticar mediante `POST /api/auth/login` con `{ email, password }` y, si el usuario existe, está activo y la contraseña coincide, responder `200` con `{ id, email, nombre, apellido, rol }` y una cookie de sesión `session`.

#### Scenario: Login exitoso

- **WHEN** se envía `POST /api/auth/login` con el email y el password correctos de un usuario activo
- **THEN** se responde `200` con `id`, `email`, `nombre`, `apellido` y `rol` del usuario
- **AND** la respuesta incluye la cookie `session` con un token de sesión válido

#### Scenario: Login de cada rol demo

- **WHEN** inicia sesión `admin@demo.local`, `recepcion@demo.local` u `odonto1@demo.local` con el password demo
- **THEN** la respuesta `200` informa el rol `administrador`, `recepcionista` o `profesional` respectivamente

### Requirement: Rechazo uniforme de credenciales inválidas

El sistema SHALL responder `401` con código `CREDENCIALES_INVALIDAS` y el mismo mensaje cuando el email no existe, cuando el password es incorrecto o cuando el usuario está inactivo, sin revelar cuál de los casos ocurrió.

#### Scenario: Email inexistente

- **WHEN** se envía `POST /api/auth/login` con un email que no pertenece a ningún usuario
- **THEN** se responde `401` con código `CREDENCIALES_INVALIDAS`

#### Scenario: Password incorrecto

- **WHEN** se envía `POST /api/auth/login` con un email existente y un password que no coincide
- **THEN** se responde `401` con código `CREDENCIALES_INVALIDAS`

#### Scenario: Usuario inactivo

- **WHEN** se envía `POST /api/auth/login` con credenciales correctas de un usuario inactivo
- **THEN** se responde `401` con código `CREDENCIALES_INVALIDAS`

#### Scenario: Mensaje idéntico entre casos

- **WHEN** se comparan las respuestas de email inexistente, password incorrecto y usuario inactivo
- **THEN** el `code` y el `message` son exactamente iguales en los tres casos
- **AND** no se emite cookie de sesión

### Requirement: Atributos de la cookie de sesión

El sistema SHALL emitir la cookie `session` con `httpOnly`, `sameSite=lax`, `path=/` y `secure` únicamente cuando el entorno es producción; su vigencia SHALL ser `SESSION_TTL_MINUTES` minutos, con valor por defecto 480.

#### Scenario: Cookie en desarrollo

- **WHEN** se inicia sesión con `NODE_ENV` distinto de `production`
- **THEN** la cookie `session` se emite con `httpOnly`, `sameSite=lax` y `path=/`
- **AND** no se marca `secure`

#### Scenario: Cookie en producción

- **WHEN** se inicia sesión con `NODE_ENV=production`
- **THEN** la cookie `session` se emite con el atributo `secure`

#### Scenario: Vigencia configurable

- **WHEN** se configura `SESSION_TTL_MINUTES` en un valor positivo
- **THEN** el vencimiento de la sesión y el `maxAge` de la cookie corresponden a ese valor en minutos

### Requirement: Cierre de sesión

El sistema SHALL cerrar la sesión mediante `POST /api/auth/logout`, invalidando el token en el servidor, borrando la cookie `session` y respondiendo `204` sin cuerpo.

#### Scenario: Logout con sesión válida

- **WHEN** se envía `POST /api/auth/logout` con una cookie de sesión válida
- **THEN** se responde `204`
- **AND** la respuesta borra la cookie `session`

#### Scenario: Reutilizar el token tras el logout

- **WHEN** se reutiliza la cookie de una sesión cerrada en una ruta privada
- **THEN** se responde `401` con código `NO_AUTENTICADO`

### Requirement: Consulta de sesión actual

El sistema SHALL devolver el usuario de la sesión vigente mediante `GET /api/auth/me` y responder `401` con código `NO_AUTENTICADO` cuando no hay sesión válida.

#### Scenario: Sesión vigente

- **WHEN** se envía `GET /api/auth/me` con una cookie de sesión válida
- **THEN** se responde `200` con `id`, `email`, `nombre`, `apellido` y `rol` del usuario

#### Scenario: Sin cookie

- **WHEN** se envía `GET /api/auth/me` sin cookie `session`
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Token inválido

- **WHEN** se envía `GET /api/auth/me` con una cookie `session` cuyo token no existe
- **THEN** se responde `401` con código `NO_AUTENTICADO`

### Requirement: Protección global de rutas privadas

El sistema SHALL exigir una sesión válida en toda ruta `/api/*` y responder `401` con código `NO_AUTENTICADO` cuando falta la cookie, el token no existe o la sesión expiró.

#### Scenario: Ruta privada sin cookie

- **WHEN** se envía una request a cualquier `/api/*` distinta de `POST /api/auth/login` sin cookie `session`
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Token inexistente

- **WHEN** se envía una request a una ruta privada con una cookie `session` que contiene un token desconocido
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Sesión expirada

- **WHEN** se envía una request a una ruta privada con una sesión cuyo vencimiento ya pasó
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Ruta privada con sesión

- **WHEN** se envía una request a una ruta privada con una cookie de sesión válida
- **THEN** la request continúa hacia el handler y no se responde `401`

### Requirement: Rutas públicas

El sistema SHALL permitir sin sesión `GET /health` y `POST /api/auth/login`; el resto de las rutas que no empiezan con `/api/` no SHALL ser interceptadas por la protección global.

#### Scenario: Health público

- **WHEN** se envía `GET /health` sin cookie de sesión
- **THEN** se responde `200` con `{ "status": "ok" }`

#### Scenario: Login público

- **WHEN** se envía `POST /api/auth/login` sin cookie de sesión
- **THEN** la request llega al handler de login y responde `200` o `401` según las credenciales

#### Scenario: Ruta fuera de /api

- **WHEN** se envía una request a una ruta que no empieza con `/api/` ni es `/health`
- **THEN** la protección global de autenticación no la intercepta

### Requirement: Autorización por rol

El sistema SHALL restringir las rutas que declaran roles permitidos: sin sesión responde `401` con código `NO_AUTENTICADO` y, con sesión válida pero rol no permitido, responde `403` con código `SIN_PERMISO`.

#### Scenario: Rol insuficiente

- **WHEN** un usuario autenticado con rol `profesional` invoca una ruta que exige `administrador` o `recepcionista`
- **THEN** se responde `403` con código `SIN_PERMISO`

#### Scenario: Sin sesión en ruta con roles

- **WHEN** se invoca una ruta que declara roles permitidos sin cookie de sesión
- **THEN** se responde `401` con código `NO_AUTENTICADO`

#### Scenario: Rol permitido

- **WHEN** un usuario autenticado con un rol incluido en la lista permitida invoca la ruta
- **THEN** la request continúa hacia el handler

### Requirement: Token de sesión opaco

El sistema SHALL generar el token de sesión con al menos 32 bytes aleatorios codificados en base64url y SHALL conservarlo solo en el almacén de sesiones; el cuerpo de las respuestas nunca SHALL incluir el token.

#### Scenario: Token no expuesto en el cuerpo

- **WHEN** se inicia sesión y se inspecciona el cuerpo de la respuesta
- **THEN** el cuerpo no contiene el token de sesión

#### Scenario: Tokens distintos por login

- **WHEN** dos inicios de sesión consecutivos son exitosos
- **THEN** cada uno recibe un token de sesión diferente

### Requirement: Hash de contraseñas

El sistema SHALL almacenar las contraseñas únicamente como un hash derivado con salt aleatorio y SHALL verificar las credenciales con comparación de tiempo constante; nunca SHALL almacenar ni devolver la contraseña en claro.

#### Scenario: Seed sin contraseñas en claro

- **WHEN** se cargan los usuarios demo del seed
- **THEN** ningún `passwordHash` almacenado coincide con `DEMO_PASSWORD`

#### Scenario: Verificación correcta

- **WHEN** se verifica una contraseña contra el hash generado para ella
- **THEN** la verificación resulta verdadera

#### Scenario: Verificación incorrecta

- **WHEN** se verifica una contraseña distinta contra el hash almacenado
- **THEN** la verificación resulta falsa

#### Scenario: Hash corrupto

- **WHEN** se verifica una contraseña contra un valor almacenado con formato inválido
- **THEN** la verificación resulta falsa sin lanzar una excepción

### Requirement: DTO de usuario sin datos sensibles

El sistema SHALL exponer al usuario autenticado solo con `id`, `email`, `nombre`, `apellido` y `rol`; ninguna respuesta SHALL incluir `passwordHash`, `activo` ni el token de sesión en el cuerpo.

#### Scenario: Respuesta de login

- **WHEN** un login es exitoso
- **THEN** el cuerpo contiene exactamente `id`, `email`, `nombre`, `apellido` y `rol`
- **AND** no contiene `passwordHash`

#### Scenario: Respuesta de me

- **WHEN** se consulta `GET /api/auth/me` con una sesión válida
- **THEN** el cuerpo no contiene `passwordHash` ni el token de sesión
