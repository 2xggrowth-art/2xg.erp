# Jira + GitHub + Coolify Workflow Guide

## For 2xG ERP Team (`2xggrowth-art/2xg.erp`)

---

## Table of Contents

1. [Understanding Jira Concepts](#1-understanding-jira-concepts)
2. [Jira Hierarchy Explained](#2-jira-hierarchy-explained)
3. [Connecting Jira to GitHub](#3-connecting-jira-to-github)
4. [Branch Naming Convention](#4-branch-naming-convention)
5. [Smart Commits](#5-smart-commits)
6. [Jira Automation Rules](#6-jira-automation-rules)
7. [Team Development Workflow](#7-team-development-workflow)
8. [Our Infrastructure](#8-our-infrastructure)

---

## 1. Understanding Jira Concepts

### What is What?

| Concept | What It Is | Example |
|---------|-----------|---------|
| **Epic** | A large feature or goal that spans multiple sprints (weeks/months) | "Implement Purchase Order Module" |
| **Story** | A user-facing feature that delivers value. Completable in 1 sprint | "As a user, I want to create a purchase order so I can order from suppliers" |
| **Task** | Technical/admin work that isn't user-facing | "Set up CI/CD pipeline for staging" |
| **Subtask** | Smallest unit of work, nested under a Story or Task | "Create PO form validation" |
| **Bug** | A defect in existing functionality | "Invoice total not calculating tax correctly" |
| **Sprint** | A time-boxed period (usually 2 weeks) where the team commits to delivering specific work | "Sprint 5: Jan 28 - Feb 10" |

### The Hierarchy (Top to Bottom)

```
Initiative (optional - strategic goal)
  └── Epic (large feature, spans multiple sprints)
        ├── Story (user-facing feature, 1 sprint)
        │     ├── Subtask (small piece of work)
        │     └── Subtask
        ├── Task (technical work, 1 sprint)
        │     └── Subtask
        └── Bug (defect fix)
```

---

## 2. Jira Hierarchy Explained

### Epics

Epics are **big features** that take weeks or months to complete. They group related Stories, Tasks, and Bugs together.

**Examples for 2xG ERP:**
- `ERP-100` - Implement Expense Management Module
- `ERP-200` - Build Invoice & Billing System
- `ERP-300` - Add Purchase Order Workflow
- `ERP-400` - Deploy to OVH Cloud with Coolify
- `ERP-500` - Implement User Roles & Permissions

**How to create:** In Jira, click **Create** > set Type to **Epic** > give it a name and description.

### Stories (User Stories)

Stories describe a feature **from the user's perspective**. They follow this format:

> "As a [user type], I want [action] so that [benefit]."

**Examples:**
- `ERP-101` - "As an accountant, I want to create expense reports so that I can track company spending"
- `ERP-201` - "As a sales manager, I want to generate invoices from sales orders so that billing is automated"
- `ERP-301` - "As a procurement officer, I want to receive items against a purchase order so that inventory updates automatically"

**Rules:**
- Must be completable within 1 sprint (2 weeks)
- Must belong to an Epic
- Should have clear acceptance criteria

### Tasks

Tasks are **technical work** that doesn't directly face the user.

**Examples:**
- `ERP-401` - "Set up Coolify deployment pipeline"
- `ERP-402` - "Migrate Supabase from hosted to self-hosted on OVH"
- `ERP-403` - "Configure SSL certificates for erp.2xg.in"
- `ERP-404` - "Set up database backup cron job"

### Subtasks

Subtasks break down a Story or Task into smaller pieces. Each can be assigned to a different team member.

**Example:** Story `ERP-201` (Generate invoices) might have:
- `ERP-201-1` - Create invoice form UI component
- `ERP-201-2` - Build invoice API endpoint
- `ERP-201-3` - Add PDF generation for invoices
- `ERP-201-4` - Write tests for invoice creation

### Bugs

Bugs are defects found in existing features.

**Examples:**
- `ERP-501` - "Login button unresponsive on mobile Safari"
- `ERP-502` - "Purchase order total doesn't include tax"
- `ERP-503` - "Expense approval email not sending"

### Sprints

A sprint is a **fixed time period** (usually 2 weeks) where the team picks items from the backlog and commits to finishing them.

**Sprint Lifecycle:**
```
Sprint Planning (Day 1)
  → Team selects Stories/Tasks from backlog
  → Assigns story points (effort estimate)

Daily Standup (Every day, 15 min)
  → What did you do yesterday?
  → What will you do today?
  → Any blockers?

Sprint Review (Last day)
  → Demo completed work to stakeholders

Sprint Retrospective (After review)
  → What went well?
  → What can improve?
```

---

## 3. Connecting Jira to GitHub

### Step-by-Step Setup

#### Step 1: Install GitHub for Jira App

1. In Jira, go to **Apps** > **Explore more apps**
2. Search for **"GitHub for Jira"** (by Atlassian - it's free)
3. Click **Get app** > **Get it now**
4. After installation, click **Get started**

#### Step 2: Connect Your GitHub Organization

1. Select **GitHub Cloud** > click **Next**
2. Sign in to GitHub (must be org owner of `2xggrowth-art`)
3. Find `2xggrowth-art` organization and click **Connect**
4. Select **Only select repositories** > choose `2xg.erp`
5. Click **Install**

#### Step 3: Verify the Connection

1. In Jira, go to **Apps** > **Manage your apps** > **GitHub for Jira**
2. Your `2xggrowth-art` organization should appear as connected
3. Create a test branch with a Jira issue key (e.g., `feature/ERP-1-test`) and verify it shows up on the Jira issue

#### Step 4: Verify Email Matching

**Critical:** Each team member's GitHub email must match their Jira email exactly. This enables Smart Commits.

- In GitHub: Settings > Emails (make sure primary email matches)
- **Disable** "Keep my email addresses private" in GitHub for smart commits to work

---

## 4. Branch Naming Convention

### Format

Always include the Jira issue key in the branch name:

```
<type>/<JIRA-KEY>-<short-description>
```

### Types

| Prefix | When to Use | Example |
|--------|------------|---------|
| `feature/` | New feature or story | `feature/ERP-201-invoice-generation` |
| `bugfix/` | Bug fix | `bugfix/ERP-502-fix-po-tax-calc` |
| `hotfix/` | Urgent production fix | `hotfix/ERP-503-fix-email-sending` |
| `task/` | Technical task | `task/ERP-401-setup-ci-cd` |
| `refactor/` | Code refactoring | `refactor/ERP-601-cleanup-api-routes` |

### Examples for 2xG ERP

```bash
# Creating a branch for a story
git checkout -b feature/ERP-201-invoice-generation

# Creating a branch for a bug fix
git checkout -b bugfix/ERP-502-fix-po-tax-calc

# Creating a branch for a technical task
git checkout -b task/ERP-401-setup-ci-cd
```

### Rules

- Always branch from `main`
- Keep branch names lowercase (except the Jira key)
- Use hyphens, not underscores
- Keep descriptions short (3-5 words)

---

## 5. Smart Commits

Smart Commits let you **control Jira directly from your commit messages**.

### Available Commands

#### 1. Add a Comment to a Jira Issue
```bash
git commit -m "ERP-201 #comment Added invoice PDF export functionality"
```
This adds the comment "Added invoice PDF export functionality" to issue ERP-201 in Jira.

#### 2. Log Time Spent
```bash
git commit -m "ERP-201 #time 2h 30m Implemented invoice form validation"
```
This logs 2 hours 30 minutes against ERP-201.

Time format: `w` (weeks), `d` (days), `h` (hours), `m` (minutes)

#### 3. Transition Issue Status
```bash
# Move to In Progress
git commit -m "ERP-201 #in-progress Starting invoice module"

# Move to Done
git commit -m "ERP-201 #done Invoice generation complete"

# Close the issue
git commit -m "ERP-201 #close All acceptance criteria met"
```
Multi-word statuses use hyphens (e.g., `#in-progress`, `#code-review`).

#### 4. Combine Multiple Commands
```bash
git commit -m "ERP-201 #comment Finished PDF export #time 3h #in-progress"
```

#### 5. Reference Multiple Issues
```bash
git commit -m "ERP-201 ERP-202 #comment Updated shared utility functions"
```

### Important Notes

- Commands must be on a **single line** (no line breaks)
- Your **Git email must match your Jira email** exactly
- Avoid `git push --force` and `git merge --squash` as they can cause duplicate smart commit execution

---

## 6. Jira Automation Rules

Set these up in **Project Settings > Automation > Create Rule**.

### Rule 1: Branch Created → Move to "In Progress"

```
TRIGGER:  Branch created (containing issue key)
ACTION:   Transition issue to "In Progress"
```

When a developer creates `feature/ERP-201-invoice-generation`, issue ERP-201 automatically moves to "In Progress".

### Rule 2: Pull Request Created → Move to "In Review"

```
TRIGGER:  Pull request created
ACTION:   Transition issue to "In Review"
```

### Rule 3: Pull Request Approved → Add Comment

```
TRIGGER:  Pull request approved
ACTION:   Add comment "PR approved and ready to merge"
```

### Rule 4: Pull Request Merged → Move to "Done"

```
TRIGGER:  Pull request merged
ACTION:   Transition issue to "Done"
```

### Rule 5: Pull Request Declined → Move Back to "In Progress"

```
TRIGGER:  Pull request declined
ACTION:   Transition issue to "In Progress"
```

### Jira Board Columns (Recommended)

```
| To Do | In Progress | In Review | Done |
```

Map these to your workflow statuses so the automation rules transition correctly.

---

## 7. Team Development Workflow

### Daily Workflow for a Developer

```
1. Pick a Jira issue from the sprint board (move to "In Progress")
                    ↓
2. Create a branch:
   git checkout main
   git pull origin main
   git checkout -b feature/ERP-201-invoice-generation
                    ↓
3. Write code, commit with Jira key:
   git commit -m "ERP-201 #comment Added invoice form component"
   git commit -m "ERP-201 #comment Built invoice API endpoint"
                    ↓
4. Push and create Pull Request:
   git push -u origin feature/ERP-201-invoice-generation
   gh pr create --title "ERP-201: Add invoice generation"
   (Issue auto-moves to "In Review")
                    ↓
5. Team reviews PR, requests changes if needed
                    ↓
6. PR approved and merged to main
   (Issue auto-moves to "Done")
                    ↓
7. Coolify auto-deploys from main to:
   - https://erp.2xg.in (frontend)
   - https://api.erp.2xg.in (backend)
```

### Pull Request Template

When creating a PR, include:

```markdown
## ERP-XXX: [Title]

### What changed
- [Brief description of changes]

### How to test
- [Steps to verify the changes work]

### Screenshots (if UI changes)
[Attach screenshots]

### Jira Issue
[ERP-XXX](https://your-team.atlassian.net/browse/ERP-XXX)
```

### Code Review Checklist

Before approving a PR, reviewers should check:
- [ ] Code follows existing patterns in the codebase
- [ ] No security vulnerabilities (SQL injection, XSS, etc.)
- [ ] API responses follow standard format (`{ success, data, error }`)
- [ ] Environment variables are not hardcoded
- [ ] Branch is up to date with `main`

---

## 8. Our Infrastructure

### Current Setup (All on OVH Cloud)

```
                    GitHub (2xggrowth-art/2xg.erp)
                              │
                    ┌─────────┴─────────┐
                    │    Jira Cloud      │
                    │  (Issue Tracking)  │
                    └─────────┬─────────┘
                              │
                    Push/Merge to main
                              │
                    ┌─────────┴─────────┐
                    │  Coolify (OVH)    │
                    │  51.195.46.40     │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────┴──────┐ ┌─────┴─────┐ ┌───────┴───────┐
     │   Frontend    │ │  Backend  │ │   Supabase    │
     │ erp.2xg.in   │ │api.erp.   │ │ (Self-hosted) │
     │  React+Vite  │ │ 2xg.in    │ │  PostgreSQL   │
     │  Port 3000   │ │ Express   │ │  + Auth/REST  │
     └──────────────┘ │ Port 5000 │ │  + Storage    │
                      └───────────┘ └───────────────┘
```

### URLs

| Service | URL |
|---------|-----|
| Frontend Dashboard | https://erp.2xg.in |
| Backend API | https://api.erp.2xg.in |
| Coolify Dashboard | http://51.195.46.40:8000 |
| Supabase (self-hosted) | Internal to OVH |
| GitHub Repository | https://github.com/2xggrowth-art/2xg.erp |

### Environment Variables

**Backend** (set in Coolify):
- `SUPABASE_URL` → Self-hosted Supabase on OVH
- `SUPABASE_SERVICE_ROLE_KEY` → Self-hosted key
- `PORT` → 5000
- `NODE_ENV` → production
- `FRONTEND_URL` → https://erp.2xg.in

**Frontend** (set in Coolify):
- `VITE_API_URL` → https://api.erp.2xg.in/api

---

## Quick Reference Card

### Git Commands
```bash
# Start work on a Jira issue
git checkout main && git pull
git checkout -b feature/ERP-XXX-description

# Commit with Jira smart commit
git commit -m "ERP-XXX #comment What you did"

# Push and create PR
git push -u origin feature/ERP-XXX-description
gh pr create --title "ERP-XXX: Description"
```

### Smart Commit Cheatsheet
```
ERP-XXX #comment Your message       → Add comment to issue
ERP-XXX #time 2h 30m Description    → Log time
ERP-XXX #in-progress                → Move to In Progress
ERP-XXX #done                       → Move to Done
ERP-XXX #close                      → Close issue
```

### Jira Issue Key Format
- Project key: `ERP` (or whatever your Jira project key is)
- Issue number: auto-incremented
- Full key: `ERP-123`

---

*Last updated: January 28, 2026*
*Maintained by 2xG Growth Team*
