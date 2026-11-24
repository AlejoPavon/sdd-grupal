CREATE INDEX IF NOT EXISTS idx_turno_profesional_rango ON turno(profesional_id, inicio, fin);
CREATE INDEX IF NOT EXISTS idx_turno_sillon_rango ON turno(sillon_id, inicio, fin);
CREATE INDEX IF NOT EXISTS idx_turno_paciente ON turno(paciente_id, inicio);
CREATE INDEX IF NOT EXISTS idx_turno_estado ON turno(estado);

CREATE UNIQUE INDEX IF NOT EXISTS idx_paciente_email_activo
  ON paciente(email) WHERE activo = 1 AND email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_paciente_documento_activo
  ON paciente(documento) WHERE activo = 1 AND documento IS NOT NULL;
