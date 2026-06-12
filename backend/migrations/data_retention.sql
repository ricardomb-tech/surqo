-- ============================================================
-- Surqo — Data Retention Policy
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Función que borra lecturas de sensores más antiguas de 90 días
CREATE OR REPLACE FUNCTION delete_old_sensor_readings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM sensor_readings
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- 2. Función que borra análisis más antiguos de 180 días
--    (análisis son más valiosos, los guardamos 6 meses)
CREATE OR REPLACE FUNCTION delete_old_analyses()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM analyses
  WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$;

-- 3. Función que borra alertas resueltas más antiguas de 60 días
CREATE OR REPLACE FUNCTION delete_old_resolved_alerts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM alerts
  WHERE is_resolved = true
    AND resolved_at < NOW() - INTERVAL '60 days';
END;
$$;

-- 4. Habilitar pg_cron (ya viene en Supabase — solo activarlo)
-- Si no está habilitado, ir a: Dashboard → Database → Extensions → pg_cron → Enable
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 5. Job diario a las 3:00 AM UTC — limpieza de lecturas de sensores
SELECT cron.schedule(
  'surqo-delete-old-sensor-readings',
  '0 3 * * *',
  $$ SELECT delete_old_sensor_readings(); $$
);

-- 6. Job semanal los domingos a las 3:30 AM UTC — limpieza de análisis
SELECT cron.schedule(
  'surqo-delete-old-analyses',
  '30 3 * * 0',
  $$ SELECT delete_old_analyses(); $$
);

-- 7. Job semanal los domingos a las 4:00 AM UTC — limpieza de alertas resueltas
SELECT cron.schedule(
  'surqo-delete-old-resolved-alerts',
  '0 4 * * 0',
  $$ SELECT delete_old_resolved_alerts(); $$
);

-- ============================================================
-- VERIFICAR que los jobs quedaron programados:
-- SELECT * FROM cron.job;
-- ============================================================
