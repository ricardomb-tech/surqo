-- ═══════════════════════════════════════════════════════════════════
-- SURQO — Schema inicial
-- "Del surco al insight"
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────────────
-- FINCAS
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    owner_name      VARCHAR(200),
    owner_email     VARCHAR(200),
    latitude        NUMERIC(10, 8) NOT NULL,
    longitude       NUMERIC(11, 8) NOT NULL,
    crop_type       VARCHAR(100) NOT NULL,
    area_hectares   NUMERIC(10, 2),
    altitude_masl   INTEGER,
    department      VARCHAR(100) DEFAULT 'Córdoba',
    municipality    VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);

-- ───────────────────────────────────────────────────────────────────
-- LECTURAS DE SENSORES
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sensor_readings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id           VARCHAR(100) NOT NULL,
    farm_id             UUID REFERENCES farms(id) ON DELETE SET NULL,
    soil_moisture_pct   NUMERIC(5, 2),
    soil_temp_c         NUMERIC(5, 2),
    air_temp_c          NUMERIC(5, 2),
    air_humidity_pct    NUMERIC(5, 2),
    uv_index            NUMERIC(4, 1),
    battery_mv          INTEGER,
    rssi_dbm            SMALLINT,
    vpd_kpa             NUMERIC(5, 3),
    raw_payload         JSONB,
    source              VARCHAR(20) DEFAULT 'mqtt',
    firmware_version    VARCHAR(20),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_sensor_device_time
    ON sensor_readings (device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_sensor_farm_time
    ON sensor_readings (farm_id, created_at DESC)
    WHERE farm_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────
-- ANÁLISIS LLM
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id             UUID REFERENCES farms(id) ON DELETE SET NULL,
    farm_name           VARCHAR(200) NOT NULL,
    crop_type           VARCHAR(100) NOT NULL,
    alert_level         VARCHAR(20) NOT NULL,
    water_stress_index  NUMERIC(4, 2),
    avg_temperature_c   NUMERIC(5, 2),
    total_rain_7d_mm    NUMERIC(8, 2),
    avg_vpd_kpa         NUMERIC(5, 3),
    et0_7d_mm           NUMERIC(8, 2),
    irrigation_needed   BOOLEAN DEFAULT FALSE,
    next_irrigation_date VARCHAR(50),
    recommendations     JSONB,
    main_alert          VARCHAR(500),
    summary_for_farmer  TEXT,
    prompt_version      VARCHAR(20) DEFAULT '1.0.0',
    model_used          VARCHAR(50) NOT NULL,
    input_tokens        INTEGER,
    output_tokens       INTEGER,
    cost_usd            NUMERIC(10, 6),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_analyses_farm
    ON analyses (farm_id, created_at DESC)
    WHERE farm_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────
-- ALERTAS
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id             UUID REFERENCES farms(id) ON DELETE SET NULL,
    device_id           VARCHAR(100),
    alert_type          VARCHAR(50) NOT NULL,
    severity            VARCHAR(20) NOT NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    recommended_action  VARCHAR(500),
    response_time       VARCHAR(20),
    is_resolved         BOOLEAN DEFAULT FALSE,
    resolved_at         TIMESTAMPTZ,
    email_sent          BOOLEAN DEFAULT FALSE,
    email_sent_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_alerts_farm_active
    ON alerts (farm_id, is_resolved, created_at DESC)
    WHERE farm_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────
-- TRIGGER: updated_at en farms
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_farms_updated_at ON farms;
CREATE TRIGGER trg_farms_updated_at
    BEFORE UPDATE ON farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- VISTAS
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW latest_sensor_by_device AS
SELECT DISTINCT ON (device_id)
    id,
    device_id,
    farm_id,
    soil_moisture_pct,
    soil_temp_c,
    air_temp_c,
    air_humidity_pct,
    uv_index,
    battery_mv,
    rssi_dbm,
    vpd_kpa,
    source,
    firmware_version,
    created_at
FROM sensor_readings
ORDER BY device_id, created_at DESC;

CREATE OR REPLACE VIEW farm_daily_kpis AS
SELECT
    farm_id,
    DATE(created_at AT TIME ZONE 'America/Bogota') AS day,
    AVG(soil_moisture_pct)  AS avg_soil_moisture,
    AVG(soil_temp_c)        AS avg_soil_temp,
    AVG(air_temp_c)         AS avg_air_temp,
    AVG(air_humidity_pct)   AS avg_humidity,
    AVG(vpd_kpa)            AS avg_vpd,
    AVG(uv_index)           AS avg_uv,
    COUNT(*)                AS reading_count
FROM sensor_readings
WHERE farm_id IS NOT NULL
GROUP BY farm_id, DATE(created_at AT TIME ZONE 'America/Bogota');

-- ───────────────────────────────────────────────────────────────────
-- FUNCIÓN: calculate_vpd (para uso directo en SQL)
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_vpd(temp NUMERIC, humidity NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    es NUMERIC;
    ea NUMERIC;
BEGIN
    es := 0.6108 * EXP(17.27 * temp / (temp + 237.3));
    ea := es * humidity / 100.0;
    RETURN GREATEST(0.0, ROUND(es - ea, 3));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
