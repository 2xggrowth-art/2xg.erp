# DevOps & Team Collaboration Guide

## 2xG ERP — How Everything Works Together

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [How Coolify Deploys Your Code (No Docker Needed)](#2-how-coolify-deploys-your-code-no-docker-needed)
3. [What Your Team Needs to Know](#3-what-your-team-needs-to-know)
4. [CI/CD Pipeline — How Code Gets to Production](#4-cicd-pipeline--how-code-gets-to-production)
5. [Database Access & Security](#5-database-access--security)
6. [Role-Based Access Control](#6-role-based-access-control)
7. [Frontend Deployment — GitHub to Coolify](#7-frontend-deployment--github-to-coolify)
8. [Backend (API) Deployment — GitHub to Coolify](#8-backend-api-deployment--github-to-coolify)
9. [Self-Hosted Supabase — How It Works](#9-self-hosted-supabase--how-it-works)
10. [Environment Variables — Who Has Access to What](#10-environment-variables--who-has-access-to-what)
11. [Protecting Production Data](#11-protecting-production-data)
12. [Local Development Setup for Team Members](#12-local-development-setup-for-team-members)
13. [Deployment Checklist](#13-deployment-checklist)
14. [Troubleshooting](#14-troubleshooting)
15. [FAQ](#15-faq)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        DEVELOPER MACHINE                         │
│                                                                  │
│  VS Code → Write code → git push → GitHub                       │
│                                                                  │
│  NO Docker needed. NO special tools. Just Git + Node.js.         │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    GITHUB (2xggrowth-art/2xg.erp)                │
│                                                                  │
│  ┌─────────┐   ┌──────────┐   ┌───────────┐                    │
│  │  Jira   │◄──│  Branch  │──►│  Pull     │                    │
│  │ Linked  │   │  Created │   │  Request  │                    │
│  └─────────┘   └──────────┘   └─────┬─────┘                    │
│                                      │ Merged to main           │
└──────────────────────────────────────┼──────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              OVH CLOUD SERVER (51.195.46.40)                     │
│              Managed by COOLIFY (http://51.195.46.40:8000)       │
│                                                                  │
│  Coolify pulls code from GitHub → Builds with Nixpacks →        │
│  Deploys as Docker containers automatically                      │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │   FRONTEND     │  │    BACKEND     │  │    SUPABASE      │  │
│  │  erp.2xg.in   │  │ api.erp.2xg.in│  │  (Self-hosted)   │  │
│  │                │  │                │  │                  │  │
│  │  React + Vite  │  │  Express API   │  │  PostgreSQL DB   │  │
│  │  Static SPA    │  │  Node.js       │  │  Auth Service    │  │
│  │                │  │                │  │  REST API        │  │
│  │  Port 3000     │  │  Port 5000     │  │  Storage         │  │
│  │                │  │       │        │  │  Realtime        │  │
│  └────────────────┘  └───────┼────────┘  │  Studio          │  │
│                              │           │  (14 containers)  │  │
│                              └──────────►│                  │  │
│                            Reads/Writes  └──────────────────┘  │
│                                                                  │
│  ALL runs inside Docker containers on OVH.                       │
│  Developers do NOT need Docker locally.                          │
│  Coolify handles containerization automatically.                 │
└──────────────────────────────────────────────────────────────────┘
```

### Key Point

> **Developers do NOT need Docker installed.** Coolify uses **Nixpacks** to automatically detect your project type (Node.js), install dependencies, build, and containerize it. Your team just pushes code to GitHub — Coolify does the rest.

---

## 2. How Coolify Deploys Your Code (No Docker Needed)

### What Happens When Code is Pushed to `main`

```
1. Developer pushes to GitHub
        ↓
2. Coolify detects the push (polling or webhook)
        ↓
3. Coolify clones the repo from GitHub
        ↓
4. Nixpacks auto-detects: "This is a Node.js project"
        ↓
5. Nixpacks automatically:
   - Installs Node.js (correct version)
   - Runs `npm install`
   - Runs `npm run build`
   - Creates a Docker image (developers never see this)
        ↓
6. Coolify deploys the container with:
   - Environment variables injected
   - Domain/SSL configured (erp.2xg.in, api.erp.2xg.in)
   - Health checks running
        ↓
7. Old container is replaced with new one (zero-downtime)
```

### What is Nixpacks?

Nixpacks is what Coolify uses instead of Dockerfiles. It:
- Auto-detects your language (Node.js from `package.json`)
- Auto-detects your framework (Vite for frontend, Express for backend)
- Auto-generates a build plan
- Creates a Docker image behind the scenes

**Your team never writes or touches a Dockerfile.** Coolify + Nixpacks handles everything.

### What is Docker's Role?

Docker runs **on the server only**. Your applications run inside Docker containers on the OVH server, but:
- Developers **do NOT need Docker** on their machines
- Developers **never interact with Docker** directly
- Coolify manages all Docker containers automatically
- The self-hosted Supabase is a set of **14 Docker containers** managed by Coolify

---

## 3. What Your Team Needs to Know

### What Developers Need Installed (Local Machine)

| Tool | Required? | Why |
|------|-----------|-----|
| **Git** | Yes | Push/pull code |
| **Node.js 18+** | Yes | Run the project locally |
| **npm** | Yes | Install dependencies |
| **VS Code** | Recommended | Code editor |
| **Docker** | **NO** | Not needed for development |
| **Coolify CLI** | **NO** | Only admins access Coolify dashboard |

### What Developers Do NOT Need

- Docker Desktop
- Coolify account (only admin/lead needs this)
- Supabase credentials (only the server has these)
- SSH access to OVH server
- Any DevOps knowledge

### What Each Role Can Access

| Role | GitHub | Jira | Coolify | Supabase | OVH Server |
|------|--------|------|---------|----------|-------------|
| **Admin/Lead** | Full access | Full access | Full access | Full access | SSH access |
| **Senior Dev** | Push to branches, create PRs | Full access | View-only | Read-only (via API) | No access |
| **Junior Dev** | Push to branches, create PRs | Update assigned issues | No access | No access | No access |
| **QA/Tester** | Read-only | Update test issues | No access | No access | No access |

---

## 4. CI/CD Pipeline — How Code Gets to Production

### Current Setup: Manual Deploy via Coolify

Right now, Coolify pulls from GitHub when you manually trigger a deploy or restart. To set up **auto-deploy on push**, you have two options:

### Option A: Coolify Webhook (Recommended)

If the GitHub App is connected in Coolify, every push to `main` auto-triggers a build.

**Status:** The GitHub App registration had an issue earlier. To fix:
1. Go to Coolify → Sources → Delete the broken GitHub App
2. Re-create it following the steps in `JIRA_GITHUB_WORKFLOW.md`
3. Once connected, set the branch to `main` for auto-deploy

### Option B: GitHub Actions (Alternative)

If the GitHub App isn't working, add this workflow to trigger Coolify deployments:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Coolify

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Backend Deploy
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_API_TOKEN }}" \
            "http://51.195.46.40:8000/api/v1/applications/ws8swsow4wg88kwkswkkc48c/restart"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Frontend Deploy
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_API_TOKEN }}" \
            "http://51.195.46.40:8000/api/v1/applications/z8wwkcgs4koc00c044skw00w/restart"
```

**To set this up:**
1. In GitHub repo → Settings → Secrets → Actions
2. Add secret: `COOLIFY_API_TOKEN` = `1|PBW5ASHnKg5t7Si8aokhpiL9GXU50YQPOrgrDGojfd6b0710`
3. Push the workflow file to `main`
4. Every push to `main` will now auto-deploy both apps

### The Full CI/CD Flow

```
Developer creates branch (feature/ERP-123-new-feature)
    → Jira auto-moves to "In Progress"
        ↓
Developer pushes commits
    → Jira shows commits on the issue
        ↓
Developer creates Pull Request
    → Jira auto-moves to "In Review"
    → Team reviews code
        ↓
PR is approved and merged to main
    → Jira auto-moves to "Done"
    → GitHub Actions triggers Coolify deploy (if configured)
    → OR admin manually deploys from Coolify dashboard
        ↓
Coolify builds and deploys
    → Frontend live at https://erp.2xg.in
    → Backend live at https://api.erp.2xg.in
```

---

## 5. Database Access & Security

### How the Database Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend      │────►│   Backend API    │────►│  Supabase   │
│  (React SPA)    │ HTTP│  (Express)       │ SDK │ (PostgreSQL)│
│                 │     │                  │     │             │
│ NEVER talks to  │     │ Uses SERVICE     │     │ 32 tables   │
│ database        │     │ ROLE KEY         │     │ 151 rows    │
│ directly        │     │ (full access)    │     │             │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

### Who Can Access the Database?

| Who | Direct DB Access? | How They Access Data |
|-----|-------------------|---------------------|
| **Frontend** | **NEVER** | Calls backend API endpoints only |
| **Backend** | **YES** (via Supabase SDK) | Uses `SUPABASE_SERVICE_ROLE_KEY` |
| **Developers** | **NO** | Through the backend API or Supabase Studio (admin only) |
| **Admin** | **YES** | Via Supabase Studio in Coolify dashboard |

### The Service Role Key

The backend uses a **Service Role Key** which bypasses all Row Level Security (RLS). This means:
- The backend has **full read/write/delete** access
- The key is stored **only in Coolify environment variables**
- Developers **never see this key** in the codebase
- The key is **not in the GitHub repo** (it's in `.env` which is gitignored)

### Supabase Studio Access

Supabase Studio is a web UI for managing the database. Only admins should access it:
- **URL**: Via Coolify dashboard → 2xg-erp project → Supabase service → Studio
- **Who has access**: Only people with Coolify login credentials
- **What they can do**: View/edit/delete any data, run SQL, manage schema

---

## 6. Role-Based Access Control

### GitHub Branch Protection (Set This Up!)

Go to GitHub → `2xg.erp` → Settings → Branches → Add rule for `main`:

```
Branch: main
☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed
☑ Require status checks to pass before merging (if you add CI)
☑ Do not allow bypassing the above settings
☐ Allow force pushes (NEVER enable this)
☐ Allow deletions (NEVER enable this)
```

This ensures:
- **Nobody can push directly to `main`** (including admins)
- **Every change requires a PR with at least 1 approval**
- **Nobody can force-push or delete `main`**

### Coolify Access Levels

| Access Level | Who | What They Can Do |
|-------------|-----|------------------|
| **Root/Admin** | Project lead only | Full Coolify access, deploy, manage env vars, access Supabase Studio |
| **Team Members** | Create separate Coolify teams | View-only access to deployments and logs |
| **No Access** | Developers | Cannot access Coolify at all — they work through GitHub only |

**Recommendation:** Only 1-2 people (project lead + senior dev) should have Coolify admin access. Everyone else works through GitHub → PR → auto-deploy.

---

## 7. Frontend Deployment — GitHub to Coolify

### How It Works

```
GitHub (2xg-dashboard/frontend/)
    ↓ Coolify clones repo
Nixpacks detects: Vite + React project
    ↓
Runs: npm install
    ↓
Runs: npm run build (vite build)
    ↓
Output: dist/ folder (static HTML/CSS/JS)
    ↓
Serves via nginx inside Docker container
    ↓
Available at: https://erp.2xg.in
```

### Coolify Configuration

| Setting | Value |
|---------|-------|
| **Repository** | `https://github.com/2xggrowth-art/2xg.erp` |
| **Branch** | `main` |
| **Base Directory** | `/2xg-dashboard/frontend` |
| **Build Pack** | Nixpacks |
| **Port** | 3000 |
| **Domain** | `https://erp.2xg.in` |
| **Environment Variables** | `VITE_API_URL=https://api.erp.2xg.in/api` |

### What Developers Do

```bash
# Work on frontend
cd 2xg-dashboard/frontend

# Install dependencies
npm install

# Run locally
npm run dev
# Opens at http://localhost:3001

# Make changes, test locally, then push
git add 2xg-dashboard/frontend/
git commit -m "ERP-123 #comment Updated dashboard layout"
git push origin feature/ERP-123-dashboard-update

# Create PR → Get approval → Merge → Auto-deploys to erp.2xg.in
```

---

## 8. Backend (API) Deployment — GitHub to Coolify

### How It Works

```
GitHub (2xg-dashboard/backend/)
    ↓ Coolify clones repo
Nixpacks detects: Node.js + TypeScript project
    ↓
Runs: npm install
    ↓
Runs: npm run build (tsc - TypeScript compiler)
    ↓
Output: dist/ folder (compiled JavaScript)
    ↓
Runs: npm start (node dist/server.js)
    ↓
Express server starts on port 5000
    ↓
Available at: https://api.erp.2xg.in
```

### Coolify Configuration

| Setting | Value |
|---------|-------|
| **Repository** | `https://github.com/2xggrowth-art/2xg.erp` |
| **Branch** | `main` |
| **Base Directory** | `/2xg-dashboard/backend` |
| **Build Pack** | Nixpacks |
| **Port** | 5000 |
| **Domain** | `https://api.erp.2xg.in` |

### Environment Variables (Set in Coolify, NOT in code)

```
SUPABASE_URL=http://supabasekong-tskwww84oc0ww40sw8goww04.51.195.46.40.sslip.io
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1Q... (self-hosted key)
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://erp.2xg.in
```

**These are NEVER in the GitHub repo.** They exist only in Coolify.

---

## 9. Self-Hosted Supabase — How It Works

### What is it?

Supabase is a **full backend-as-a-service** that we self-host on OVH. It includes:

| Component | Docker Container | Purpose |
|-----------|-----------------|---------|
| **PostgreSQL** | `supabase-db` | The actual database (32 tables) |
| **Kong** | `supabase-kong` | API gateway (routes requests) |
| **PostgREST** | `supabase-rest` | Auto-generates REST API from DB schema |
| **GoTrue** | `supabase-auth` | Authentication service |
| **Realtime** | `realtime-dev` | WebSocket for live data updates |
| **Storage** | `supabase-storage` | File/image storage |
| **Studio** | `supabase-studio` | Web UI for database management |
| **MinIO** | `supabase-minio` | S3-compatible object storage |
| **Analytics** | `supabase-analytics` | Log analytics |
| **Meta** | `supabase-meta` | Database metadata API |
| **Edge Functions** | `supabase-edge-functions` | Serverless functions |
| **Supavisor** | `supabase-supavisor` | Connection pooling |
| **Vector** | `supabase-vector` | Log collection |
| **ImgProxy** | `imgproxy` | Image transformation |

### How It Runs

```
All 14 containers run on OVH server via Docker.
Coolify manages all containers automatically.
Developers NEVER interact with Docker.

Backend app (Express) connects to Supabase via:
  - SUPABASE_URL (internal network address)
  - SUPABASE_SERVICE_ROLE_KEY (full access key)
```

### Is It Docker or GitHub Actions?

**Answer: It's Docker, managed by Coolify. NOT GitHub Actions.**

- **Supabase** = 14 Docker containers on OVH (managed by Coolify)
- **Frontend** = 1 Docker container on OVH (built by Nixpacks via Coolify)
- **Backend** = 1 Docker container on OVH (built by Nixpacks via Coolify)
- **GitHub Actions** = Optional, only to trigger Coolify deploys (not for building)

Developers don't need Docker. Coolify is the orchestrator that runs Docker on the server.

---

## 10. Environment Variables — Who Has Access to What

### The Golden Rule

> **Secrets NEVER go in the code.** They live ONLY in Coolify environment variables.

### What Goes Where

| Variable | Where It Lives | Who Can See It |
|----------|---------------|----------------|
| `SUPABASE_URL` | Coolify (backend app) | Coolify admin only |
| `SUPABASE_SERVICE_ROLE_KEY` | Coolify (backend app) | Coolify admin only |
| `PORT` | Coolify (backend app) | Coolify admin only |
| `NODE_ENV` | Coolify (backend app) | Coolify admin only |
| `FRONTEND_URL` | Coolify (backend app) | Coolify admin only |
| `VITE_API_URL` | Coolify (frontend app) | Coolify admin only |
| `COOLIFY_API_TOKEN` | GitHub Secrets | GitHub admin only |

### For Local Development

Developers create their own `.env` file locally (it's in `.gitignore`, never pushed):

```bash
# backend/.env (LOCAL DEVELOPMENT ONLY)
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://ulubfvmxtqmsoyumdwvg.supabase.co    # Can use hosted Supabase for dev
SUPABASE_SERVICE_ROLE_KEY=<ask admin for dev key>
```

```bash
# frontend/.env (LOCAL DEVELOPMENT ONLY)
VITE_API_URL=http://localhost:5000/api
```

---

## 11. Protecting Production Data

### Preventing Accidental Data Deletion

#### 1. GitHub Branch Protection (Prevents Bad Code Reaching Production)

Set up on GitHub → Settings → Branches → `main`:
- Require PR with 1+ approval before merge
- No force pushes
- No branch deletion

#### 2. Code Review Checklist for Database Changes

Before approving any PR that touches database operations, check:

```
☐ No DELETE operations without WHERE clause
☐ No DROP TABLE statements
☐ No TRUNCATE operations
☐ UPDATE operations have proper WHERE conditions
☐ New migrations are additive (add columns, don't remove)
☐ Bulk operations have LIMIT clauses
☐ No raw SQL queries (use Supabase SDK)
```

#### 3. Supabase Row Level Security (RLS)

Add RLS policies to prevent data deletion at the database level:

```sql
-- Example: Prevent deletion of invoices that are not in draft status
CREATE POLICY "prevent_delete_non_draft_invoices" ON invoices
  FOR DELETE
  USING (status = 'draft');

-- Example: Prevent any deletion on organizations table
CREATE POLICY "no_delete_organizations" ON organizations
  FOR DELETE
  USING (false);
```

#### 4. Database Backups

Set up automated backups in Coolify:

```bash
# Add a cron job on the OVH server to backup PostgreSQL daily
# SSH into OVH server, then:
crontab -e

# Add this line (backs up at 2 AM daily):
0 2 * * * docker exec supabase-db pg_dump -U postgres > /backups/2xg-erp-$(date +\%Y\%m\%d).sql
```

#### 5. API-Level Protection

The backend should validate all destructive operations:

```typescript
// Example: Soft delete instead of hard delete
app.delete('/api/invoices/:id', async (req, res) => {
  // DON'T: supabase.from('invoices').delete().eq('id', id)
  // DO: Mark as deleted instead
  await supabase.from('invoices')
    .update({ status: 'deleted', deleted_at: new Date() })
    .eq('id', id);
});
```

---

## 12. Local Development Setup for Team Members

### Step-by-Step for a New Developer

```bash
# 1. Clone the repo
git clone https://github.com/2xggrowth-art/2xg.erp.git
cd 2xg.erp

# 2. Setup backend
cd 2xg-dashboard/backend
npm install
# Create .env file (ask admin for Supabase dev credentials)
cp .env.example .env
# Edit .env with provided credentials
npm run dev
# Backend running at http://localhost:5000

# 3. Setup frontend (in a new terminal)
cd 2xg-dashboard/frontend
npm install
# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm run dev
# Frontend running at http://localhost:3001
```

### What They DON'T Need

- ❌ Docker Desktop
- ❌ Coolify CLI or account
- ❌ SSH keys for OVH server
- ❌ Production Supabase credentials
- ❌ Any DevOps tools

### What They DO Need

- ✅ Git
- ✅ Node.js 18+ and npm
- ✅ A code editor (VS Code recommended)
- ✅ GitHub account (added to `2xggrowth-art` org)
- ✅ Jira account (for issue tracking)
- ✅ Development Supabase credentials (from admin)

---

## 13. Deployment Checklist

### Before Merging a PR

```
☐ Code compiles without errors (npm run build)
☐ No TypeScript errors (npm run build:check for frontend)
☐ Tested locally with real data
☐ No hardcoded URLs or secrets in code
☐ Database migrations are additive (no destructive changes)
☐ CORS config updated if new domains added
☐ Environment variables documented if new ones added
☐ PR description includes Jira issue key
☐ At least 1 team member approved the PR
```

### After Merging to Main

```
☐ Verify Coolify triggered a build (or trigger manually)
☐ Check build logs in Coolify for errors
☐ Test https://erp.2xg.in loads correctly
☐ Test https://api.erp.2xg.in/api/health returns OK
☐ Verify Jira issue moved to "Done"
☐ Notify team in Slack/Teams of deployment
```

### If Build Fails

```
1. Check Coolify build logs
2. Common issues:
   - TypeScript compilation error → Fix in code, push again
   - npm install failure → Check package.json, clear cache
   - Port conflict → Check Coolify app port config
   - Environment variable missing → Add in Coolify dashboard
3. Roll back: Coolify keeps previous builds, redeploy last working version
```

---

## 14. Troubleshooting

### "My changes aren't showing on erp.2xg.in"

1. Did you merge your PR to `main`? (Check GitHub)
2. Did Coolify trigger a build? (Check Coolify dashboard)
3. Is the build passing? (Check Coolify build logs)
4. Clear browser cache / hard refresh (Ctrl+Shift+R)

### "API returns 500 error"

1. Check Coolify backend logs
2. Verify environment variables are set correctly
3. Check if Supabase service is running (Coolify → Services)
4. Test health endpoint: `curl https://api.erp.2xg.in/api/health`

### "CORS error in browser"

1. Check `FRONTEND_URL` env var in Coolify matches the frontend domain
2. Verify CORS config in `backend/src/server.ts` includes the new domain
3. Redeploy backend after changes

### "Database connection error"

1. Check Supabase service status in Coolify (all containers should be green/healthy)
2. Verify `SUPABASE_URL` env var in backend app
3. Verify `SUPABASE_SERVICE_ROLE_KEY` env var
4. Restart Supabase service in Coolify if needed

---

## 15. FAQ

### Q: Do developers need Docker?
**A: No.** Docker runs on the OVH server only. Coolify manages it. Developers just need Git + Node.js.

### Q: Who can access the production database?
**A:** Only the backend API (via service role key) and Coolify admins (via Supabase Studio). Developers cannot access the production database directly.

### Q: Can a developer delete production data?
**A:** Not directly. They can only write code that the backend executes. With branch protection + PR reviews, destructive code changes are caught before reaching production. Add RLS policies and soft deletes for extra safety.

### Q: What if someone pushes bad code to main?
**A:** With branch protection rules, nobody can push directly to `main`. All changes go through PRs with required reviews. If bad code does get through, Coolify keeps previous builds — you can roll back instantly.

### Q: Are we using GitHub Actions?
**A:** Not yet. Currently Coolify polls GitHub or is manually triggered. Adding the GitHub Actions workflow in Section 4 enables auto-deploy on push to `main`.

### Q: Do we still need Vercel?
**A:** No. The project previously used Vercel, and the configs still exist in the repo. Now everything runs on OVH via Coolify. You can remove the Vercel configs if you want:
- `2xg-dashboard/backend/vercel.json`
- `2xg-dashboard/vercel.json`
- `2xg-dashboard/backend/api/index.js` (Vercel serverless entry)

### Q: How do I add a new environment variable?
**A:** Only Coolify admins can add env vars:
1. Go to Coolify dashboard → Projects → 2xg-erp
2. Click the app (frontend or backend)
3. Go to Environment Variables tab
4. Add the new variable
5. Redeploy the app

### Q: What happens if the OVH server goes down?
**A:** Everything goes down (frontend, backend, database). Consider:
- Setting up automated database backups to external storage
- Monitoring with uptime services (UptimeRobot, etc.)
- Having a disaster recovery plan

### Q: How do I access Supabase Studio?
**A:** Go to Coolify → Projects → 2xg-erp → Supabase service → Click on supabase-studio → Open the FQDN URL. Only Coolify admins have access.

---

## Summary Table

| Component | Technology | Hosted On | Managed By | Developers Need? |
|-----------|-----------|-----------|------------|-----------------|
| Code | TypeScript | GitHub | Team via PRs | Yes (Git) |
| Issues | Jira | Atlassian Cloud | Team | Yes (Jira account) |
| Frontend | React + Vite | OVH Docker | Coolify (Nixpacks) | No Docker needed |
| Backend | Express + Node | OVH Docker | Coolify (Nixpacks) | No Docker needed |
| Database | PostgreSQL | OVH Docker | Coolify (Supabase) | No access needed |
| CI/CD | GitHub Actions | GitHub | Admin | No setup needed |
| SSL | Let's Encrypt | OVH | Coolify (auto) | No setup needed |
| DNS | A Records | Domain registrar | Admin | No setup needed |

---

*Last updated: January 28, 2026*
*Maintained by 2xG Growth Team*
