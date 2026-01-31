-- Quick verification query to check if tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('bin_locations', 'bill_item_bin_allocations', 'bill_items')
ORDER BY table_name;
