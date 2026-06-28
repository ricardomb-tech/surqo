-- Migración 002: cuota de análisis IA por usuario (freemium)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS analyses_used INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tokens_used   INTEGER NOT NULL DEFAULT 0;

-- Índice para queries de cuota (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_user_profiles_analyses_used
    ON user_profiles(analyses_used);

COMMENT ON COLUMN user_profiles.analyses_used IS 'Análisis IA consumidos (lifetime para free, se resetea al upgradar)';
COMMENT ON COLUMN user_profiles.tokens_used   IS 'Output tokens acumulados de análisis IA';
