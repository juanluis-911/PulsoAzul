-- ── Tabla de invitaciones ─────────────────────────────────────────────────────
-- Registra todas las invitaciones enviadas: al equipo terapéutico o referidos.
-- El token UUID actúa como enlace seguro de aceptación.

CREATE TABLE IF NOT EXISTS invitaciones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token         UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'equipo',  -- 'equipo' | 'referido'

  invitado_por  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_invitado TEXT NOT NULL,

  nino_id       UUID REFERENCES ninos(id) ON DELETE CASCADE,
  nombre_nino   TEXT,   -- snapshot del nombre al momento de invitar

  rol           TEXT,   -- 'terapeuta' | 'maestra_sombra'
  permisos      TEXT DEFAULT 'edicion',  -- 'lectura' | 'edicion'

  status        TEXT NOT NULL DEFAULT 'pendiente',
  -- 'pendiente' | 'aceptada' | 'cancelada' | 'expirada'

  expires_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  aceptada_at   TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS invitaciones_invitado_por_idx ON invitaciones(invitado_por);
CREATE INDEX IF NOT EXISTS invitaciones_token_idx ON invitaciones(token);
CREATE INDEX IF NOT EXISTS invitaciones_email_idx ON invitaciones(email_invitado);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;

-- El que invitó puede ver todas sus invitaciones enviadas
CREATE POLICY "invitador_ve_sus_invitaciones" ON invitaciones
  FOR SELECT USING (auth.uid() = invitado_por);

-- El invitado puede ver su propia invitación (identificado por su email)
CREATE POLICY "invitado_ve_su_invitacion" ON invitaciones
  FOR SELECT USING (
    email_invitado = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Solo service role puede insertar / actualizar / eliminar
-- (las API routes usan supabaseAdmin con SUPABASE_SERVICE_ROLE_KEY)
