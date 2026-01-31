-- =====================================================
-- Reload PostgREST Schema
-- Run this in your Supabase SQL Editor to refresh the API
-- =====================================================

-- This command tells PostgREST to reload its schema cache
-- Required after any DDL changes (CREATE TABLE, ALTER TABLE, etc.)
NOTIFY pgrst, 'reload schema';

-- Verify the notification was sent
SELECT 'PostgREST schema reload notification sent successfully!' AS status;
