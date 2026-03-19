-- ── Tabla de referidos ────────────────────────────────────────────────────────
-- Registra quién invitó a quién a usar Pulso Azul.
-- Cubre dos flujos:
--   tipo='link'  → la persona usó el link personal del referidor para registrarse.
--   tipo='email' → el referidor envió una invitación personalizada por email.

CREATE TABLE IF NOT EXISTS referidos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token            UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  -- Token único para el link de invitación personalizada (tipo='email').
  -- Para el link personal se usa directamente el referidor_id.

  referidor_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo             TEXT NOT NULL DEFAULT 'link', -- 'link' | 'email'

  -- Para tipo='email': email al que se invitó
  email_invitado   TEXT,

  -- Se llena cuando el invitado crea su cuenta
  invitado_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_invitado  TEXT,

  status           TEXT NOT NULL DEFAULT 'pendiente',
  -- 'pendiente' | 'registrado' | 'suscrito' | 'cancelado'

  bono_otorgado    BOOLEAN NOT NULL DEFAULT FALSE,

  registrado_at    TIMESTAMP WITH TIME ZONE,
  suscrito_at      TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS referidos_referidor_idx   ON referidos(referidor_id);
CREATE INDEX IF NOT EXISTS referidos_token_idx       ON referidos(token);
CREATE INDEX IF NOT EXISTS referidos_invitado_uid_idx ON referidos(invitado_user_id);
CREATE INDEX IF NOT EXISTS referidos_email_idx       ON referidos(email_invitado);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE referidos ENABLE ROW LEVEL SECURITY;

-- El referidor puede ver todos sus referidos
CREATE POLICY "referidor_ve_sus_referidos" ON referidos
  FOR SELECT USING (auth.uid() = referidor_id);

-- El invitado puede ver su propio referido (una vez registrado)
CREATE POLICY "invitado_ve_su_referido" ON referidos
  FOR SELECT USING (auth.uid() = invitado_user_id);

-- Solo service role puede insertar / actualizar / eliminar
