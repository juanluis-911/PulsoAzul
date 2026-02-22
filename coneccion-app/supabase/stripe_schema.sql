-- ============================================
-- STRIPE SUBSCRIPTIONS SCHEMA
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

CREATE TABLE subscriptions (
  -- Clave primaria vinculada a auth.users (igual que perfiles)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- IDs de Stripe
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,

  -- Estado actual de la suscripción
  -- 'active'    → acceso completo
  -- 'trialing'  → período de prueba
  -- 'past_due'  → pago fallido, aún con gracia
  -- 'canceled'  → sin acceso
  -- 'incomplete' → checkout iniciado pero no completado
  status TEXT NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),

  -- Plan contratado (ej: 'pro_monthly', 'pro_annual')
  plan TEXT,

  -- Fin del período actual (unix timestamp → timestamptz)
  current_period_end TIMESTAMP WITH TIME ZONE,

  -- true cuando el usuario canceló pero sigue activo hasta current_period_end
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadatos de auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscar por stripe_customer_id (lo usamos en webhooks)
CREATE INDEX idx_subscriptions_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_subscription ON subscriptions(stripe_subscription_id);

-- Trigger para updated_at automático (reutiliza la función ya existente en tu schema)
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- El usuario solo puede leer su propia suscripción
CREATE POLICY "Usuario puede leer su suscripción"
  ON subscriptions FOR SELECT
  USING (id = auth.uid());

-- Nadie puede insertar/actualizar desde el cliente:
-- los writes vienen SOLO del webhook (service_role key)
-- No creamos policy de INSERT/UPDATE → solo service_role puede escribir