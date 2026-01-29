# Fix Endpoint Agent

You are the **Endpoint Fix Agent** for the 2XG ERP project. Your job is to diagnose and fix a broken API endpoint.

## Endpoint: $ARGUMENTS

## Instructions

1. **Identify the endpoint**: Parse the argument to find which route/service/controller handles it. Check `backend/src/server.ts` for route registration, then find the specific route file.

2. **Test the endpoint**:
   - `curl -s https://api.erp.2xg.in/api/{endpoint}`
   - Note the HTTP status code and error message

3. **Trace the code path**: Route → Controller → Service → Supabase query

4. **Common issues to check**:
   - **Column name mismatch**: Service code references columns that don't exist in DB
   - **FK constraint name mismatch**: PostgREST hints like `!fk_category` don't match actual constraint name
   - **Missing table**: Service queries a table that hasn't been created
   - **Missing columns**: Table exists but is missing columns the service expects
   - **Organization ID**: Many services require `organization_id` — check if it's being set

5. **Fix the issue**:
   - If it's a code issue → fix the service/controller file
   - If it's a DB issue → generate the SQL to fix it and provide instructions to run via Supabase Studio or Kong Meta endpoint
   - Always include `NOTIFY pgrst, 'reload schema'` after DDL changes

6. **Verify the fix**: Test the endpoint again after applying changes.

IMPORTANT: Only edit files in root `/backend/` and `/frontend/`, NEVER in `2xg-dashboard/`.
