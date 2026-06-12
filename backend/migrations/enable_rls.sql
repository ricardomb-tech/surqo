-- ============================================================
-- Habilitar Row Level Security en todas las tablas públicas
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── user_profiles ────────────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- El usuario solo puede ver/editar su propio perfil
CREATE POLICY "user_profiles: own row only"
  ON public.user_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── farms ────────────────────────────────────────────────────
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "farms: own farms only"
  ON public.farms
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── analyses ─────────────────────────────────────────────────
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- El usuario puede ver análisis de sus propias fincas
CREATE POLICY "analyses: via own farms"
  ON public.analyses
  FOR ALL
  USING (
    farm_id IN (
      SELECT id FROM public.farms WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    farm_id IN (
      SELECT id FROM public.farms WHERE user_id = auth.uid()
    )
  );

-- ── sensor_readings ──────────────────────────────────────────
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sensor_readings: via own farms"
  ON public.sensor_readings
  FOR ALL
  USING (
    farm_id IN (
      SELECT id FROM public.farms WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    farm_id IN (
      SELECT id FROM public.farms WHERE user_id = auth.uid()
    )
  );

-- ── alerts ───────────────────────────────────────────────────
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts: via own farms"
  ON public.alerts
  FOR ALL
  USING (
    farm_id IN (
      SELECT id FROM public.farms WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    farm_id IN (
      SELECT id FROM public.farms WHERE user_id = auth.uid()
    )
  );

-- ── Nota sobre el backend ─────────────────────────────────────
-- El backend FastAPI conecta via DATABASE_URL (asyncpg) como el
-- rol de superusuario de Supabase (postgres), que bypasea RLS
-- automáticamente. No se requieren cambios en el backend.
-- ──────────────────────────────────────────────────────────────
