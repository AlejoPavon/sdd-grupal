# Tasks

- [x] 1.1 .gitignore: agregar `data/`, `*.db`, `*.db-wal` y `*.db-shm`
- [x] 1.2 .env.example: PERSISTENCE y DATABASE_URL
- [x] 2.1 Instalar better-sqlite3 y @types/better-sqlite3 (después de avisar a Nathaniel; si falla, frenar)
- [x] 2.2 Implementar connection.ts (foreign_keys ON, WAL)
- [x] 2.3 Implementar migrations.ts y migrations/001_init.sql y 002_indexes.sql (idempotentes,incluye la tabla sucursal y los índices de agenda)
- [x ] 3.1 Repositorios de apoyo: sillón, profesional, prestación, usuario y bloqueo
- [x] 3.2 Repositorio de pacientes (índices únicos parciales, filtro q en TypeScript)
- [x] 3.3 Repositorio de turnos (crear con BEGIN IMMEDIATE, listar, buscarSolapado*, actualizar)
- [x] 3.4 main.ts: elegir adaptador según PERSISTENCE; seed solo con base vacía
- [x] 4.1 Tests por escenario de los specs (directorio temporal, cerrar conexión antes de borrar)
- [x] 4.2 Verificar que cada escenario de los specs tiene al menos un test
- [x] 4.3 npm run typecheck y npm test con PERSISTENCE=memory
- [x] 5.1 Marcar C-10 en CHANGES.md