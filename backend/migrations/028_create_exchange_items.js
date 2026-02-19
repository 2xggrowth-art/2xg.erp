const up = `
-- Exchange items table for tracking 2nd hand cycle exchanges
CREATE TABLE IF NOT EXISTS exchange_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('good', 'ok', 'bad')),
  invoice_reference TEXT,
  customer_name TEXT,
  estimated_price DECIMAL(15,2),
  photo_base64 TEXT,
  exchange_bin_id UUID REFERENCES bin_locations(id) ON DELETE SET NULL,
  received_by UUID REFERENCES mobile_users(id) ON DELETE SET NULL,
  received_by_name TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'listed', 'sold')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exchange_items_status ON exchange_items(status);
CREATE INDEX IF NOT EXISTS idx_exchange_items_condition ON exchange_items(condition);
CREATE INDEX IF NOT EXISTS idx_exchange_items_created ON exchange_items(created_at DESC);

NOTIFY pgrst, 'reload schema';
`;

const down = `
DROP TABLE IF EXISTS exchange_items;
NOTIFY pgrst, 'reload schema';
`;

module.exports = { up, down };
