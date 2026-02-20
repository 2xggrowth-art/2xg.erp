// Migration 029: Create Buildline Assembly Tracking Tables
// Adds bicycle assembly journey tracking to the ERP system
// Adapted from Buildline standalone project - no Postgres enums, no user_profiles, no RLS

const up = `
-- ============================================================================
-- BUILDLINE ASSEMBLY TRACKING - ERP Integration
-- ============================================================================

-- Add columns to existing locations table for Buildline compatibility
ALTER TABLE locations ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add buildline_role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS buildline_role TEXT
  CHECK (buildline_role IS NULL OR buildline_role IN ('admin', 'supervisor', 'technician', 'qc_person', 'warehouse_staff'));

-- ============================================================================
-- Assembly Bins (separate from ERP bin_locations - different purpose)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assembly_bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  bin_code TEXT NOT NULL,
  bin_name TEXT,
  zone TEXT,
  status_zone TEXT NOT NULL DEFAULT 'inward_zone'
    CHECK (status_zone IN ('inward_zone', 'assembly_zone', 'completion_zone', 'qc_zone', 'ready_zone')),
  bin_status TEXT DEFAULT 'active'
    CHECK (bin_status IN ('active', 'maintenance', 'full', 'inactive')),
  is_active BOOLEAN DEFAULT true,
  capacity INTEGER DEFAULT 1,
  current_occupancy INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_assembly_bin_per_location UNIQUE(location_id, bin_code),
  CONSTRAINT valid_assembly_bin_occupancy CHECK (current_occupancy >= 0 AND current_occupancy <= capacity)
);

-- ============================================================================
-- Assembly Journeys (Main table - single source of truth for bike tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assembly_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  model_sku TEXT NOT NULL,
  frame_number TEXT,
  current_status TEXT NOT NULL DEFAULT 'inwarded'
    CHECK (current_status IN ('inwarded', 'assigned', 'in_progress', 'completed', 'qc_review', 'ready_for_sale')),
  current_location_id UUID REFERENCES locations(id),
  bin_location_id UUID REFERENCES assembly_bins(id),
  priority BOOLEAN DEFAULT false,
  checklist JSONB DEFAULT '{"tyres": false, "brakes": false, "gears": false}'::jsonb,
  technician_id UUID REFERENCES users(id),
  supervisor_id UUID REFERENCES users(id),
  qc_person_id UUID REFERENCES users(id),
  inwarded_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  qc_started_at TIMESTAMPTZ,
  qc_completed_at TIMESTAMPTZ,
  parts_missing BOOLEAN DEFAULT false,
  parts_missing_list TEXT[],
  damage_reported BOOLEAN DEFAULT false,
  damage_notes TEXT,
  damage_photos TEXT[],
  assembly_paused BOOLEAN DEFAULT false,
  pause_reason TEXT,
  qc_status TEXT DEFAULT 'pending'
    CHECK (qc_status IN ('pending', 'pass', 'fail')),
  qc_failure_reason TEXT,
  qc_photos TEXT[],
  rework_count INTEGER DEFAULT 0,
  grn_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT checklist_structure CHECK (
    checklist ? 'tyres' AND checklist ? 'brakes' AND checklist ? 'gears'
  )
);

-- ============================================================================
-- Assembly Status History (Audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assembly_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Assembly Location History (Track bike movements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assembly_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID NOT NULL REFERENCES locations(id),
  moved_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- QC Checklists (Detailed QC inspection records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS qc_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  qc_person_id UUID NOT NULL REFERENCES users(id),
  brake_check BOOLEAN DEFAULT false,
  brake_notes TEXT,
  drivetrain_check BOOLEAN DEFAULT false,
  drivetrain_notes TEXT,
  alignment_check BOOLEAN DEFAULT false,
  alignment_notes TEXT,
  torque_check BOOLEAN DEFAULT false,
  torque_notes TEXT,
  accessories_check BOOLEAN DEFAULT false,
  accessories_notes TEXT,
  result TEXT NOT NULL CHECK (result IN ('pending', 'pass', 'fail')),
  failure_reason TEXT,
  photos TEXT[],
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Bin Movement History
-- ============================================================================
CREATE TABLE IF NOT EXISTS assembly_bin_movement_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES assembly_journeys(id) ON DELETE CASCADE,
  from_bin_id UUID REFERENCES assembly_bins(id),
  to_bin_id UUID REFERENCES assembly_bins(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  moved_by UUID REFERENCES users(id),
  reason TEXT,
  auto_assigned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_assembly_journeys_barcode ON assembly_journeys(barcode);
CREATE INDEX IF NOT EXISTS idx_assembly_journeys_status ON assembly_journeys(current_status);
CREATE INDEX IF NOT EXISTS idx_assembly_journeys_technician ON assembly_journeys(technician_id);
CREATE INDEX IF NOT EXISTS idx_assembly_journeys_location ON assembly_journeys(current_location_id);
CREATE INDEX IF NOT EXISTS idx_assembly_journeys_priority ON assembly_journeys(priority) WHERE priority = true;
CREATE INDEX IF NOT EXISTS idx_assembly_journeys_bin ON assembly_journeys(bin_location_id);
CREATE INDEX IF NOT EXISTS idx_assembly_status_history_journey ON assembly_status_history(journey_id);
CREATE INDEX IF NOT EXISTS idx_assembly_location_history_journey ON assembly_location_history(journey_id);
CREATE INDEX IF NOT EXISTS idx_assembly_qc_checklists_journey ON qc_checklists(journey_id);
CREATE INDEX IF NOT EXISTS idx_assembly_bins_location ON assembly_bins(location_id);
CREATE INDEX IF NOT EXISTS idx_assembly_bins_active ON assembly_bins(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_assembly_bin_movement_journey ON assembly_bin_movement_history(journey_id);
CREATE INDEX IF NOT EXISTS idx_assembly_bin_movement_from ON assembly_bin_movement_history(from_bin_id);
CREATE INDEX IF NOT EXISTS idx_assembly_bin_movement_to ON assembly_bin_movement_history(to_bin_id);

-- ============================================================================
-- TRIGGERS & UTILITY FUNCTIONS
-- ============================================================================

-- Auto-update updated_at (CREATE OR REPLACE is safe if it already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assembly_journeys_updated_at
  BEFORE UPDATE ON assembly_journeys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assembly_bins_updated_at
  BEFORE UPDATE ON assembly_bins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-log status changes
CREATE OR REPLACE FUNCTION assembly_log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO assembly_status_history (journey_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.current_status, NEW.current_status,
      COALESCE(NEW.technician_id, NEW.supervisor_id, NEW.qc_person_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_assembly_status_change
  AFTER UPDATE ON assembly_journeys
  FOR EACH ROW EXECUTE FUNCTION assembly_log_status_change();

-- Auto-log location changes
CREATE OR REPLACE FUNCTION assembly_log_location_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_location_id IS DISTINCT FROM NEW.current_location_id THEN
    INSERT INTO assembly_location_history (journey_id, from_location_id, to_location_id, moved_by)
    VALUES (NEW.id, OLD.current_location_id, NEW.current_location_id,
      COALESCE(NEW.technician_id, NEW.supervisor_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_assembly_location_change
  AFTER UPDATE ON assembly_journeys
  FOR EACH ROW EXECUTE FUNCTION assembly_log_location_change();

-- Bin occupancy tracking (UPDATE)
CREATE OR REPLACE FUNCTION assembly_update_bin_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.bin_location_id IS DISTINCT FROM NEW.bin_location_id THEN
    IF OLD.bin_location_id IS NOT NULL THEN
      UPDATE assembly_bins SET current_occupancy = GREATEST(current_occupancy - 1, 0)
      WHERE id = OLD.bin_location_id;
    END IF;
    IF NEW.bin_location_id IS NOT NULL THEN
      UPDATE assembly_bins SET current_occupancy = current_occupancy + 1
      WHERE id = NEW.bin_location_id;
      IF (SELECT current_occupancy > capacity FROM assembly_bins WHERE id = NEW.bin_location_id) THEN
        RAISE EXCEPTION 'Assembly bin is at full capacity';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assembly_bin_occupancy
  AFTER UPDATE ON assembly_journeys
  FOR EACH ROW EXECUTE FUNCTION assembly_update_bin_occupancy();

-- Bin occupancy tracking (INSERT)
CREATE OR REPLACE FUNCTION assembly_insert_bin_occupancy()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bin_location_id IS NOT NULL THEN
    UPDATE assembly_bins SET current_occupancy = current_occupancy + 1
    WHERE id = NEW.bin_location_id;
    IF (SELECT current_occupancy > capacity FROM assembly_bins WHERE id = NEW.bin_location_id) THEN
      RAISE EXCEPTION 'Assembly bin is at full capacity';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insert_assembly_bin_occupancy
  AFTER INSERT ON assembly_journeys
  FOR EACH ROW EXECUTE FUNCTION assembly_insert_bin_occupancy();

-- Auto-assign bin on status change
CREATE OR REPLACE FUNCTION assembly_auto_assign_bin()
RETURNS TRIGGER AS $$
DECLARE
  v_target_zone TEXT;
  v_new_bin_id UUID;
BEGIN
  IF OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    v_target_zone := CASE
      WHEN NEW.current_status = 'inwarded' THEN 'inward_zone'
      WHEN NEW.current_status IN ('assigned', 'in_progress') THEN 'assembly_zone'
      WHEN NEW.current_status = 'completed' THEN 'completion_zone'
      WHEN NEW.current_status = 'qc_review' THEN 'qc_zone'
      WHEN NEW.current_status = 'ready_for_sale' THEN 'ready_zone'
    END;

    SELECT id INTO v_new_bin_id FROM assembly_bins
    WHERE location_id = NEW.current_location_id
      AND status_zone = v_target_zone
      AND is_active = true AND bin_status = 'active'
      AND current_occupancy < capacity
    ORDER BY current_occupancy ASC, bin_code ASC LIMIT 1;

    IF v_new_bin_id IS NOT NULL AND v_new_bin_id IS DISTINCT FROM NEW.bin_location_id THEN
      INSERT INTO assembly_bin_movement_history (
        journey_id, from_bin_id, to_bin_id, from_status, to_status, moved_by, auto_assigned
      ) VALUES (
        NEW.id, NEW.bin_location_id, v_new_bin_id, OLD.current_status, NEW.current_status,
        COALESCE(NEW.technician_id, NEW.supervisor_id, NEW.qc_person_id), true
      );
      NEW.bin_location_id := v_new_bin_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_assembly_bin
  BEFORE UPDATE ON assembly_journeys
  FOR EACH ROW EXECUTE FUNCTION assembly_auto_assign_bin();

-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Assign bike to technician
CREATE OR REPLACE FUNCTION assign_to_technician(p_barcode TEXT, p_technician_id UUID, p_supervisor_id UUID)
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  UPDATE assembly_journeys
  SET current_status = 'assigned', technician_id = p_technician_id,
      supervisor_id = p_supervisor_id, assigned_at = NOW()
  WHERE barcode = p_barcode AND current_status = 'inwarded';

  IF FOUND THEN
    v_result = jsonb_build_object('success', true, 'message', 'Bike assigned to technician', 'barcode', p_barcode);
  ELSE
    v_result = jsonb_build_object('success', false, 'message', 'Bike not found or not in inwarded status', 'barcode', p_barcode);
  END IF;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Start assembly
CREATE OR REPLACE FUNCTION start_assembly(p_barcode TEXT, p_technician_id UUID)
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  UPDATE assembly_journeys
  SET current_status = 'in_progress', started_at = NOW()
  WHERE barcode = p_barcode AND technician_id = p_technician_id AND current_status = 'assigned';

  IF FOUND THEN
    v_result = jsonb_build_object('success', true, 'message', 'Assembly started', 'barcode', p_barcode);
  ELSE
    v_result = jsonb_build_object('success', false, 'message', 'Bike not found, not assigned to you, or already started', 'barcode', p_barcode);
  END IF;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Complete assembly (goes directly to ready_for_sale - QC process removed)
CREATE OR REPLACE FUNCTION complete_assembly(p_barcode TEXT, p_technician_id UUID, p_checklist JSONB)
RETURNS JSONB AS $$
DECLARE v_result JSONB; v_all_checked BOOLEAN;
BEGIN
  v_all_checked := (
    (p_checklist->>'tyres')::boolean = true AND
    (p_checklist->>'brakes')::boolean = true AND
    (p_checklist->>'gears')::boolean = true
  );

  IF NOT v_all_checked THEN
    RETURN jsonb_build_object('success', false, 'message', 'All checklist items must be completed', 'barcode', p_barcode);
  END IF;

  UPDATE assembly_journeys
  SET current_status = 'ready_for_sale', checklist = p_checklist,
      completed_at = NOW(), qc_status = 'pass', qc_completed_at = NOW()
  WHERE barcode = p_barcode AND technician_id = p_technician_id AND current_status = 'in_progress';

  IF FOUND THEN
    v_result = jsonb_build_object('success', true, 'message', 'Assembly completed - Bike ready for sale', 'barcode', p_barcode);
  ELSE
    v_result = jsonb_build_object('success', false, 'message', 'Bike not found, not assigned to you, or not in progress', 'barcode', p_barcode);
  END IF;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Sales lock check
CREATE OR REPLACE FUNCTION can_invoice_item(p_barcode TEXT)
RETURNS TABLE(can_invoice BOOLEAN, message TEXT, barcode TEXT, status TEXT, sku TEXT) AS $$
DECLARE v_journey assembly_journeys%ROWTYPE;
BEGIN
  SELECT * INTO v_journey FROM assembly_journeys WHERE assembly_journeys.barcode = p_barcode;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Barcode not found in assembly system'::TEXT, p_barcode, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  IF v_journey.current_status = 'ready_for_sale' THEN
    RETURN QUERY SELECT true, 'Ready for sale'::TEXT, v_journey.barcode, v_journey.current_status, v_journey.model_sku;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, ('Cannot invoice: Status is ' || v_journey.current_status)::TEXT,
    v_journey.barcode, v_journey.current_status, v_journey.model_sku;
END;
$$ LANGUAGE plpgsql;

-- Get technician queue
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

-- Submit QC result
CREATE OR REPLACE FUNCTION submit_qc_result(
  p_barcode TEXT, p_qc_person_id UUID, p_result TEXT,
  p_failure_reason TEXT DEFAULT NULL, p_photos TEXT[] DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE v_result JSONB; v_new_status TEXT;
BEGIN
  IF p_result = 'pass' THEN v_new_status := 'ready_for_sale';
  ELSIF p_result = 'fail' THEN v_new_status := 'in_progress';
  ELSE RETURN jsonb_build_object('success', false, 'message', 'Invalid QC result. Must be pass or fail', 'barcode', p_barcode);
  END IF;

  UPDATE assembly_journeys
  SET current_status = v_new_status, qc_status = p_result, qc_person_id = p_qc_person_id,
      qc_completed_at = NOW(), qc_failure_reason = p_failure_reason, qc_photos = p_photos,
      rework_count = CASE WHEN p_result = 'fail' THEN rework_count + 1 ELSE rework_count END
  WHERE barcode = p_barcode AND current_status IN ('completed', 'qc_review');

  IF FOUND THEN
    v_result = jsonb_build_object('success', true, 'message', 'QC result submitted: ' || p_result, 'barcode', p_barcode, 'new_status', v_new_status);
  ELSE
    v_result = jsonb_build_object('success', false, 'message', 'Bike not found or not ready for QC', 'barcode', p_barcode);
  END IF;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Get bins by zone
CREATE OR REPLACE FUNCTION get_bins_by_zone(p_location_id UUID, p_zone TEXT)
RETURNS TABLE (
  id UUID, bin_code TEXT, bin_name TEXT, zone TEXT,
  status_zone TEXT, capacity INTEGER, current_occupancy INTEGER,
  available_slots INTEGER, bin_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.bin_code, b.bin_name, b.zone, b.status_zone, b.capacity,
    b.current_occupancy, b.capacity - b.current_occupancy as available_slots, b.bin_status
  FROM assembly_bins b
  WHERE b.location_id = p_location_id AND b.status_zone = p_zone AND b.is_active = true
  ORDER BY b.bin_code;
END;
$$ LANGUAGE plpgsql;

-- Move bike to bin
CREATE OR REPLACE FUNCTION move_bike_to_bin(p_barcode TEXT, p_new_bin_id UUID, p_moved_by UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE v_journey_id UUID; v_old_bin_id UUID; v_current_status TEXT;
BEGIN
  SELECT id, bin_location_id, current_status INTO v_journey_id, v_old_bin_id, v_current_status
  FROM assembly_journeys WHERE barcode = p_barcode;

  IF v_journey_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Bike not found');
  END IF;

  UPDATE assembly_journeys SET bin_location_id = p_new_bin_id WHERE id = v_journey_id;

  INSERT INTO assembly_bin_movement_history (
    journey_id, from_bin_id, to_bin_id, from_status, to_status, moved_by, reason, auto_assigned
  ) VALUES (v_journey_id, v_old_bin_id, p_new_bin_id, v_current_status, v_current_status, p_moved_by, p_reason, false);

  RETURN jsonb_build_object(
    'success', true, 'message', 'Bike moved to new bin successfully',
    'journey_id', v_journey_id, 'old_bin_id', v_old_bin_id, 'new_bin_id', p_new_bin_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS (prefixed with assembly_ to avoid conflicts)
-- ============================================================================

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

CREATE OR REPLACE VIEW assembly_technician_workload AS
SELECT
  t.id as technician_id, t.name as technician_name, t.email,
  COUNT(CASE WHEN aj.current_status = 'assigned' THEN 1 END) as assigned_count,
  COUNT(CASE WHEN aj.current_status = 'in_progress' THEN 1 END) as in_progress_count,
  COUNT(CASE WHEN DATE(aj.completed_at) = CURRENT_DATE THEN 1 END) as completed_today,
  COUNT(CASE WHEN aj.current_status = 'ready_for_sale' THEN 1 END) as total_completed,
  COUNT(CASE WHEN aj.rework_count > 0 THEN 1 END) as rework_items,
  AVG(CASE
    WHEN aj.completed_at IS NOT NULL AND aj.started_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (aj.completed_at - aj.started_at)) / 3600
  END) as avg_assembly_hours,
  ROUND(
    100.0 * COUNT(CASE WHEN aj.qc_status = 'pass' THEN 1 END)::numeric /
    NULLIF(COUNT(CASE WHEN aj.qc_status IN ('pass', 'fail') THEN 1 END), 0), 2
  ) as qc_pass_rate_percent
FROM users t
LEFT JOIN assembly_journeys aj ON t.id = aj.technician_id
WHERE t.buildline_role = 'technician'
GROUP BY t.id, t.name, t.email
ORDER BY in_progress_count DESC, assigned_count DESC;

CREATE OR REPLACE VIEW assembly_daily_dashboard AS
SELECT
  CURRENT_DATE as report_date,
  COUNT(CASE WHEN DATE(inwarded_at) = CURRENT_DATE THEN 1 END) as inwarded_today,
  COUNT(CASE WHEN DATE(completed_at) = CURRENT_DATE THEN 1 END) as assembled_today,
  COUNT(CASE WHEN DATE(qc_completed_at) = CURRENT_DATE AND current_status = 'ready_for_sale' THEN 1 END) as qc_passed_today,
  COUNT(CASE WHEN current_status = 'inwarded' THEN 1 END) as pending_assignment,
  COUNT(CASE WHEN current_status = 'assigned' THEN 1 END) as pending_start,
  COUNT(CASE WHEN current_status = 'in_progress' THEN 1 END) as currently_assembling,
  COUNT(CASE WHEN current_status = 'ready_for_sale' THEN 1 END) as ready_for_sale,
  COUNT(CASE WHEN EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 > 24 AND current_status != 'ready_for_sale' THEN 1 END) as stuck_over_24h,
  COUNT(CASE WHEN priority = true AND current_status != 'ready_for_sale' THEN 1 END) as priority_pending
FROM assembly_journeys;

CREATE OR REPLACE VIEW assembly_qc_failure_analysis AS
SELECT
  aj.model_sku, aj.qc_failure_reason,
  COUNT(*) as failure_count,
  array_agg(DISTINCT t.name) as technicians,
  AVG(EXTRACT(EPOCH FROM (aj.qc_completed_at - aj.qc_started_at)) / 3600) as avg_rework_hours,
  MAX(aj.qc_started_at) as last_failure_date
FROM assembly_journeys aj
LEFT JOIN users t ON aj.technician_id = t.id
WHERE aj.qc_status = 'fail' AND aj.qc_failure_reason IS NOT NULL
GROUP BY aj.model_sku, aj.qc_failure_reason
ORDER BY failure_count DESC;

CREATE OR REPLACE VIEW assembly_bottleneck_report AS
SELECT
  aj.current_status,
  COUNT(*) as bikes_in_stage,
  AVG(EXTRACT(EPOCH FROM (NOW() - aj.updated_at)) / 3600) as avg_hours_in_stage,
  MAX(EXTRACT(EPOCH FROM (NOW() - aj.updated_at)) / 3600) as max_hours_in_stage,
  COUNT(CASE WHEN l.type = 'warehouse' THEN 1 END) as in_warehouse,
  COUNT(CASE WHEN l.type = 'store' THEN 1 END) as in_store,
  COUNT(CASE WHEN aj.priority = true THEN 1 END) as priority_items
FROM assembly_journeys aj
LEFT JOIN locations l ON aj.current_location_id = l.id
WHERE aj.current_status != 'ready_for_sale'
GROUP BY aj.current_status
ORDER BY
  CASE aj.current_status
    WHEN 'inwarded' THEN 1 WHEN 'assigned' THEN 2
    WHEN 'in_progress' THEN 3 WHEN 'completed' THEN 4
    WHEN 'qc_review' THEN 5
  END;

CREATE OR REPLACE VIEW assembly_bin_zone_statistics AS
SELECT
  l.id as location_id, l.name as location_name, l.code as location_code,
  b.status_zone,
  COUNT(b.id) as total_bins,
  SUM(b.capacity) as total_capacity,
  SUM(b.current_occupancy) as total_occupancy,
  SUM(b.capacity - b.current_occupancy) as available_slots,
  ROUND((SUM(b.current_occupancy)::DECIMAL / NULLIF(SUM(b.capacity), 0) * 100), 2) as occupancy_percentage
FROM locations l
LEFT JOIN assembly_bins b ON l.id = b.location_id AND b.is_active = true
WHERE b.status_zone IS NOT NULL
GROUP BY l.id, l.name, l.code, b.status_zone
ORDER BY l.name, b.status_zone;

NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP VIEW IF EXISTS assembly_bin_zone_statistics CASCADE;
DROP VIEW IF EXISTS assembly_bottleneck_report CASCADE;
DROP VIEW IF EXISTS assembly_qc_failure_analysis CASCADE;
DROP VIEW IF EXISTS assembly_daily_dashboard CASCADE;
DROP VIEW IF EXISTS assembly_technician_workload CASCADE;
DROP VIEW IF EXISTS assembly_kanban_board CASCADE;

DROP FUNCTION IF EXISTS move_bike_to_bin(TEXT, UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_bins_by_zone(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS submit_qc_result(TEXT, UUID, TEXT, TEXT, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS get_technician_queue(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_invoice_item(TEXT) CASCADE;
DROP FUNCTION IF EXISTS complete_assembly(TEXT, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS start_assembly(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS assign_to_technician(TEXT, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS assembly_auto_assign_bin() CASCADE;
DROP FUNCTION IF EXISTS assembly_insert_bin_occupancy() CASCADE;
DROP FUNCTION IF EXISTS assembly_update_bin_occupancy() CASCADE;
DROP FUNCTION IF EXISTS assembly_log_location_change() CASCADE;
DROP FUNCTION IF EXISTS assembly_log_status_change() CASCADE;

DROP TABLE IF EXISTS assembly_bin_movement_history CASCADE;
DROP TABLE IF EXISTS qc_checklists CASCADE;
DROP TABLE IF EXISTS assembly_location_history CASCADE;
DROP TABLE IF EXISTS assembly_status_history CASCADE;
DROP TABLE IF EXISTS assembly_journeys CASCADE;
DROP TABLE IF EXISTS assembly_bins CASCADE;

ALTER TABLE users DROP COLUMN IF EXISTS buildline_role;
ALTER TABLE locations DROP COLUMN IF EXISTS code;
ALTER TABLE locations DROP COLUMN IF EXISTS type;
ALTER TABLE locations DROP COLUMN IF EXISTS address;
ALTER TABLE locations DROP COLUMN IF EXISTS is_active;

NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
