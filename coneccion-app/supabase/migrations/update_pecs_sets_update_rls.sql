-- ============================================================
-- MIGRACIÓN: Permitir al equipo vincular sets PECS a metas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Ampliar la política UPDATE para que miembros del equipo puedan
-- actualizar SOLO el campo meta_id (vinculación a meta) en sets
-- asociados a niños de los que tienen acceso.

DROP POLICY IF EXISTS "Usuarios actualizan sus propios sets PECS" ON pecs_sets;

CREATE POLICY "Usuarios actualizan sets PECS accesibles"
  ON pecs_sets FOR UPDATE
  USING (
    -- El creador puede actualizar cualquier campo
    user_id = auth.uid()
    OR (
      -- Equipo/familia puede actualizar meta_id en sets de sus niños
      nino_id IS NOT NULL AND (
        EXISTS (
          SELECT 1 FROM ninos
          WHERE id = pecs_sets.nino_id AND padre_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM equipo_terapeutico
          WHERE nino_id = pecs_sets.nino_id AND usuario_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    -- Solo el creador puede cambiar datos del set; el resto solo puede cambiar meta_id
    user_id = auth.uid()
    OR (
      nino_id IS NOT NULL AND (
        EXISTS (SELECT 1 FROM ninos WHERE id = pecs_sets.nino_id AND padre_id = auth.uid())
        OR EXISTS (SELECT 1 FROM equipo_terapeutico WHERE nino_id = pecs_sets.nino_id AND usuario_id = auth.uid())
      )
    )
  );
