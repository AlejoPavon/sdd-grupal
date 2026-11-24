CREATE TABLE IF NOT EXISTS sucursal (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('administrador','recepcionista','profesional')),
  profesional_id TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (profesional_id) REFERENCES profesional(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS profesional (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  matricula TEXT NOT NULL,
  especialidades TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sillon (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  sucursal_id TEXT,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS prestacion (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  precio REAL,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS paciente (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  documento TEXT,
  telefono TEXT,
  email TEXT,
  fecha_nacimiento TEXT,
  notas TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS turno (
  id TEXT PRIMARY KEY,
  paciente_id TEXT NOT NULL,
  profesional_id TEXT NOT NULL,
  sillon_id TEXT NOT NULL,
  prestacion_id TEXT NOT NULL,
  inicio INTEGER NOT NULL,
  fin INTEGER NOT NULL,
  estado TEXT NOT NULL,
  es_sobreturno INTEGER NOT NULL DEFAULT 0,
  notas TEXT,
  autorizado_por TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  cancelled_at INTEGER,
  FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE RESTRICT,
  FOREIGN KEY (profesional_id) REFERENCES profesional(id) ON DELETE RESTRICT,
  FOREIGN KEY (sillon_id) REFERENCES sillon(id) ON DELETE RESTRICT,
  FOREIGN KEY (prestacion_id) REFERENCES prestacion(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS bloqueo (
  id TEXT PRIMARY KEY,
  profesional_id TEXT,
  sillon_id TEXT,
  inicio INTEGER NOT NULL,
  fin INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  creado_por TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  CHECK (profesional_id IS NOT NULL OR sillon_id IS NOT NULL),
  FOREIGN KEY (profesional_id) REFERENCES profesional(id) ON DELETE RESTRICT,
  FOREIGN KEY (sillon_id) REFERENCES sillon(id) ON DELETE RESTRICT
);
