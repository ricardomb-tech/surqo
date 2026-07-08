-- Migración 003: dispositivos (nodos ESP32) con emparejamiento por código
-- Elimina la necesidad de hardcodear FARM_ID en el firmware.
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS devices (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_mac       varchar(32)  NOT NULL UNIQUE,
    claim_code       varchar(12)  NOT NULL,
    name             varchar(200),
    farm_id          uuid REFERENCES farms(id) ON DELETE SET NULL,
    user_id          uuid REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    firmware_version varchar(20),
    last_seen        timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_devices_claim_code ON devices(claim_code);
CREATE INDEX IF NOT EXISTS ix_devices_farm       ON devices(farm_id);
CREATE INDEX IF NOT EXISTS ix_devices_user       ON devices(user_id);

COMMENT ON TABLE  devices             IS 'Nodos ESP32 físicos; se auto-registran por MAC y se emparejan a una finca por claim_code';
COMMENT ON COLUMN devices.device_mac  IS 'MAC normalizada (12 hex, minúsculas, sin separadores) — identidad única del hardware';
COMMENT ON COLUMN devices.claim_code  IS 'Código corto (últimos 6 hex de la MAC) que el usuario escribe para emparejar';
COMMENT ON COLUMN devices.farm_id     IS 'Finca vinculada; null = sin emparejar';

-- RLS: el dueño solo ve sus dispositivos. La ingesta (MQTT/HTTP) usa la service key
-- del backend, que hace bypass de RLS.
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS devices_owner_select ON devices;
CREATE POLICY devices_owner_select ON devices
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS devices_owner_modify ON devices;
CREATE POLICY devices_owner_modify ON devices
    FOR UPDATE USING (user_id = auth.uid());
