-- ============================================================
-- MIGRACIÓN: Módulo PECS — conjuntos de pictogramas
-- Ejecutar manualmente en el dashboard de Supabase
-- ============================================================

CREATE TABLE pecs_sets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nino_id         UUID REFERENCES ninos(id) ON DELETE SET NULL,
  nombre          TEXT NOT NULL,
  pictogram_ids   JSONB NOT NULL DEFAULT '[]',
  -- Cada elemento del array JSONB tiene la forma:
  -- {
  --   "id": "12345",
  --   "label": "Manzana",
  --   "category": "alimentacion",
  --   "imageUrl": "https://static.arasaac.org/...",
  --   "isCustom": false
  -- }
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pecs_sets_user ON pecs_sets(user_id);
CREATE INDEX idx_pecs_sets_nino ON pecs_sets(nino_id);

ALTER TABLE pecs_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propios sets PECS"
  ON pecs_sets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios crean sus propios sets PECS"
  ON pecs_sets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan sus propios sets PECS"
  ON pecs_sets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan sus propios sets PECS"
  ON pecs_sets FOR DELETE
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_pecs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pecs_sets_updated_at
  BEFORE UPDATE ON pecs_sets
  FOR EACH ROW EXECUTE FUNCTION update_pecs_updated_at();
