-- ============================================================
-- MIGRACIÓN: Compartir sets PECS entre equipo y familia
-- Ejecutar manualmente en el dashboard de Supabase
-- ============================================================

-- Reemplazar la política de SELECT para que padres y equipo
-- puedan ver los sets asociados a sus niños

DROP POLICY IF EXISTS "Usuarios ven sus propios sets PECS" ON pecs_sets;
DROP POLICY IF EXISTS "Usuarios ven sets PECS de sus niños" ON pecs_sets;

CREATE POLICY "Usuarios ven sets PECS de sus niños"
  ON pecs_sets FOR SELECT
  USING (
    -- El creador siempre puede ver sus propios sets
    user_id = auth.uid()
    OR (
      -- Sets asociados a un niño al que el usuario tiene acceso
      nino_id IS NOT NULL AND (
        -- Es el padre/madre del niño
        EXISTS (
          SELECT 1 FROM ninos
          WHERE id = pecs_sets.nino_id
            AND padre_id = auth.uid()
        )
        OR
        -- Es parte del equipo terapéutico del niño
        EXISTS (
          SELECT 1 FROM equipo_terapeutico
          WHERE nino_id = pecs_sets.nino_id
            AND usuario_id = auth.uid()
        )
      )
    )
  );
