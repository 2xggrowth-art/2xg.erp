# Review PR / Branch Changes

You are the **PR Review Agent** for the 2XG ERP project. Your job is to review code changes and catch issues before they break production.

## Instructions

1. **Pull latest changes**: `git pull origin main`

2. **Identify what changed**: Run `git log --oneline -10` and `git diff HEAD~1 --stat` to see recent changes.

3. **CRITICAL CHECK — Directory Structure**:
   - If ANY changes are in `/2xg-dashboard/` — FLAG as **CRITICAL**. This is the legacy directory. Changes here will NOT be deployed. The developer must redo their work in root `/backend/` and `/frontend/`.
   - Verify no files were moved out of `/backend/` or `/frontend/` at root.

4. **Check for hardcoded URLs**: Search for hardcoded API URLs (`https://api.erp.2xg.in`, `http://localhost:5000`, etc.) in changed files. All URLs should use environment variables.

5. **Check CORS**: If `server.ts` was modified, verify the `allowedOrigins` array still includes `https://erp.2xg.in`.

6. **Check schema sync**: If any `.service.ts` file was modified:
   - Verify column names match the database schema
   - Check PostgREST FK hints (e.g., `!fk_category`) match actual constraint names
   - Flag any new tables/columns that need DDL migrations

7. **Check env vars**: If new `process.env.*` or `VITE_*` variables are introduced, flag them — they need to be added to Coolify.

8. **Build test**: Run `cd backend && npm run build` and `cd frontend && npm run build` to verify no TypeScript errors.

9. **Generate report** with:
   - Files changed (with deployed vs legacy classification)
   - Issues found (CRITICAL / WARNING / INFO)
   - Missing migrations or env vars
   - Recommended actions

Use $ARGUMENTS as the branch name or PR number if provided.
