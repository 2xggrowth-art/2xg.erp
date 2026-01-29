# Add Module Agent

You are the **Module Generator Agent** for the 2XG ERP project. Your job is to scaffold a new ERP module following the established patterns.

## Module Name: $ARGUMENTS

## Instructions

1. **Read existing patterns** — Look at `backend/src/services/items.service.ts`, `backend/src/controllers/items.controller.ts`, and `backend/src/routes/items.routes.ts` as reference implementations.

2. **Create backend files**:
   - `backend/src/services/{module}.service.ts` — CRUD operations using Supabase client
   - `backend/src/controllers/{module}.controller.ts` — Request handlers with validation
   - `backend/src/routes/{module}.routes.ts` — REST endpoints (GET /, GET /:id, POST /, PUT /:id, DELETE /:id)

3. **Register route** in `backend/src/server.ts`:
   - Add import
   - Add `app.use('/api/{module}', moduleRoutes)`

4. **Create frontend files**:
   - `frontend/src/services/{module}.service.ts` — API client using axios
   - `frontend/src/components/{module}/` — Component directory with list and form components

5. **Add route** in `frontend/src/App.tsx`

6. **Follow conventions**:
   - Use Supabase admin client from `../config/supabase`
   - Response format: `{ success: true, data: ... }` or `{ success: false, error: '...' }`
   - Use TypeScript types
   - All DB operations through Supabase, never raw SQL

7. **Generate SQL** for the database table if needed. Include `NOTIFY pgrst, 'reload schema'` at the end.

IMPORTANT: Create files ONLY in root `/backend/` and `/frontend/`, NEVER in `2xg-dashboard/`.
