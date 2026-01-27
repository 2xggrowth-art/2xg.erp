# 🎯 Agent Selector - Quick Decision Tree

## "Which agent should I use?"

```
START: What are you working on?
│
├─ 🏗️ Adding a NEW module/feature to 2xg-dashboard?
│   └─→ Agent 6: MODULE GENERATOR
│       Examples:
│       - "Add Reports module"
│       - "Create Expenses tracking"
│       - "Build Employee attendance"
│
├─ 🔧 Fixing/building BACKEND (Express API)?
│   └─→ Agent 1: BACKEND API DEVELOPER
│       Examples:
│       - "Sales endpoint returning wrong data"
│       - "Add new filter to logistics API"
│       - "Fix controller validation"
│
├─ 🎨 Fixing/building FRONTEND (React UI)?
│   └─→ Agent 2: FRONTEND REACT DEVELOPER
│       Examples:
│       - "Dashboard not responsive"
│       - "Add loading spinner to charts"
│       - "Fix date picker styling"
│
├─ 🗄️ Working with DATABASE (Supabase/PostgreSQL)?
│   └─→ Agent 3: DATABASE ARCHITECT
│       Examples:
│       - "Add new table for vendors"
│       - "Optimize sales query"
│       - "Create database migration"
│
├─ 🚴 Working on BUILDLINE-PRO (Assembly tracking)?
│   └─→ Agent 4: BUILDLINE ASSEMBLY SPECIALIST
│       Examples:
│       - "Bulk inward CSV parsing broken"
│       - "Technician assignment not working"
│       - "Add new assembly stage"
│
└─ 🚀 DEPLOYMENT issues (Vercel/CORS)?
    └─→ Agent 5: DEVOPS & DEPLOYMENT ENGINEER
        Examples:
        - "Items not loading in production"
        - "CORS error in console"
        - "Environment variables not working"
```

---

## By Symptom/Error

### "Items not loading" or "Network error"
→ **Agent 5: DevOps** (CORS/deployment issue)

### "Database connection failed" or "Query error"
→ **Agent 3: Database Architect** (database issue)

### "Component not rendering" or "React error"
→ **Agent 2: Frontend Developer** (UI issue)

### "API endpoint 500 error" or "Service error"
→ **Agent 1: Backend Developer** (API issue)

### "Bulk operation failing" or "CSV upload broken"
→ **Agent 4: Buildline Specialist** (buildline-pro issue)

### "Want to add new feature"
→ **Agent 6: Module Generator** (full-stack scaffolding)

---

## By File Location

### Working in `2xg-dashboard/backend/`
- `src/services/` → **Agent 1: Backend Developer**
- `src/controllers/` → **Agent 1: Backend Developer**
- `src/routes/` → **Agent 1: Backend Developer**
- `src/utils/database-schema.sql` → **Agent 3: Database Architect**
- `vercel.json` → **Agent 5: DevOps**

### Working in `2xg-dashboard/frontend/`
- `src/components/` → **Agent 2: Frontend Developer**
- `src/services/` → **Agent 2: Frontend Developer**
- `src/contexts/` → **Agent 2: Frontend Developer**
- `tailwind.config.js` → **Agent 2: Frontend Developer**

### Working in `buildline-pro/`
- `app/` → **Agent 4: Buildline Specialist**
- `components/` → **Agent 4: Buildline Specialist**
- `app/api/` → **Agent 4: Buildline Specialist**
- `supabase/migrations/` → **Agent 4: Buildline Specialist** (or **Agent 3** for complex queries)

### Creating NEW module
- Any new feature → **Agent 6: Module Generator**

---

## By Task Type

| Task | Agent | Why |
|------|-------|-----|
| Add new dashboard module | **Module Generator** | Scaffolds entire module |
| Fix API endpoint | **Backend Developer** | API expertise |
| Update UI styling | **Frontend Developer** | React/Tailwind expertise |
| Modify database schema | **Database Architect** | Schema design |
| Deploy to Vercel | **DevOps Engineer** | Deployment expertise |
| Fix buildline bulk inward | **Buildline Specialist** | Buildline-pro expertise |
| Optimize query performance | **Database Architect** | Query optimization |
| Add authentication | **Backend Developer** + **Frontend Developer** | Full-stack feature |
| Debug CORS error | **DevOps Engineer** | Deployment config |
| Create new component | **Frontend Developer** | React components |

---

## Multi-Agent Workflows

Some tasks require multiple agents in sequence:

### Adding a Complete New Module
1. **Database Architect**: Design tables and schema
2. **Module Generator**: Scaffold full-stack module
3. **Frontend Developer**: Customize UI/UX
4. **DevOps Engineer**: Deploy to production

### Fixing Production Bug
1. **DevOps Engineer**: Identify deployment vs code issue
2. **Backend/Frontend Developer**: Fix the code
3. **DevOps Engineer**: Redeploy with fix

### Database Migration
1. **Database Architect**: Create migration SQL
2. **Backend Developer**: Update services/controllers
3. **Frontend Developer**: Update UI for new fields
4. **Module Generator**: If adding entire new module

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│                   AGENT SELECTOR                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Backend API     →  Agent 1  (Express, Services)        │
│  Frontend UI     →  Agent 2  (React, Components)        │
│  Database        →  Agent 3  (Supabase, SQL)            │
│  Buildline-Pro   →  Agent 4  (Next.js, Assembly)        │
│  Deployment      →  Agent 5  (Vercel, CORS)             │
│  New Module      →  Agent 6  (Full-stack scaffold)      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Still Not Sure?

### Ask These Questions:

1. **Where is the code?**
   - `2xg-dashboard/backend/` → Agent 1
   - `2xg-dashboard/frontend/` → Agent 2
   - `buildline-pro/` → Agent 4
   - Database/Supabase → Agent 3
   - Vercel/deployment → Agent 5

2. **What am I trying to do?**
   - Add new feature → Agent 6
   - Fix existing code → Depends on location (see above)
   - Deploy/debug production → Agent 5

3. **What technology?**
   - Express/Node.js → Agent 1
   - React/Vite → Agent 2
   - PostgreSQL/Supabase → Agent 3
   - Next.js (buildline) → Agent 4
   - Vercel → Agent 5

---

## When to Switch Agents

Start with one agent, they'll tell you if you need another:

**Example 1**:
- Start: Agent 2 (Frontend) - "Dashboard chart not showing"
- Switch: Agent 1 (Backend) - "API returning empty data"
- Switch: Agent 3 (Database) - "Query missing WHERE clause"

**Example 2**:
- Start: Agent 6 (Module Generator) - "Add HR module"
- Continue: Agent 3 (Database) - "Need custom table structure"
- Continue: Agent 2 (Frontend) - "Custom UI components needed"

---

## Pro Tip: Just Ask!

If you're still unsure, just describe what you want to do:

❌ Wrong: "Which agent?"
✅ Right: "I want to add employee time tracking to the dashboard"

I'll automatically:
1. Identify this needs **Agent 6 (Module Generator)**
2. Use their full context and templates
3. Scaffold the complete module
4. Follow all established patterns

---

**Quick Start**: See `.claude/AGENTS_QUICK_START.md` for detailed examples
**Full Agents**: See `.claude/agents.md` for complete agent instructions
