-- Tabla de noticias diarias
CREATE TABLE IF NOT EXISTS noticias (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           TEXT NOT NULL,
  resumen          TEXT,
  contenido        TEXT,
  imagen_url       TEXT,
  fuente_url       TEXT,
  fuente_nombre    TEXT,
  fecha_publicacion DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cualquier usuario autenticado puede leer
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "noticias_select" ON noticias
  FOR SELECT TO authenticated USING (true);
