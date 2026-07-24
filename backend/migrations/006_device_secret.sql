-- ============================================================
-- 006: Secreto por dispositivo (TOFU) — cierra la ingesta pública sin
-- autenticación encontrada en la auditoría de 2026-07-17.
--
-- Antes: /api/v1/devices/{mac}/reading (HTTP fallback) y el consumer MQTT
-- aceptaban lecturas de cualquiera que conociera/adivinara la MAC de un
-- dispositivo ya emparejado.
--
-- Ahora: al emparejar un nodo (POST /claim, autenticado), se abre una
-- ventana de 5 minutos. El PRIMER /register que llegue en esa ventana para
-- ese dispositivo (el nodo real, recién encendido por el dueño) recibe un
-- secreto de una sola vez y lo persiste en su NVS. Desde ahí, toda lectura
-- de ese dispositivo debe incluir el secreto o se descarta.
--
-- Ejecutar en Supabase SQL Editor DESPUÉS de 003_devices.sql.
-- ============================================================

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS device_secret varchar(64),
  ADD COLUMN IF NOT EXISTS pending_secret_until timestamptz;

COMMENT ON COLUMN public.devices.device_secret IS
  'Secreto de 128 bits emitido una sola vez (TOFU) tras el claim; el nodo lo persiste en NVS y lo envía en cada lectura';
COMMENT ON COLUMN public.devices.pending_secret_until IS
  'Ventana de 5 min tras el claim en la que el próximo /register recibe el device_secret; NULL fuera de esa ventana o tras emitirlo';
