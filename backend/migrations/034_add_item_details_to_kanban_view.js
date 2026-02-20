const up = `
-- Must drop and recreate because adding columns changes column order
DROP VIEW IF EXISTS assembly_kanban_board;
CREATE VIEW assembly_kanban_board AS
SELECT
  aj.id, aj.barcode, aj.model_sku, aj.frame_number, aj.current_status, aj.priority,
  aj.parts_missing, aj.damage_reported, aj.assembly_paused, aj.checklist,
  aj.inwarded_at, aj.assigned_at, aj.started_at, aj.completed_at, aj.qc_started_at, aj.qc_completed_at,
  aj.current_location_id, l.name as location_name, l.code as location_code,
  aj.bin_location_id, b.bin_code, b.bin_name, b.status_zone as bin_zone, b.zone as bin_area,
  aj.technician_id, t.name as technician_name,
  aj.supervisor_id, s.name as supervisor_name,
  aj.qc_person_id, q.name as qc_person_name,
  COALESCE(aj.item_name, i.item_name) as item_name,
  COALESCE(aj.item_color, i.color) as item_color,
  COALESCE(aj.item_size, i.size) as item_size,
  CASE aj.current_status
    WHEN 'inwarded' THEN EXTRACT(EPOCH FROM (NOW() - aj.inwarded_at))/3600
    WHEN 'assigned' THEN EXTRACT(EPOCH FROM (NOW() - aj.assigned_at))/3600
    WHEN 'in_progress' THEN EXTRACT(EPOCH FROM (NOW() - aj.started_at))/3600
    WHEN 'completed' THEN EXTRACT(EPOCH FROM (NOW() - aj.completed_at))/3600
    WHEN 'qc_review' THEN EXTRACT(EPOCH FROM (NOW() - aj.qc_started_at))/3600
    ELSE 0
  END as hours_in_current_status,
  aj.qc_status, aj.rework_count
FROM assembly_journeys aj
LEFT JOIN locations l ON aj.current_location_id = l.id
LEFT JOIN assembly_bins b ON aj.bin_location_id = b.id
LEFT JOIN users t ON aj.technician_id = t.id
LEFT JOIN users s ON aj.supervisor_id = s.id
LEFT JOIN users q ON aj.qc_person_id = q.id
LEFT JOIN items i ON aj.model_sku = i.sku
ORDER BY aj.priority DESC, aj.inwarded_at ASC;

NOTIFY pgrst, 'reload schema';
`;

const down = `
-- Revert to original kanban view without item details
CREATE OR REPLACE VIEW assembly_kanban_board AS
SELECT
  aj.id, aj.barcode, aj.model_sku, aj.frame_number, aj.current_status, aj.priority,
  aj.parts_missing, aj.damage_reported, aj.assembly_paused, aj.checklist,
  aj.inwarded_at, aj.assigned_at, aj.started_at, aj.completed_at, aj.qc_started_at, aj.qc_completed_at,
  aj.current_location_id, l.name as location_name, l.code as location_code,
  aj.bin_location_id, b.bin_code, b.bin_name, b.status_zone as bin_zone, b.zone as bin_area,
  aj.technician_id, t.name as technician_name,
  aj.supervisor_id, s.name as supervisor_name,
  aj.qc_person_id, q.name as qc_person_name,
  CASE aj.current_status
    WHEN 'inwarded' THEN EXTRACT(EPOCH FROM (NOW() - aj.inwarded_at))/3600
    WHEN 'assigned' THEN EXTRACT(EPOCH FROM (NOW() - aj.assigned_at))/3600
    WHEN 'in_progress' THEN EXTRACT(EPOCH FROM (NOW() - aj.started_at))/3600
    WHEN 'completed' THEN EXTRACT(EPOCH FROM (NOW() - aj.completed_at))/3600
    WHEN 'qc_review' THEN EXTRACT(EPOCH FROM (NOW() - aj.qc_started_at))/3600
    ELSE 0
  END as hours_in_current_status,
  aj.qc_status, aj.rework_count
FROM assembly_journeys aj
LEFT JOIN locations l ON aj.current_location_id = l.id
LEFT JOIN assembly_bins b ON aj.bin_location_id = b.id
LEFT JOIN users t ON aj.technician_id = t.id
LEFT JOIN users s ON aj.supervisor_id = s.id
LEFT JOIN users q ON aj.qc_person_id = q.id
ORDER BY aj.priority DESC, aj.inwarded_at ASC;

NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
