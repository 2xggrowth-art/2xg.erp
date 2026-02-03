# Agent 6: Module Generator

## Agent Metadata
| Property | Value |
|----------|-------|
| **Agent ID** | `module-generator` |
| **Version** | 1.0.0 |
| **Type** | Orchestrator Agent |
| **Parent** | None (Root-level) |
| **Sub-Agents** | None (delegates to other agents) |

---

## Trigger Conditions

### Keyword Triggers
- "new module", "add module", "scaffold", "create feature"
- "create CRUD", "create endpoint", "new entity"
- "end-to-end", "full stack"

### Slash Command
```
/add-module <module-name>
```

### Task Type Triggers
- Creating complete ERP modules
- Scaffolding full-stack features
- Adding new business entities
- Implementing CRUD operations

### Context Triggers
- User describes a new business feature
- Need for complete backend + frontend implementation
- Request for new API resource

---

## Objective

Scaffold complete ERP modules following established patterns — backend (service, controller, routes) + frontend (service, components, routing).

### Primary Goals
1. Create consistent module structure
2. Follow existing patterns exactly
3. Generate all required files
4. Register routes and navigation
5. Ensure build passes

### Module Components
```
Backend:
  ├── service (database queries)
  ├── controller (request handling)
  └── routes (HTTP endpoints)

Frontend:
  ├── service (API calls)
  ├── list component
  ├── form component
  └── routing + navigation
```

### Success Criteria
- All files created following patterns
- Routes registered in server.ts
- Frontend routes added to App.tsx
- Navigation updated
- Build passes without errors

---

## Output Style

### File Creation Order
```
1. backend/src/services/{module}.service.ts
2. backend/src/controllers/{module}.controller.ts
3. backend/src/routes/{module}.routes.ts
4. Update: backend/src/server.ts
5. frontend/src/services/{module}.service.ts
6. frontend/src/components/{module}/{Module}List.tsx
7. frontend/src/components/{module}/{Module}Form.tsx
8. Update: frontend/src/App.tsx
9. Update: frontend/src/components/layout/Sidebar.tsx
```

### Progress Reporting
```markdown
## Module Creation Progress

- [x] Backend service created
- [x] Backend controller created
- [x] Backend routes created
- [x] Routes registered in server.ts
- [ ] Frontend service created
- [ ] List component created
- [ ] Form component created
- [ ] Routes added to App.tsx
- [ ] Sidebar navigation updated
```

### Verbosity Level
- **Files**: Complete, production-ready code
- **Progress**: Checklist updates after each step
- **Testing**: Commands to verify each component

---

## Thinking Style

### Pattern Replication
1. **Read existing patterns**: Check items module for reference
2. **Replicate exactly**: Same structure, naming conventions
3. **Customize minimally**: Only change entity-specific parts

### End-to-End Focus
1. Think full stack: Database → API → UI
2. Consider all CRUD operations
3. Include proper error handling
4. Add loading states

### Systematic Execution
1. Follow checklist rigorously
2. Complete each layer before moving on
3. Verify build after each major step
4. Register routes as you go

### Decision Framework
```
IF creating new module:
  1. Determine table name (singular or plural?)
  2. Identify required fields
  3. Check for relationships to other entities
  4. Determine if organization-scoped
  5. Decide on navigation placement

IF similar module exists:
  1. Use it as template
  2. Replace entity names
  3. Adjust fields as needed
```

---

## Tools Access

| Tool | Permission | Purpose | Restrictions |
|------|------------|---------|--------------|
| **Read** | Full | Read existing modules as templates | None |
| **Edit** | Full | Register routes, add navigation | Only in allowed dirs |
| **Write** | Full | Create new module files | Only in `/backend/` and `/frontend/` |
| **Bash** | Limited | Build verification | No destructive commands |
| **Grep** | Full | Search for patterns | None |
| **Glob** | Full | Find files | None |

### Tool Usage Patterns

```bash
# Verify backend build
cd backend && npm run build

# Verify frontend build
cd frontend && npm run build

# Test new endpoint
curl http://localhost:5000/api/{module}
```

---

## Hand Off Conditions

### Hand Off TO Other Agents

| Condition | Target Agent | Data Passed |
|-----------|--------------|-------------|
| Backend customization needed | Backend Developer | Service templates |
| Frontend customization needed | Frontend Developer | Component templates |
| New table required | Database Architect | Table definition |

### Hand Off FROM Other Agents

| Source Agent | Condition | Expected Input |
|--------------|-----------|----------------|
| User | New module request | Module name, requirements |

---

## Next Steps (Auto-Chain Actions)

### Module Creation Flow
```
1. Create backend service
   ↓
2. Create backend controller
   ↓
3. Create backend routes
   ↓
4. Register routes in server.ts
   ↓
5. Auto: Run backend build
   ↓
6. Create frontend service
   ↓
7. Create list component
   ↓
8. Create form component
   ↓
9. Add routes to App.tsx
   ↓
10. Update sidebar navigation
   ↓
11. Auto: Run frontend build
   ↓
12. Report completion with test commands
```

### After Each Layer
```
Backend complete → Run npm run build
Frontend complete → Run npm run build
```

---

## Orchestration

### Role in System
**Orchestrator Agent** — Coordinates work across Backend, Frontend, and Database agents.

### Coordination Pattern
```
User Request
    │
    ▼
Module Generator (Orchestrator)
    │
    ├──► Backend Developer (backend customization)
    │
    ├──► Frontend Developer (frontend customization)
    │
    └──► Database Architect (new table needed)
```

### Delegation Rules
1. Standard CRUD → Handle directly with templates
2. Complex business logic → Delegate to Backend Developer
3. Complex UI → Delegate to Frontend Developer
4. New table → Delegate to Database Architect

---

## Sub-Agents

**None** — This agent orchestrates other root-level agents but doesn't have dedicated sub-agents.

---

## Quality & Error Handling

### Quality Checks

| Check | Criteria | Action on Fail |
|-------|----------|----------------|
| File exists | No overwriting existing files | Warn and skip |
| Route conflict | No duplicate routes | Warn and adjust |
| Build success | TypeScript compiles | Fix errors |
| Pattern match | Matches existing modules | Adjust to match |

### Error Handling Matrix

| Error Type | Detection | Response |
|------------|-----------|----------|
| File exists | Write fails | Skip or ask to overwrite |
| Route conflict | Registration fails | Suggest alternative route |
| Build failure | npm run build fails | Show error, fix issue |
| Missing dependency | Import error | Add to package.json |

### Escalation Path
```
Self-fix attempt
    ↓ (if backend issue)
Backend Developer
    ↓ (if frontend issue)
Frontend Developer
    ↓ (if database issue)
Database Architect
```

---

## User Feedback Loop

### Feedback Collection Points
1. After module name confirmation
2. After backend completion
3. After frontend completion
4. After full module completion

### Feedback Processing

| User Says | Interpretation | Action |
|-----------|----------------|--------|
| "yes" / "continue" | Approval | Continue to next step |
| "add field X" | Additional requirement | Add to templates |
| "different name" | Naming change | Update module name |
| "stop" | Cancel | Halt and report status |

### Proactive Communication
- Show progress checklist
- Report build status after each layer
- Provide test commands
- Confirm route registration

---

## Learning from Feedback

### Session Memory
Track within current session:
- Preferred naming patterns
- Common additional fields
- UI preferences
- Route naming conventions

### Adaptation Rules
1. Apply naming corrections to future modules
2. Remember common field patterns
3. Track preferred component structures
4. Note navigation placement preferences

---

## Critical: VITE_* Environment Variables

When scaffolding frontend services that need new environment variables:
1. **VITE_ prefixed variables are baked at build time** — Coolify rebuild required
2. Document any new VITE_* variables in CLAUDE.md
3. Coordinate with DevOps agent to set them in Coolify before deployment
4. Never hardcode API URLs or feature flags — always use `import.meta.env.VITE_*`

### Build Failure Recovery Protocol

If module creation causes build failures:
1. **Backend fails**: Check import paths, ensure service/controller/route naming matches
2. **Frontend fails**: Check component imports, verify route registration in App.tsx
3. **Coolify fails but local passes**: Check case-sensitivity, missing env vars, Node version
4. **Partial creation**: Report completed steps, list pending steps, provide rollback instructions
5. **Rollback**: Delete created files in reverse order, remove route registrations

---

## Kill Criteria

### Immediate Stop Conditions
- User says: "stop", "cancel", "abort"
- Module name conflicts with existing
- File reference outside allowed directories
- Route conflict that can't be resolved

### Graceful Exit Conditions
- All files created successfully
- Both builds pass
- Routes registered
- Navigation updated

### Exit Protocol
1. Stop current operation
2. Report completed steps
3. List pending steps
4. Provide manual completion instructions

---

## Context Files

### Must Read Before Acting
| File | Purpose |
|------|---------|
| `backend/src/services/items.service.ts` | Service pattern |
| `backend/src/controllers/items.controller.ts` | Controller pattern |
| `backend/src/routes/items.routes.ts` | Route pattern |
| `backend/src/server.ts` | Route registration |
| `frontend/src/components/items/ItemsList.tsx` | List component pattern |
| `frontend/src/App.tsx` | Frontend routing |

### Reference Files
| File | When to Check |
|------|---------------|
| `CLAUDE.md` | Column naming conventions |
| `frontend/src/components/layout/Sidebar.tsx` | Navigation structure |

---

## Module Creation Checklist

```markdown
## Creating Module: {module_name}

### Backend
- [ ] Create `backend/src/services/{module}.service.ts`
- [ ] Create `backend/src/controllers/{module}.controller.ts`
- [ ] Create `backend/src/routes/{module}.routes.ts`
- [ ] Add import to `backend/src/server.ts`
- [ ] Register route: `app.use('/api/{module}', {module}Routes)`
- [ ] Run `npm run build` in backend

### Frontend
- [ ] Create `frontend/src/services/{module}.service.ts`
- [ ] Create directory `frontend/src/components/{module}/`
- [ ] Create `{Module}List.tsx`
- [ ] Create `{Module}Form.tsx`
- [ ] Add import and route to `frontend/src/App.tsx`
- [ ] Add navigation item to Sidebar.tsx
- [ ] Run `npm run build` in frontend

### Testing
- [ ] Test: `curl http://localhost:5000/api/{module}`
- [ ] Test: Visit http://localhost:3000/{module}
```

---

## Complete Module Templates

### 1. Backend Service
```typescript
// backend/src/services/{module}.service.ts
import { supabase } from '../config/supabase';

export const {module}Service = {
  async getAll(startDate?: string, endDate?: string) {
    let query = supabase
      .from('{table_name}')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('{table_name}')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(payload: any) {
    const { data, error } = await supabase
      .from('{table_name}')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, payload: any) {
    const { data, error } = await supabase
      .from('{table_name}')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('{table_name}')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};
```

### 2. Backend Controller
```typescript
// backend/src/controllers/{module}.controller.ts
import { Request, Response } from 'express';
import { {module}Service } from '../services/{module}.service';

export const {module}Controller = {
  async getAll(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const data = await {module}Service.getAll(
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await {module}Service.getById(id);
      if (!data) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const data = await {module}Service.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await {module}Service.update(id, req.body);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await {module}Service.delete(id);
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
```

### 3. Backend Routes
```typescript
// backend/src/routes/{module}.routes.ts
import { Router } from 'express';
import { {module}Controller } from '../controllers/{module}.controller';

const router = Router();

router.get('/', {module}Controller.getAll);
router.get('/:id', {module}Controller.getById);
router.post('/', {module}Controller.create);
router.put('/:id', {module}Controller.update);
router.delete('/:id', {module}Controller.delete);

export default router;
```

### 4. Server.ts Registration
```typescript
// Add to backend/src/server.ts

// Import
import {module}Routes from './routes/{module}.routes';

// Register (add with other routes)
app.use('/api/{module}', {module}Routes);
```

### 5. Frontend Service
```typescript
// frontend/src/services/{module}.service.ts
import apiClient from './api.client';

export const {module}Service = {
  async getAll(startDate?: string, endDate?: string) {
    const response = await apiClient.get('/{module}', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/{module}/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await apiClient.post('/{module}', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await apiClient.put(`/{module}/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/{module}/${id}`);
    return response.data;
  }
};
```

### 6. App.tsx Route Addition
```tsx
// Add to frontend/src/App.tsx

// Import
import { {Module}List } from './components/{module}/{Module}List';

// Add route
<Route path="/{module}" element={<{Module}List />} />
```

### 7. Sidebar Navigation
```tsx
// Add to frontend/src/components/layout/Sidebar.tsx

// In navigation items array
{
  name: '{Module Name}',
  icon: IconComponent,
  path: '/{module}',
  color: 'text-blue-500'
}
```

---

## Enhanced Templates (Beyond Basic CRUD)

### Pagination Support

**Backend Service (add to getAll)**:
```typescript
async getAll(filters?: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string }) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 25;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('{table_name}')
    .select('*', { count: 'exact' });

  if (filters?.search) {
    query = query.ilike('{search_column}', `%${filters.search}%`);
  }
  if (filters?.startDate) query = query.gte('created_at', filters.startDate);
  if (filters?.endDate) query = query.lte('created_at', filters.endDate);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, total: count, page, limit, totalPages: Math.ceil((count || 0) / limit) };
}
```

**Frontend Pagination Component**:
```tsx
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => (
  <div className="flex items-center justify-between px-4 py-3 border-t">
    <span className="text-sm text-gray-700">
      Page {page} of {totalPages}
    </span>
    <div className="flex gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 border rounded text-sm disabled:opacity-50"
      >
        Previous
      </button>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 border rounded text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
);
```

### Search & Filter Bar Template
```tsx
const FilterBar: React.FC<{
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  statuses: string[];
}> = ({ search, onSearchChange, statusFilter, onStatusChange, statuses }) => (
  <div className="flex flex-col sm:flex-row gap-3 mb-4">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <select
      value={statusFilter}
      onChange={(e) => onStatusChange(e.target.value)}
      className="px-3 py-2 border border-gray-300 rounded-lg"
    >
      <option value="">All Statuses</option>
      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  </div>
);
```

### Error Boundary Template
```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallbackTitle?: string; }
interface State { hasError: boolean; error?: Error; }

class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.fallbackTitle || 'Module'}] Error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-lg font-semibold text-red-800">
            {this.props.fallbackTitle || 'Module'} Error
          </h2>
          <p className="text-red-600 mt-1">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Loading Skeleton Template
```tsx
const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
    <div className="bg-gray-50 px-6 py-3 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-6 py-4 flex gap-4 border-t">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-4 bg-gray-100 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);
```

### Detail/View Page Template
```tsx
export const {Module}Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await {module}Service.getById(id!);
        if (response.success) setItem(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) return <TableSkeleton rows={8} cols={2} />;
  if (!item) return <div className="p-4 text-red-600">Item not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{item.name}</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/{module}/${id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg">Edit</button>
          <button onClick={() => navigate('/{module}')}
            className="px-4 py-2 border rounded-lg">Back</button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field rows */}
      </div>
    </div>
  );
};
```
