/**
 * Migration 007: Add product_subcategories table and subcategory_id to items
 *
 * Run via Supabase /pg/query endpoint:
 *
 * CREATE TABLE IF NOT EXISTS product_subcategories (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
 *   name TEXT NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   UNIQUE(category_id, name)
 * );
 *
 * ALTER TABLE items ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES product_subcategories(id);
 *
 * NOTIFY pgrst, 'reload schema';
 */

module.exports = {
  up: `
    CREATE TABLE IF NOT EXISTS product_subcategories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(category_id, name)
    );

    ALTER TABLE items ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES product_subcategories(id);

    NOTIFY pgrst, 'reload schema';
  `,
  down: `
    ALTER TABLE items DROP COLUMN IF EXISTS subcategory_id;
    DROP TABLE IF EXISTS product_subcategories;
    NOTIFY pgrst, 'reload schema';
  `
};
