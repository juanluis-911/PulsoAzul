-- ============================================================
-- MIGRACIÓN: Agregar columna JSONB "metricas" a registros_diarios
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE registros_diarios
  ADD COLUMN IF NOT EXISTS metricas JSONB DEFAULT '{}';

-- Índice GIN para consultas eficientes sobre el JSONB
CREATE INDEX IF NOT EXISTS idx_registros_metricas
  ON registros_diarios USING GIN (metricas);

-- ============================================================
-- COMENTARIO con estructura del JSONB esperado (documentación)
-- ============================================================
COMMENT ON COLUMN registros_diarios.metricas IS '
Estructura del JSONB de métricas clínicas:
{
  "regulacion": {
    "inicio": 1-5,   -- Escala de regulación emocional al inicio
    "fin":    1-5    -- Escala de regulación emocional al final
  },
  "contexto": {
    "durmio_bien":       bool,
    "comio_bien":        bool,
    "tomo_medicamento":  bool,
    "cambio_rutina":     bool,
    "evento_estresante": bool,
    "buen_descanso_fin": bool
  },
  "actividades": [
    { "tipo": "lectura", "participacion": 1-3 },
    ...
  ],
  "nivel_apoyo_general": 0-4,  -- 0=Independiente, 4=Apoyo físico total
  "conducta": {
    "frecuencia_disruptiva": 0-3,  -- 0=Nunca, 3=Frecuente
    "duracion_minutos":      int
  },
  "comunicacion": {
    "iniciativa": 1-5,
    "claridad":   1-5
  },
  "social": {
    "interaccion": 1-5,
    "turnos":      1-5
  },
  "autonomia": {
    "higiene":       0-4,
    "alimentacion":  0-4
  },
  "academico": {
    "atencion":      1-5,
    "persistencia":  1-5
  },
  "motora": {
    "fina":   1-5,
    "gruesa": 1-5
  }
}
';

-- ============================================================
-- VISTA ANALÍTICA: Promedios por niño para reportes
-- Úsala en tus páginas de reporte/progreso
-- ============================================================
CREATE OR REPLACE VIEW vista_metricas_promedio AS
SELECT
  r.nino_id,
  n.nombre || ' ' || n.apellido          AS nino,
  COUNT(r.id)                            AS total_registros,
  ROUND(AVG((r.metricas->'regulacion'->>'inicio')::numeric), 2)               AS avg_regulacion_inicio,
  ROUND(AVG((r.metricas->'regulacion'->>'fin')::numeric), 2)                  AS avg_regulacion_fin,
  ROUND(AVG((r.metricas->>'nivel_apoyo_general')::numeric), 2)                AS avg_nivel_apoyo,
  ROUND(AVG((r.metricas->'comunicacion'->>'iniciativa')::numeric), 2)         AS avg_comunicacion_iniciativa,
  ROUND(AVG((r.metricas->'comunicacion'->>'claridad')::numeric), 2)           AS avg_comunicacion_claridad,
  ROUND(AVG((r.metricas->'social'->>'interaccion')::numeric), 2)              AS avg_social_interaccion,
  ROUND(AVG((r.metricas->'social'->>'turnos')::numeric), 2)                   AS avg_social_turnos,
  ROUND(AVG((r.metricas->'academico'->>'atencion')::numeric), 2)              AS avg_academico_atencion,
  ROUND(AVG((r.metricas->'academico'->>'persistencia')::numeric), 2)         AS avg_academico_persistencia,
  ROUND(AVG((r.metricas->'motora'->>'fina')::numeric), 2)                     AS avg_motora_fina,
  ROUND(AVG((r.metricas->'motora'->>'gruesa')::numeric), 2)                   AS avg_motora_gruesa,
  ROUND(AVG((r.metricas->'conducta'->>'frecuencia_disruptiva')::numeric), 2)  AS avg_conducta_frecuencia
FROM registros_diarios r
JOIN ninos n ON n.id = r.nino_id
WHERE r.metricas != '{}'
GROUP BY r.nino_id, n.nombre, n.apellido;