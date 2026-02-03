# 2XG ERP Agent System

This directory contains comprehensive agent specifications for the 2XG ERP project. Each agent file defines complete orchestration criteria including triggers, tools, handoffs, and quality controls.

---

## Agent Index

| # | Agent | Type | File | Purpose |
|---|-------|------|------|---------|
| 1 | Backend API Developer | Worker | [01-backend-api-developer.md](01-backend-api-developer.md) | Express.js + TypeScript REST APIs |
| 2 | Frontend React Developer | Worker | [02-frontend-react-developer.md](02-frontend-react-developer.md) | React 18 + Tailwind components |
| 3 | Database Architect | Support | [03-database-architect.md](03-database-architect.md) | Supabase PostgreSQL schema |
| 4 | Buildline Assembly Specialist | Independent | [04-buildline-assembly-specialist.md](04-buildline-assembly-specialist.md) | Next.js assembly tracking |
| 5 | DevOps & Deployment Engineer | Support | [05-devops-deployment-engineer.md](05-devops-deployment-engineer.md) | Coolify deployment, CORS |
| 6 | Module Generator | Orchestrator | [06-module-generator.md](06-module-generator.md) | Scaffold complete ERP modules |
| 7 | PR Review Agent | Gatekeeper | [07-pr-review-agent.md](07-pr-review-agent.md) | Code review, pre-merge validation |
| 8 | Frontend UI Agent | Specialist Orchestrator | [08-frontend-ui-agent.md](08-frontend-ui-agent.md) | Responsive design coordination |
| 8.1 | └─ Mobile View Sub-Agent | Sub-Agent | [08a-mobile-view-sub-agent.md](08a-mobile-view-sub-agent.md) | Mobile optimization (320px-768px) |
| 8.2 | └─ Website Desktop Sub-Agent | Sub-Agent | [08b-website-desktop-sub-agent.md](08b-website-desktop-sub-agent.md) | Desktop optimization (1024px+) |

---

## Agent Types

### Worker Agents
Execute specific tasks within their domain.
- Backend API Developer
- Frontend React Developer

### Support Agents
Provide specialized assistance when called.
- Database Architect
- DevOps & Deployment Engineer

### Orchestrator Agents
Coordinate work across multiple agents.
- Module Generator
- Frontend UI Agent

### Gatekeeper Agents
Validate work before deployment.
- PR Review Agent

### Independent Agents
Work autonomously with minimal coordination.
- Buildline Assembly Specialist

### Sub-Agents
Work under parent agents for specialized tasks.
- Mobile View Sub-Agent (under Frontend UI Agent)
- Website Desktop Sub-Agent (under Frontend UI Agent)

---

## Agent Orchestration Diagram

```
                    ┌──────────────────┐
                    │   User Request   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Agent Selector  │
                    │  (Router Layer)  │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌────────▼────────┐   ┌──────▼──────┐
│ Module        │   │ PR Review       │   │ Task-       │
│ Generator     │   │ Agent           │   │ Specific    │
│ (Orchestrator)│   │ (Gatekeeper)    │   │ Agents      │
└───────┬───────┘   └─────────────────┘   └──────┬──────┘
        │                                        │
        ▼                                        ▼
┌───────────────────────────────────────────────────────────┐
│                    Worker Agents                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │Backend  │  │Frontend │  │Database │  │Frontend UI  │   │
│  │API Dev  │  │React Dev│  │Architect│  │Agent        │   │
│  └─────────┘  └─────────┘  └─────────┘  └──────┬──────┘   │
│                                                │           │
│                                    ┌───────────┼───────┐   │
│                                    │           │       │   │
│                                    ▼           ▼       │   │
│                              ┌─────────┐ ┌─────────┐   │   │
│                              │Mobile   │ │Website  │   │   │
│                              │View     │ │Desktop  │   │   │
│                              │Sub-Agent│ │Sub-Agent│   │   │
│                              └─────────┘ └─────────┘   │   │
│                                                        │   │
└───────────────────────────────────────────────────────────┘
        │                                        │
        ▼                                        ▼
┌───────────────────────────────────────────────────────────┐
│                    Support Agents                          │
│  ┌─────────────────┐          ┌─────────────────────┐     │
│  │ DevOps &        │          │ Buildline Assembly  │     │
│  │ Deployment      │          │ Specialist          │     │
│  └─────────────────┘          └─────────────────────┘     │
└───────────────────────────────────────────────────────────┘
```

---

## Criteria Documented Per Agent

Each agent file contains comprehensive documentation for:

| Criteria | Description |
|----------|-------------|
| **Trigger Conditions** | Keywords, file contexts, task types that activate the agent |
| **Objective** | Primary goals and success criteria |
| **Output Style** | Code format, response format, verbosity level |
| **Thinking Style** | Decision-making approach, frameworks used |
| **Tools Access** | Which tools available with what permissions |
| **Hand Off** | When to delegate to other agents, what data to pass |
| **Next Steps** | Auto-chained actions after task completion |
| **Orchestration** | Role in the agent system, coordination patterns |
| **Sub-Agents** | Child agents managed (if any) |
| **Quality & Error Handling** | Checks performed, error responses |
| **User Feedback Loop** | How feedback is collected and processed |
| **Learning from Feedback** | Session memory, adaptation rules |
| **Kill Criteria** | When to stop execution |

---

## Quick Reference: Which Agent for What Task

| Task | Primary Agent | May Involve |
|------|---------------|-------------|
| Create new API endpoint | Backend API Developer | Database Architect |
| Build React component | Frontend React Developer | - |
| Fix database schema | Database Architect | Backend API Developer |
| Deploy to production | DevOps Engineer | - |
| Create new ERP module | Module Generator | All worker agents |
| Review code changes | PR Review Agent | Any affected agent |
| Make UI responsive | Frontend UI Agent | Mobile/Desktop Sub-Agents |
| Fix mobile layout | Mobile View Sub-Agent | - |
| Add hover states | Website Desktop Sub-Agent | - |
| Buildline-pro features | Buildline Assembly Specialist | Database Architect |

---

## Related Files

- [AGENTS_COMPREHENSIVE.md](../AGENTS_COMPREHENSIVE.md) — Overview document with all agents summary
- [commands/](../commands/) — Slash command implementations

---

## Usage

These agent specifications are designed to:

1. **Guide Claude Code** on which specialized context to use
2. **Document orchestration patterns** for multi-agent tasks
3. **Define quality standards** for each domain
4. **Enable hand-offs** between agents with clear data contracts
5. **Provide templates** for common tasks in each domain

Each agent file can be read by Claude Code to understand its role, capabilities, and constraints when working on relevant tasks.
