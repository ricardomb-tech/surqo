-- Migración 004: dueño explícito del análisis (analyses.user_id)
-- Cierra un fallo de autorización: un análisis sin finca (o cuya finca se borró,
-- ver farms.delete_farm que hace Analysis.farm_id = NULL) quedaba accesible a
-- cualquier usuario autenticado que conociera su UUID, porque la verificación de
-- dueño estaba condicionada a que existiera farm_id.
--
-- Con esta columna el análisis tiene dueño propio, verificable aunque no haya
-- finca. Las filas legacy quedan con user_id NULL y se resuelven por su finca;
-- si no tienen finca, el backend las deniega (falla cerrado).
--
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS user_id uuid
    REFERENCES user_profiles(user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_analyses_user ON analyses(user_id);

-- Backfill: para análisis legacy que aún tienen finca, hereda el dueño de la finca.
UPDATE analyses a
SET user_id = f.user_id
FROM farms f
WHERE a.farm_id = f.id
  AND a.user_id IS NULL;

COMMENT ON COLUMN analyses.user_id IS 'Dueño del análisis; independiente de farm_id para verificar acceso aunque el análisis no tenga finca';
