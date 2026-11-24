# Tasks

- [ ] 1.1 .gitignore: agregar `data/`, `*.db`, `*.db-wal` y `*.db-shm`
- [ ] 1.2 .env.example: PERSISTENCE y DATABASE_URL
- [ ] 2.1 Instalar better-sqlite3 y @types/better-sqlite3 (después de avisar a Nathaniel; si falla, frenar)
- [ ] 2.2 Implementar connection.ts (foreign_keys ON, WAL)
- [ ] 2.3 Implementar migrations.ts y migrations/001_init.sql y 002_indexes.sql (idempotentes,incluye la tabla sucursal y los índices de agenda)
- [ ] 3.1 Repositorios de apoyo: sillón, profesional, prestación, usuario y bloqueo
- [ ] 3.2 Repositorio de pacientes (índices únicos parciales, filtro q en TypeScript)
- [ ] 3.3 Repositorio de turnos (crear con BEGIN IMMEDIATE, listar, buscarSolapado*, actualizar)
- [ ] 3.4 main.ts: elegir adaptador según PERSISTENCE; seed solo con base vacía
- [ ] 4.1 Tests por escenario de los specs (directorio temporal, cerrar conexión antes de borrar)
- [ ] 4.2 Verificar que cada escenario de los specs tiene al menos un test
- [ ] 4.3 npm run typecheck y npm test con PERSISTENCE=memory
- [ ] 5.1 Marcar C-10 en CHANGES.md