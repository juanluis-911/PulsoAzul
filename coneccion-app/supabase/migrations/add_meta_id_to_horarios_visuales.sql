-- ============================================================
-- MIGRACIÓN: Vincular Horarios Visuales con metas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE horarios_visuales
  ADD COLUMN IF NOT EXISTS meta_id UUID REFERENCES metas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_horarios_meta_id ON horarios_visuales(meta_id);

-- Ampliar política UPDATE para que el equipo pueda vincular/desvincular meta_id
DROP POLICY IF EXISTS "Usuarios actualizan sus propios horarios" ON horarios_visuales;

CREATE POLICY "Usuarios actualizan horarios accesibles"
  ON horarios_visuales FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (
      nino_id IS NOT NULL AND (
        EXISTS (
          SELECT 1 FROM ninos
          WHERE id = horarios_visuales.nino_id AND padre_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM equipo_terapeutico
          WHERE nino_id = horarios_visuales.nino_id AND usuario_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      nino_id IS NOT NULL AND (
        EXISTS (SELECT 1 FROM ninos WHERE id = horarios_visuales.nino_id AND padre_id = auth.uid())
        OR EXISTS (SELECT 1 FROM equipo_terapeutico WHERE nino_id = horarios_visuales.nino_id AND usuario_id = auth.uid())
      )
    )
  );
