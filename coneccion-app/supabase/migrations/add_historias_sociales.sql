-- ============================================================
-- MIGRACIÓN: Módulo Historias Sociales
-- Ejecutar manualmente en el dashboard de Supabase
-- ============================================================

CREATE TABLE historias_sociales (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nino_id    UUID REFERENCES ninos(id) ON DELETE SET NULL,
  meta_id    UUID REFERENCES metas(id) ON DELETE SET NULL,
  titulo     TEXT NOT NULL,
  paginas    JSONB NOT NULL DEFAULT '[]',
  -- Cada página del array JSONB:
  -- {
  --   "orden": 1,
  --   "texto": "Cuando llegamos al cole...",
  --   "imageUrl": "https://...",
  --   "isCustom": false
  -- }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historias_user  ON historias_sociales(user_id);
CREATE INDEX idx_historias_nino  ON historias_sociales(nino_id);
CREATE INDEX idx_historias_meta  ON historias_sociales(meta_id);

ALTER TABLE historias_sociales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propias historias"
  ON historias_sociales FOR SELECT
  USING (
    user_id = auth.uid()
    OR nino_id IN (
      SELECT id FROM ninos WHERE padre_id = auth.uid()
      UNION
      SELECT nino_id FROM equipo_terapeutico WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios crean sus propias historias"
  ON historias_sociales FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan historias accesibles"
  ON historias_sociales FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (
      nino_id IS NOT NULL AND (
        EXISTS (SELECT 1 FROM ninos WHERE id = historias_sociales.nino_id AND padre_id = auth.uid())
        OR EXISTS (SELECT 1 FROM equipo_terapeutico WHERE nino_id = historias_sociales.nino_id AND usuario_id = auth.uid())
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      nino_id IS NOT NULL AND (
        EXISTS (SELECT 1 FROM ninos WHERE id = historias_sociales.nino_id AND padre_id = auth.uid())
        OR EXISTS (SELECT 1 FROM equipo_terapeutico WHERE nino_id = historias_sociales.nino_id AND usuario_id = auth.uid())
      )
    )
  );

CREATE POLICY "Usuarios eliminan sus propias historias"
  ON historias_sociales FOR DELETE
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_historias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER historias_sociales_updated_at
  BEFORE UPDATE ON historias_sociales
  FOR EACH ROW EXECUTE FUNCTION update_historias_updated_at();
