# AI Prompt Templates for Task Creation

Use these templates when creating tasks (Jira, Linear, GitHub Issues, etc.) for developers or when asking Claude Code to work on the 2XG ERP project. Each template includes references to the correct agents.

---

## Template 1: New Feature / Module

```
**Task**: [Feature Name]
**Description**: [What the feature should do]

**Instructions**:
1. Use `/add-module [module-name]` agent to scaffold the backend and frontend files
2. All code goes in root `/backend/` and `/frontend/` — NEVER in `/2xg-dashboard/`
3. Follow existing patterns in `backend/src/services/items.service.ts` for reference
4. Use Supabase client for all DB operations
5. Response format: `{ success: boolean, data?: any, error?: string }`
6. After creating DB tables, run `NOTIFY pgrst, 'reload schema'`

**Acceptance Criteria**:
- Backend: service, controller, route files created and registered in server.ts
- Frontend: service and component files created, route added in App.tsx
- Both `npm run build` pass in backend and frontend
- Use `/review-pr` agent before merging
```

---

## Template 2: Bug Fix

```
**Task**: Fix [endpoint/page] — [error description]
**Error**: [paste error message or HTTP status code]
**URL**: [which URL is failing, e.g., https://api.erp.2xg.in/api/expenses]

**Instructions**:
1. Use `/fix-endpoint [endpoint-path]` agent to diagnose and fix
2. Trace: route → controller → service → Supabase query
3. Common causes: column name mismatch, missing FK constraint, missing table/columns
4. If schema change needed, use `/db-schema` agent to generate SQL
5. After DDL changes: `NOTIFY pgrst, 'reload schema'`

**Acceptance Criteria**:
- Endpoint returns 200 with correct data
- No TypeScript build errors
- Use `/deploy-check` agent to verify production after fix
```

---

## Template 3: PR Review

```
**Task**: Review and merge [branch-name]
**PR**: [PR number or link]

**Instructions**:
1. Use `/review-pr [branch-name]` agent to run full review
2. CRITICAL CHECKS:
   - No changes in `/2xg-dashboard/` (legacy — not deployed)
   - No hardcoded URLs
   - CORS updated if new domains added
   - Schema in sync with service code
3. If legacy changes found, use `/sync-legacy` agent to port them to root
4. Build test: `cd backend && npm run build && cd ../frontend && npm run build`

**Merge only if all checks pass.**
```

---

## Template 4: Database Change

```
**Task**: [Add/modify table/column] for [feature]
**Table**: [table name]
**Changes**: [describe columns to add/modify]

**Instructions**:
1. Use `/db-schema [description]` agent to generate SQL
2. Execute SQL via Supabase Studio or Kong Meta endpoint
3. Run `NOTIFY pgrst, 'reload schema'` after DDL changes
4. Update the corresponding service file in `/backend/src/services/`
5. Verify PostgREST FK hints match actual constraint names

**Schema quirks to remember**:
- expense_categories uses `category_name` (not `name`)
- Vendors service queries `suppliers` table (not `vendors`)
- Expenses FK constraint is named `fk_category`
```

---

## Template 5: Deployment Issue

```
**Task**: [endpoint/page] not working in production
**Symptoms**: [what's broken]

**Instructions**:
1. Use `/deploy-check` agent to verify all endpoints
2. Check Coolify deployment status via API
3. If code changes needed, fix in root `/backend/` or `/frontend/`
4. After pushing to `main`, Coolify auto-deploys
5. Verify with `/deploy-check` agent after deployment

**NEVER change Coolify base_directory without DevOps approval**:
- Backend: `/backend`
- Frontend: `/frontend`
```

---

## Template 6: Sync After Developer Merge

```
**Task**: Sync code after merging [branch-name]
**Context**: Developer may have made changes in wrong directory

**Instructions**:
1. Pull latest: `git pull origin main`
2. Use `/sync-legacy` agent to check for misplaced changes
3. Use `/review-pr` agent to audit the merged code
4. Fix any issues found (missing files, wrong directory, etc.)
5. Push fixes and verify with `/deploy-check`

**Common issue**: Developers edit `/2xg-dashboard/` instead of root. Changes there are NOT deployed.
```

---

## Quick Reference: Available Agents

| Agent | Command | When to Use |
|-------|---------|-------------|
| PR Review | `/review-pr [branch]` | Before merging any PR |
| Deploy Check | `/deploy-check` | After deployment or when something seems broken |
| Legacy Sync | `/sync-legacy [module]` | After merging branches that might have legacy changes |
| Add Module | `/add-module [name]` | When creating a new ERP module |
| Fix Endpoint | `/fix-endpoint [path]` | When an API endpoint returns errors |
| DB Schema | `/db-schema [task]` | When database changes are needed |
