<div align="center">

<img src="docs/assets/genesis-banner.png" alt="Genesis Framework" width="100%" />

# Genesis Framework

**Build production-ready software from a description.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/rafaeldourado9/genesis/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Stars](https://img.shields.io/github/stars/rafaeldourado9/genesis?style=social)](https://github.com/rafaeldourado9/genesis/stargazers)

*A multi-agent engineering framework that turns a project description into architecture, code, tests, and documentation — for any language, any stack.*

[**Get Started →**](#installation) · [**See How It Works →**](#how-it-works) · [**Agent Roster →**](#agents)

</div>

---

## The Problem

Starting a project the right way takes days:
- Designing the architecture and documenting decisions (ADRs)
- Picking the right stack and justifying the trade-offs
- Setting up database schema, API contracts, testing strategy
- Writing boilerplate, Docker, CI/CD, README

**Genesis does all of that in one session.**

---

## How It Works

```
You describe your project
         ↓
genesis-intake   ──→  asks smart questions, creates the project manifest
genesis-scout    ──→  maps existing code (brownfield projects)
genesis-architect──→  C4 diagrams, ADRs, trade-off matrices, tech stack
genesis-data     ──→  ER diagram, SQL schema, index strategy, migrations
genesis-sprint   ──→  generates backlog, executes sprint by sprint
genesis-backend  ──→  API, services, repositories (adapts to your language)
genesis-frontend ──→  UI components, state, routes (adapts to your framework)
genesis-qa       ──→  test pyramid, BDD scenarios, coverage
genesis-devops   ──→  Docker, CI/CD pipelines, monitoring
genesis-guard    ──→  audits compliance before merge
genesis-docs     ──→  README, runbooks, ADR catalog
```

**One command. Any stack.**

---

## Installation

### Install in any project (Windows)

```powershell
git clone https://github.com/rafaeldourado9/genesis.git D:\tools\genesis
cd D:\tools\genesis
.\install.ps1 -ProjectPath "C:\your\project"
```

### Install in any project (Linux/macOS)

```bash
git clone https://github.com/rafaeldourado9/genesis.git ~/tools/genesis
cd ~/tools/genesis
bash install.sh /path/to/your/project
```

### Start building

Open [Claude Code](https://claude.ai/code) in your project and type:

```
/genesis
```

That's it. Genesis takes over from there.

---

## Demo

### New project from scratch

```
> /genesis

Genesis: Hi! Let me understand your project.

1. What's the project name and what does it do in one sentence?
> "TaskFlow — a Kanban board for remote teams with real-time updates"

2. Who are your users? How many concurrent users at launch?
> "Teams of 5–50. ~100 concurrent at launch, ~1000 in year 1"

3. Do you have tech preferences or should I recommend a stack?
> "Recommend something — I want to move fast"

Genesis: Here's what I recommend and why:
  Backend:  Python + FastAPI   (async, fast, great for real-time)
  Database: PostgreSQL          (relational, ACID, pgvector ready)
  Cache:    Redis               (WebSocket presence, pub/sub)
  Frontend: React + Vite        (fast DX, Zustand state, React Query)
  Deploy:   Docker + Compose    (simple, portable, CI-ready)

Tradeoffs documented in .genesis/architecture/adrs/

Approve? (y/n)
> y

[genesis-architect]: Generating system design...
  ✅ C4 Context + Container diagrams
  ✅ ADR-001: Database choice (PostgreSQL vs MongoDB)
  ✅ ADR-002: API framework (FastAPI vs Django)
  ✅ ADR-003: Real-time strategy (WebSocket vs SSE vs polling)
  ✅ Patterns registry

[genesis-data]: Designing schema...
  ✅ 8 tables, 12 indexes, ER diagram, migration strategy

[genesis-sprint]: Generating backlog...
  ✅ 4 sprints, 28 tasks, bottom-up sequencing

[genesis-sprint] Sprint 1 executing...
  ✅ S1-01: Docker Compose + env
  ✅ S1-02: Migrations: users, workspaces, boards
  ✅ S1-03: Auth: JWT + refresh tokens
  ✅ S1-04: RBAC: require_role decorator
  ✅ S1-05: Tests: 24 passing, 87% coverage

Sprint 1 complete. 3 more to go.
```

---

## Agents

| Agent | Role | Output |
|-------|------|--------|
| `genesis` | Orchestrator | Phase management, state |
| `genesis-intake` | Requirements | `manifest.md` |
| `genesis-scout` | Code mapping | `existing-code.md`, brownfield plan |
| `genesis-architect` | Architecture | C4, ADRs, tradeoffs, patterns |
| `genesis-data` | Data design | ER diagram, SQL schema, migrations |
| `genesis-backend` | API layer | Services, repositories, OpenAPI |
| `genesis-frontend` | UI layer | Components, hooks, routes |
| `genesis-qa` | Quality | Test pyramid, BDD, E2E |
| `genesis-devops` | Infrastructure | Docker, CI/CD, monitoring |
| `genesis-sprint` | Execution | Backlog, sprint orchestration |
| `genesis-docs` | Documentation | README, runbooks, ADR catalog |
| `genesis-guard` | Compliance | Audit report before merge |
| `genesis-reviewer` | Code review | Bugs, anti-patterns, drift |

---

## Supported Stacks

Genesis adapts to whatever you use:

| Layer | Options |
|-------|---------|
| **Backend** | Python (FastAPI, Django, Flask) · Node.js (NestJS, Express) · Go (Gin, Echo) · Java (Spring Boot) · Ruby (Rails) · PHP (Laravel) · Rust (Axum) |
| **Frontend** | React (Vite, Next.js) · Vue (Nuxt, Vite) · Angular · React Native (Expo) · Flutter · Svelte |
| **Database** | PostgreSQL · MySQL · MongoDB · SQLite · DynamoDB · Firestore · Redis |
| **Deploy** | Docker Compose · Kubernetes · AWS (ECS, Lambda) · Railway · Render · Fly.io |
| **CI/CD** | GitHub Actions · GitLab CI · CircleCI · Jenkins |

---

## What Gets Generated

### Architecture
- C4 Context and Container diagrams (Mermaid)
- ADRs for every significant decision
- Trade-off matrices for tech choices
- Patterns registry for the project

### Data
- ER diagram
- SQL schema with constraints and indexes
- Migration strategy with zero-downtime patterns

### Code
- Full project structure
- OpenAPI 3.0 contract
- Service + Repository layers
- Auth + RBAC
- Dockerfile (multi-stage) + docker-compose
- GitHub Actions CI pipeline

### Tests
- Test pyramid strategy
- Given-When-Then contracts
- Unit + Integration + E2E tests
- Coverage reporting

### Documentation
- Professional README
- CONTRIBUTING.md
- Production runbook
- ADR catalog

---

## Output Structure

Everything Genesis generates goes to `.genesis/` — never touches your existing code without showing you first.

```
.genesis/
├── state.json              # Current phase, tech stack, progress
├── manifest.md             # Project bible (immutable after intake)
├── context/
│   ├── surface.json        # Existing code map (brownfield)
│   └── existing-code.md
├── architecture/
│   ├── system-design.md    # C4 + architecture overview
│   ├── tech-stack.md       # Chosen stack with full justification
│   ├── patterns.md         # Project conventions
│   └── adrs/               # Architecture Decision Records
│       ├── 001-database.md
│       └── ...
├── contracts/
│   ├── openapi.yaml        # API spec
│   ├── db-schema.sql       # Database schema
│   ├── er-diagram.md
│   └── test-contracts.md   # Given-When-Then specs
├── sprints/
│   ├── backlog.md
│   └── sprint-001.md
└── memory/
    ├── progress.md         # Task tracking
    └── guard-report-*.md   # Audit reports
```

---

## Principles

1. **Spec before code** — architecture and contracts before any implementation
2. **ADR-first** — every non-trivial decision has a written record
3. **Bottom-up** — data → backend → frontend (never the other way)
4. **Test pyramid enforced** — zero merge without tests
5. **Persistent memory** — sessions resume, nothing is lost
6. **Tech-agnostic** — adapts to your stack, not the other way around

---

## Works With

Genesis is a set of AI agent skill files. It works with any agent runtime that supports the `.agents/skills/` convention:

- [Claude Code](https://claude.ai/code) (recommended)
- [Cursor](https://cursor.sh)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- Any agent compatible with `SKILL.md` format

---

## Roadmap

- [ ] `genesis-mobile` — dedicated React Native + Expo agent
- [ ] `genesis-ml` — ML pipeline agent (data prep, training, serving)
- [ ] `genesis-migrate` — database migration planner for brownfield projects
- [ ] Web UI for project management and sprint tracking
- [ ] NPX installer: `npx genesis-init my-project`
- [ ] Community agent registry

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md).

Ideas for contributions:
- New language/framework adapters for `genesis-backend` or `genesis-frontend`
- Domain-specific agents (e-commerce, SaaS, IoT, ML pipelines)
- Translations of the SKILL.md files
- Real-world project examples using Genesis

---

## License

MIT — use it, modify it, distribute it, build on it.

---

<div align="center">

**Built with Genesis · [Star this repo](https://github.com/rafaeldourado9/genesis) if it helped you**

</div>
