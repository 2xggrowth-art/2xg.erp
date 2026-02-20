const up = `
-- Update get_technician_queue to fall back to items table when item details are null
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
    COALESCE(aj.item_name, i.item_name) as item_name,
    COALESCE(aj.item_color, i.color) as item_color,
    COALESCE(aj.item_size, i.size) as item_size
  FROM assembly_journeys aj
  LEFT JOIN assembly_bins b ON aj.bin_location_id = b.id
  LEFT JOIN items i ON aj.model_sku = i.sku
  WHERE aj.technician_id = p_technician_id
    AND aj.current_status IN ('assigned', 'in_progress')
  ORDER BY aj.priority DESC, aj.assigned_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Also backfill any remaining nulls
UPDATE assembly_journeys aj
SET
  item_name = i.item_name,
  item_color = i.color,
  item_size = i.size
FROM items i
WHERE aj.model_sku = i.sku
  AND aj.item_name IS NULL;

NOTIFY pgrst, 'reload schema';
`;

const down = `
-- Revert to version without items join
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

module.exports = { up, down };
