// Assembly / Buildline types

export type AssemblyStatus = 'inwarded' | 'assigned' | 'in_progress' | 'ready_for_sale';
export type BinZone = 'inward_zone' | 'assembly_zone' | 'ready_zone';
export type BuildlineRole = 'admin' | 'supervisor' | 'technician' | 'qc_person' | 'warehouse_staff';

export interface AssemblyJourney {
  id: string;
  barcode: string;
  model_sku: string;
  frame_number?: string;
  current_status: AssemblyStatus;
  checklist: Record<string, boolean> | null;
  technician_id?: string;
  supervisor_id?: string;
  qc_person_id?: string;
  inwarded_at?: string;
  assigned_at?: string;
  assembly_started_at?: string;
  assembly_completed_at?: string;
  qc_completed_at?: string;
  parts_missing: boolean;
  parts_list?: string[];
  damage_reported: boolean;
  damage_notes?: string;
  damage_photos?: string[];
  qc_status?: string;
  qc_failure_reason?: string;
  rework_count: number;
  current_location_id?: string;
  priority: boolean;
  grn_reference?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  technician_name?: string;
  supervisor_name?: string;
  location_name?: string;
  current_bin_id?: string;
  current_bin_code?: string;
}

export interface KanbanItem {
  id: string;
  barcode: string;
  model_sku: string;
  frame_number?: string;
  current_status: AssemblyStatus;
  technician_id?: string;
  technician_name?: string;
  priority: boolean;
  parts_missing: boolean;
  damage_reported: boolean;
  inwarded_at?: string;
  assigned_at?: string;
  assembly_started_at?: string;
  assembly_completed_at?: string;
  current_bin_code?: string;
  location_name?: string;
}

export interface AssemblyBin {
  id: string;
  location_id: string;
  bin_code: string;
  bin_name: string;
  status_zone: BinZone;
  capacity: number;
  current_occupancy: number;
  is_active: boolean;
  created_at: string;
  // Joined
  location_name?: string;
}

export interface AssemblyLocation {
  id: string;
  name: string;
  code?: string;
  type?: string;
  address?: string;
  description?: string;
  status: string;
  is_active?: boolean;
}

export interface AssemblyStatusHistory {
  id: string;
  journey_id: string;
  from_status: AssemblyStatus | null;
  to_status: AssemblyStatus;
  changed_by: string;
  reason?: string;
  created_at: string;
  changed_by_name?: string;
}

export interface QCChecklist {
  id: string;
  journey_id: string;
  qc_person_id: string;
  brake_check: boolean;
  drivetrain_check: boolean;
  wheel_alignment_check: boolean;
  torque_spec_check: boolean;
  accessories_check: boolean;
  result: string;
  failure_reason?: string;
  photos?: string[];
  created_at: string;
}

export interface DashboardStats {
  total_bikes: number;
  inwarded: number;
  assigned: number;
  in_progress: number;
  ready_for_sale: number;
  avg_assembly_time_hours?: number;
  today_inwarded: number;
  today_completed: number;
  parts_missing_count: number;
  damage_reported_count: number;
}

export interface TechnicianWorkload {
  technician_id: string;
  technician_name: string;
  assigned_count: number;
  in_progress_count: number;
  completed_today: number;
  total_completed: number;
}

export interface BinZoneStats {
  zone: BinZone;
  zone_label: string;
  total_bins: number;
  total_capacity: number;
  total_occupancy: number;
  utilization_pct: number;
}

export interface BinMovementHistory {
  id: string;
  journey_id: string;
  from_bin_id?: string;
  to_bin_id: string;
  moved_by: string;
  reason?: string;
  created_at: string;
  from_bin_code?: string;
  to_bin_code?: string;
  moved_by_name?: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  buildline_role: string;
}
