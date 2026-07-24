-- ============================================================
-- 005: Security hardening (auditoría 2026-07-17)
--
-- Ejecutar en Supabase SQL Editor DESPUÉS de 001-004 y enable_rls.sql.
-- No afecta al backend FastAPI: su conexión (DATABASE_URL, rol postgres
-- vía pooler) no pasa por PostgREST y no tiene contexto de auth.role(),
-- por lo que el trigger y las políticas de abajo lo dejan pasar igual
-- que antes. Lo que cierran es el acceso DIRECTO a la API REST de
-- Supabase (supabase-js con la anon key + JWT de un usuario logueado),
-- que hasta ahora podía saltarse toda la autorización del backend.
-- ============================================================

-- ------------------------------------------------------------
-- Paso 1: Bloquear auto-escalación de privilegios en user_profiles
-- ------------------------------------------------------------
-- La política RLS existente ("user_profiles: own row only") protege la
-- FILA (user_id = auth.uid()) pero no las COLUMNAS. Cualquier usuario
-- autenticado podía hacer PATCH directo a
--   .../rest/v1/user_profiles?user_id=eq.<su-propio-id>
-- con body {"is_admin": true, "plan": "paid", "analyses_used": 0} y
-- otorgarse admin / plan pago / reset de cuota sin pasar por
-- routers/users.py (que sí valida is_admin antes de dejar cambiar plan).
--
-- auth.role() devuelve NULL cuando no hay contexto de request JWT (ej.
-- la conexión directa del backend), y 'service_role' cuando se usa la
-- service role key. Ambos casos quedan exentos; solo 'authenticated'/
-- 'anon' (es decir, tráfico directo a PostgREST con la anon key) queda
-- bloqueado para estas columnas.
CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IS NULL OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.is_admin := OLD.is_admin;
  NEW.plan := OLD.plan;
  NEW.plan_activated_at := OLD.plan_activated_at;
  NEW.analyses_used := OLD.analyses_used;
  NEW.tokens_used := OLD.tokens_used;
  NEW.email_alerts_this_month := OLD.email_alerts_this_month;
  NEW.alerts_reset_at := OLD.alerts_reset_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_privilege_escalation ON public.user_profiles;
CREATE TRIGGER trg_prevent_self_privilege_escalation
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_privilege_escalation();

-- ------------------------------------------------------------
-- Paso 2: Cerrar el acceso a filas huérfanas (farm_id IS NULL) en
-- analyses, sensor_readings y alerts.
-- ------------------------------------------------------------
-- Las políticas originales incluían "farm_id IS NULL OR farm_id IN
-- (...)", así que cualquier usuario autenticado podía leer/escribir
-- CUALQUIER fila sin dueño de OTRO usuario vía PostgREST directo. Ahora
-- solo el backend (sin contexto de auth, o con service_role) puede
-- tocar filas huérfanas; el resto se sigue filtrando por finca propia.

DROP POLICY IF EXISTS "analyses: via own farms" ON public.analyses;
CREATE POLICY "analyses: via own farms"
  ON public.analyses
  FOR ALL
  USING (
    auth.role() IS NULL OR auth.role() = 'service_role'
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  )
  WITH CHECK (
    auth.role() IS NULL OR auth.role() = 'service_role'
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "sensor_readings: via own farms" ON public.sensor_readings;
CREATE POLICY "sensor_readings: via own farms"
  ON public.sensor_readings
  FOR ALL
  USING (
    auth.role() IS NULL OR auth.role() = 'service_role'
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  )
  WITH CHECK (
    auth.role() IS NULL OR auth.role() = 'service_role'
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "alerts: via own farms" ON public.alerts;
CREATE POLICY "alerts: via own farms"
  ON public.alerts
  FOR ALL
  USING (
    auth.role() IS NULL OR auth.role() = 'service_role'
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  )
  WITH CHECK (
    auth.role() IS NULL OR auth.role() = 'service_role'
    OR farm_id IN (SELECT id FROM public.farms WHERE user_id = auth.uid())
  );

-- ============================================================
-- Verificación final
-- ============================================================
SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname = 'trg_prevent_self_privilege_escalation';
SELECT tablename, policyname, qual FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('alerts', 'analyses', 'sensor_readings');
