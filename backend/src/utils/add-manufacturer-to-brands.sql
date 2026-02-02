-- Add manufacturer_id column to brands table
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brands_manufacturer_id ON brands(manufacturer_id);

-- Add comment
COMMENT ON COLUMN brands.manufacturer_id IS 'Links brand to its manufacturer';
