-- Mobile Users table for phone + PIN authentication
CREATE TABLE IF NOT EXISTS mobile_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15) NOT NULL UNIQUE,
  pin VARCHAR(4) NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50),
  branch VARCHAR(100) DEFAULT 'Head Office',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster phone lookup
CREATE INDEX IF NOT EXISTS idx_mobile_users_phone ON mobile_users(phone_number);

-- Insert sample users (you can modify these)
INSERT INTO mobile_users (phone_number, pin, employee_name, branch) VALUES
  ('9876543210', '1234', 'Admin User', 'Head Office'),
  ('9876543211', '1234', 'Field Staff 1', 'Branch 1'),
  ('9876543212', '1234', 'Field Staff 2', 'Branch 2')
ON CONFLICT (phone_number) DO NOTHING;

-- Reload PostgREST cache
NOTIFY pgrst, 'reload schema';
