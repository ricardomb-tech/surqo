-- ============================================================
-- Paso 1: Agregar user_id a farms (faltaba en la tabla real)
-- ============================================================
ALTER TABLE public.farms
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Indexar para mejorar performance de las políticas
CREATE INDEX IF NOT EXISTS ix_farms_user_id ON public.farms(user_id);

-- ============================================================
-- Paso 2: Habilitar RLS y crear políticas
-- ============================================================

-- user_profiles ───────────────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles: own row only" ON public.user_profiles;
CREATE POLICY "user_profiles: own row only"
  ON public.user_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- farms ───────────────────────────────────────────────────────
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "farms: own farms only" ON public.farms;
CREATE POLICY "farms: own farms only"
  ON public.farms
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- analyses ────────────────────────────────────────────────────
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analyses: via own farms" ON public.analyses;
CREATE POLICY "analyses: via own farms"
  ON public.analyses
  FOR ALL
  USING (
    farm_id IS NULL
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  )
  WITH CHECK (
    farm_id IS NULL
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  );

-- sensor_readings ─────────────────────────────────────────────
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sensor_readings: via own farms" ON public.sensor_readings;
CREATE POLICY "sensor_readings: via own farms"
  ON public.sensor_readings
  FOR ALL
  USING (
    farm_id IS NULL
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  )
  WITH CHECK (
    farm_id IS NULL
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  );

-- alerts ──────────────────────────────────────────────────────
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alerts: via own farms" ON public.alerts;
CREATE POLICY "alerts: via own farms"
  ON public.alerts
  FOR ALL
  USING (
    farm_id IS NULL
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  )
  WITH CHECK (
    farm_id IS NULL
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  );

-- ============================================================
-- Verificación final
-- ============================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles','farms','analyses','sensor_readings','alerts');
