const up = `
-- Add item detail columns to assembly_journeys
ALTER TABLE assembly_journeys ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE assembly_journeys ADD COLUMN IF NOT EXISTS item_color TEXT;
ALTER TABLE assembly_journeys ADD COLUMN IF NOT EXISTS item_size TEXT;

-- Backfill from items table using model_sku = items.sku
UPDATE assembly_journeys aj
SET
  item_name = i.item_name,
  item_color = i.color,
  item_size = i.size
FROM items i
WHERE aj.model_sku = i.sku
  AND aj.item_name IS NULL;

-- Drop and recreate get_technician_queue with new return type
DROP FUNCTION IF EXISTS get_technician_queue(UUID);
CREATE OR REPLACE FUNCTION get_technician_queue(p_technician_id UUID)
RETURNS TABLE(
  barcode TEXT, model_sku TEXT, current_status TEXT, priority BOOLEAN,
  checklist JSONB, assigned_at TIMESTAMPTZ, started_at TIMESTAMPTZ,
  qc_status TEXT, qc_failure_reason TEXT, rework_count INTEGER, bin_location JSONB,
  item_name TEXT, item_color TEXT, item_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT aj.barcode, aj.model_sku, aj.current_status, aj.priority, aj.checklist,
    aj.assigned_at, aj.started_at, aj.qc_status, aj.qc_failure_reason, aj.rework_count,
    CASE WHEN b.id IS NOT NULL THEN
      jsonb_build_object('id', b.id, 'bin_code', b.bin_code, 'bin_name', b.bin_name, 'zone', b.zone)
    ELSE NULL END as bin_location,
    aj.item_name, aj.item_color, aj.item_size
  FROM assembly_journeys aj
  LEFT JOIN assembly_bins b ON aj.bin_location_id = b.id
  WHERE aj.technician_id = p_technician_id
    AND aj.current_status IN ('assigned', 'in_progress')
  ORDER BY aj.priority DESC, aj.assigned_at ASC;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
`;

const down = `
ALTER TABLE assembly_journeys DROP COLUMN IF EXISTS item_name;
ALTER TABLE assembly_journeys DROP COLUMN IF EXISTS item_color;
ALTER TABLE assembly_journeys DROP COLUMN IF EXISTS item_size;

-- Restore original RPC without item details
CREATE OR REPLACE FUNCTION get_technician_queue(p_technician_id UUID)
RETURNS TABLE(
  barcode TEXT, model_sku TEXT, current_status TEXT, priority BOOLEAN,
  checklist JSONB, assigned_at TIMESTAMPTZ, started_at TIMESTAMPTZ,
  qc_status TEXT, qc_failure_reason TEXT, rework_count INTEGER, bin_location JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT aj.barcode, aj.model_sku, aj.current_status, aj.priority, aj.checklist,
    aj.assigned_at, aj.started_at, aj.qc_status, aj.qc_failure_reason, aj.rework_count,
    CASE WHEN b.id IS NOT NULL THEN
      jsonb_build_object('id', b.id, 'bin_code', b.bin_code, 'bin_name', b.bin_name, 'zone', b.zone)
    ELSE NULL END as bin_location
  FROM assembly_journeys aj
  LEFT JOIN assembly_bins b ON aj.bin_location_id = b.id
  WHERE aj.technician_id = p_technician_id
    AND aj.current_status IN ('assigned', 'in_progress')
  ORDER BY aj.priority DESC, aj.assigned_at ASC;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
