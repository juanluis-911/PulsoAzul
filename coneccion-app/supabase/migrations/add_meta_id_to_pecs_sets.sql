-- ============================================================
-- MIGRACIÓN: Vincular sets PECS con metas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE pecs_sets
  ADD COLUMN IF NOT EXISTS meta_id UUID REFERENCES metas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pecs_sets_meta_id ON pecs_sets(meta_id);
