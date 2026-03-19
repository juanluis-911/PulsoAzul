-- ============================================================
-- MIGRACIÓN: Reacciones en registros diarios + Sistema de logros
-- ============================================================

-- ─── 1. REACCIONES EN REGISTROS DIARIOS ─────────────────────

CREATE TABLE registro_reacciones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registro_id UUID REFERENCES registros_diarios(id) ON DELETE CASCADE NOT NULL,
  usuario_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji       TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(registro_id, usuario_id, emoji)
);

CREATE INDEX idx_reg_reacciones_registro ON registro_reacciones(registro_id);
CREATE INDEX idx_reg_reacciones_usuario  ON registro_reacciones(usuario_id);

ALTER TABLE registro_reacciones ENABLE ROW LEVEL SECURITY;

-- Solo miembros del equipo del niño asociado al registro pueden ver/insertar reacciones
CREATE POLICY "Equipo puede ver reacciones de registros"
  ON registro_reacciones FOR SELECT
  USING (
    registro_id IN (
      SELECT rd.id FROM registros_diarios rd
      JOIN equipo_terapeutico et ON et.nino_id = rd.nino_id
      WHERE et.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Equipo puede insertar reacciones"
  ON registro_reacciones FOR INSERT
  WITH CHECK (
    usuario_id = auth.uid()
    AND registro_id IN (
      SELECT rd.id FROM registros_diarios rd
      JOIN equipo_terapeutico et ON et.nino_id = rd.nino_id
      WHERE et.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden eliminar sus propias reacciones"
  ON registro_reacciones FOR DELETE
  USING (usuario_id = auth.uid());


-- ─── 2. LOGROS OBTENIDOS POR USUARIO ────────────────────────

CREATE TABLE logros_usuario (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logro_id    TEXT NOT NULL,
  obtenido_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, logro_id)
);

CREATE INDEX idx_logros_usuario ON logros_usuario(usuario_id);

ALTER TABLE logros_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios logros"
  ON logros_usuario FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "Sistema puede insertar logros"
  ON logros_usuario FOR INSERT
  WITH CHECK (usuario_id = auth.uid());
