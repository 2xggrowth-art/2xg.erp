const up = `
-- Audit log table for tracking financial and sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who performed the action
  user_id UUID,
  user_email TEXT,
  user_role TEXT,

  -- What happened
  action TEXT NOT NULL,           -- 'create', 'update', 'delete', 'status_change'
  entity_type TEXT NOT NULL,      -- 'bill', 'invoice', 'payment', 'expense', 'transfer_order', 'vendor', 'customer', 'user'
  entity_id UUID,                 -- ID of the affected record
  entity_number TEXT,             -- Human-readable number (e.g. 'INV-001', 'BILL-042')

  -- Change details
  changes JSONB,                  -- { field: { old: ..., new: ... } }
  metadata JSONB,                 -- Additional context (IP, amount, etc.)

  -- When
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP TABLE IF EXISTS audit_logs;
NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
