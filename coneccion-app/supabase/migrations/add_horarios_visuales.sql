-- ============================================================
-- MIGRACIÓN: Módulo Horarios Visuales
-- Ejecutar manualmente en el dashboard de Supabase
-- ============================================================

CREATE TABLE horarios_visuales (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nino_id       UUID REFERENCES ninos(id) ON DELETE SET NULL,
  nombre        TEXT NOT NULL,
  tipo          TEXT DEFAULT 'dia_completo',
  mostrar_horas BOOLEAN DEFAULT false,
  actividades   JSONB NOT NULL DEFAULT '[]',
  -- Cada elemento del array JSONB tiene la forma:
  -- {
  --   "orden": 1,
  --   "pictogram_id": "12345",
  --   "label": "Desayuno",
  --   "hora": "08:00",
  --   "imageUrl": "https://static.arasaac.org/...",
  --   "category": "alimentacion",
  --   "isCustom": false
  -- }
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_horarios_user ON horarios_visuales(user_id);
CREATE INDEX idx_horarios_nino ON horarios_visuales(nino_id);

ALTER TABLE horarios_visuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propios horarios"
  ON horarios_visuales FOR SELECT
  USING (
    user_id = auth.uid()
    OR nino_id IN (
      SELECT id FROM ninos WHERE padre_id = auth.uid()
      UNION
      SELECT nino_id FROM equipo_terapeutico WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios crean sus propios horarios"
  ON horarios_visuales FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan sus propios horarios"
  ON horarios_visuales FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan sus propios horarios"
  ON horarios_visuales FOR DELETE
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_horarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER horarios_visuales_updated_at
  BEFORE UPDATE ON horarios_visuales
  FOR EACH ROW EXECUTE FUNCTION update_horarios_updated_at();
