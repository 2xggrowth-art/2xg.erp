# Agents Quick Start Guide

## 🤖 Available Agents

This project has **6 specialized agents**, each with deep knowledge of their domain:

| Agent | Use When | Key Expertise |
|-------|----------|---------------|
| **1. Backend API Developer** | Building/fixing backend endpoints | Express, Controllers, Services, Supabase queries |
| **2. Frontend React Developer** | Building/fixing UI components | React, Tailwind, API integration, routing |
| **3. Database Architect** | Database design, queries, migrations | PostgreSQL, Supabase, schema design, RLS |
| **4. Buildline Assembly Specialist** | Working on buildline-pro | Next.js, bulk operations, error handling |
| **5. DevOps & Deployment Engineer** | Deployment issues, CORS errors | Vercel, serverless, environment variables |
| **6. Module Generator** | Adding new features to 2xg-dashboard | Full-stack module scaffolding |

---

## 📋 Common Scenarios

### Scenario 1: "Items not loading in production"
**Use**: Agent 5 (DevOps & Deployment Engineer)
**Why**: This is a CORS/deployment issue
**What they'll do**: Check CORS configuration in both `server.ts` and `vercel.json`, verify environment variables

### Scenario 2: "Add new inventory module to dashboard"
**Use**: Agent 6 (Module Generator)
**Why**: Creating a complete new feature end-to-end
**What they'll do**: Scaffold backend service, controller, routes, frontend service, component, and routing

### Scenario 3: "Bulk inward not validating CSV properly"
**Use**: Agent 4 (Buildline Assembly Specialist)
**Why**: This is buildline-pro specific feature
**What they'll do**: Fix validation logic in BulkInwardModal.tsx, update API route

### Scenario 4: "Need to add new field to sales_transactions table"
**Use**: Agent 3 (Database Architect)
**Why**: Database schema changes
**What they'll do**: Create migration SQL, update TypeScript types, modify queries

### Scenario 5: "ERP dashboard showing wrong sales total"
**Use**: Agent 1 (Backend API Developer)
**Why**: Backend business logic issue
**What they'll do**: Check service layer, fix Supabase query, verify controller response

### Scenario 6: "Date filter not updating all modules"
**Use**: Agent 2 (Frontend React Developer)
**Why**: React state management issue
**What they'll do**: Check DateFilterContext, verify component subscriptions

---

## 🎯 How to Invoke an Agent

### Option 1: In Conversation
Simply mention which agent you need:
```
"Hey Backend API Developer agent, I need help with the sales endpoint"
"Database Architect agent, how do I query shipments by date range?"
```

### Option 2: Read the Agent File
Each agent's full context is in `.claude/agents.md` - you can reference specific sections:
```
"Following Agent 6 (Module Generator) instructions, let's add a new Expenses module"
```

### Option 3: Describe the Task
Just describe what you're doing and I'll automatically use the right agent:
```
"I need to deploy the backend to Vercel"  → I'll use Agent 5
"The technician assignment modal is broken" → I'll use Agent 4
"Build a new Reports module" → I'll use Agent 6
```

---

## 🚀 Getting Started

### For New Features:
1. **Planning**: Which agent should handle this?
2. **Context**: Read the relevant agent's section in `.claude/agents.md`
3. **Execute**: Follow the agent's guidelines and patterns
4. **Test**: Use the agent's testing commands

### For Bug Fixes:
1. **Identify**: Where is the issue? (Frontend, Backend, Database, Deployment)
2. **Select Agent**: Use the appropriate specialist
3. **Investigate**: Follow the agent's diagnostic steps
4. **Fix**: Apply the agent's best practices

### For Questions:
Just ask! I'll automatically route to the right agent based on context.

---

## 📖 Agent Knowledge Base

Each agent knows:
- ✅ **Their specific codebase area** (files, structure, patterns)
- ✅ **Common commands** they use
- ✅ **Architecture patterns** they follow
- ✅ **Best practices** for their domain
- ✅ **Common issues** and how to fix them
- ✅ **Testing strategies** for their work

They DON'T know:
- ❌ Areas outside their expertise (they'll refer you to another agent)
- ❌ Your specific business logic (you'll need to provide context)

---

## 💡 Pro Tips

### Tip 1: Use the Right Agent
Don't ask the Frontend agent about database queries - use the Database Architect agent instead.

### Tip 2: Provide Context
Even though agents have project knowledge, provide specifics:
- "In the ERP module, the sales chart..." (better)
- "The chart is broken" (too vague)

### Tip 3: Follow Their Patterns
Each agent follows established patterns in the codebase. Trust their guidance on structure and conventions.

### Tip 4: Chain Agents
For full-stack features:
1. Database Architect: Design schema
2. Backend API Developer: Build endpoints
3. Frontend React Developer: Build UI
4. DevOps Engineer: Deploy

### Tip 5: Use Module Generator for Speed
Don't manually create all files - use Agent 6 to scaffold the entire module at once.

---

## 🔄 Agent Handoffs

Agents know when to refer you to another specialist:

**Backend API Developer** might say:
> "This requires database schema changes. Let me hand you off to the Database Architect agent..."

**Frontend React Developer** might say:
> "The API endpoint is returning errors. The Backend API Developer agent should investigate..."

**DevOps Engineer** might say:
> "The code is correct, but the CORS configuration needs updating. I'll handle this..."

---

## 📚 Full Agent Details

For complete agent instructions, context, and templates, see:
**`.claude/agents.md`**

Each agent section includes:
- Full context and role description
- Architecture patterns they follow
- Files they work with
- Common commands
- Code templates
- Best practices
- Testing strategies

---

## ❓ When in Doubt

Just describe what you're trying to do, and I'll:
1. Identify the right agent
2. Use their context and expertise
3. Provide specific guidance
4. Follow the established patterns

**Example**:
> "I want to track employee attendance in the dashboard"

I'll use **Agent 6 (Module Generator)** to scaffold a complete Attendance module following the exact same pattern as existing modules (ERP, Logistics, CARE, CRM).

---

Happy coding! 🚀
