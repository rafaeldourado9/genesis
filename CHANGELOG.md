# Changelog

Todas as mudanças notáveis do Genesis Framework são documentadas aqui.

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
Versionamento: [Semantic Versioning](https://semver.org/lang/pt-BR/)

---

## [1.4.0] — 2026-06-06

- Instala automaticamente skills para Claude Code, Codex e OpenCode.
- Registra `/genesis` no Claude Code e OpenCode e os aliases suportados pelo Codex.
- Adiciona testes de instalação multi-runtime e o executável curto `genesis`.
- Unifica os instaladores PowerShell, Bash e npm no mesmo CLI.
- Adiciona automação de GitHub Release para tags `v*`.

## [1.3.0] — 2026-06-03

### Adicionado

**Novo agente `spec-agent` (`.ai/agents/spec-agent.md`):**
- Especificação técnica e auditoria completa de módulos DDD antes e depois da implementação
- Classificação de qualidade de domínio: Rich Domain / Acceptable Application Service / Anemic Domain / CRUD-only Backend
- Detecção de backend anêmico: entidades sem métodos de negócio, status alterado via PUT genérico, regras vazando para controller ou frontend
- Status Transition Matrix obrigatória para qualquer entidade com campo `status`
- Route Map by Use Case para resolver dificuldade de localização de rotas em projetos DDD
- Business Action Matrix diferenciando CRUD técnico de ações de negócio
- Frontend Action Map com inventário de telas, botões obrigatórios e estados (loading/empty/error/forbidden)
- Auth and Permission Audit com checklist de JWT, interceptor e permission codes no formato `CONTEXT_ACTION_RESOURCE`
- Shared Kernel and Context Relationship Audit com Cross-Context Relationship Matrix e 7 tipos de relação (Owns, References by ID, Snapshot, Read Model, Domain Event, External Contract, Invalid Coupling)
- 15+ Blocking Rules que impedem aprovação de features com gaps críticos
- Exemplo completo do módulo Contas a Pagar com entidade, use cases, domain methods, endpoints, telas, botões, permission codes e testes backend/frontend
- Relatório de 25 seções: `Module Spec and Audit Report`

**Guia de uso (`docs/ddd/spec-agent-usage.md`):**
- Prompts prontos para cada etapa: antes de codar, durante, após, antes do PR
- Como gerar Gap Report e Gap Report classificado (CRITICAL / MAJOR / MINOR)
- Como mandar o code assistant corrigir gaps de domínio, frontend, autenticação e bounded contexts
- Tabela de referência rápida com comandos por situação
- Integração documentada com o Genesis Framework (`genesis-guard` + `spec-agent`)

---

## [1.2.0] — 2026-06-02

### Adicionado

**Novo agente `genesis-inspector`:**
- Inspeção de segurança frontend: API keys hardcoded, dados sensíveis em storage/logs e variáveis públicas expostas ao browser
- Inspeção tela por tela: estados loading/error/empty, auth, role check e redirects de permissão
- Inspeção botão por botão: handlers vazios, links placeholder, forms sem submit e risco de double-submit
- Auditoria CSS/layout: z-index, stacking context, overflow cortando elementos, tooltips/dropdowns/modais
- Comparação frontend ↔ backend: endpoints órfãos, typos de path, divergência de shape e token ausente
- Catálogo de bugs com IDs nomeados (`SEC-001`, `UI-001`, `CSS-001`, `API-001`, etc.)
- Geração automática de dois sprints: `sprint-fix-{date}.md` e `sprint-backend-create-{date}.md`
- Detecção de bugs reincidentes via leitura obrigatória de `progress.md` e sprints anteriores

### Melhorado

- `README.md` atualizado com `genesis-inspector` na tabela de agentes e no fluxo principal
- Documentada a limitação do `genesis-scout` em codebases grandes
- Roadmap reorganizado com v1.2 como release atual e v1.3/v2.0 como próximos marcos
- `CLAUDE.md` adicionado com comandos disponíveis e regra de segurança contra sobrescrita sem confirmação

---

## [1.1.1] — 2026-06-02

### Corrigido

- Comandos `npx` corrigidos de `npx genesis-framework` para `npx github:rafaeldourado9/genesis-skill` (pacote ainda não publicado no npm)
- Nome do repositório corrigido em todos os arquivos: `genesis` → `genesis-skill`

### Melhorado

- `CONTRIBUTING.md` traduzido para português
- `examples/README.md` traduzido para português
- Templates de issue e pull request do GitHub traduzidos para português
- Histórico de commits limpo (removido Co-Authored-By dos commits anteriores)

---

## [1.1.0] — 2026-06-02

### Adicionado

**Instalação universal via npm:**
- `package.json` — pacote `genesis-framework` publicável no npm
- `bin/genesis.js` — CLI Node.js sem dependências externas
  - `npx github:rafaeldourado9/genesis-skill init` — instala no projeto atual (Windows/Linux/macOS)
  - `npx github:rafaeldourado9/genesis-skill global` — instala globalmente em `~/.claude/commands/`
  - `npx github:rafaeldourado9/genesis-skill update` — atualiza skills existentes (alias de `init --force`)
  - Flags: `--force`, `--global`, `--path`

**Scripts de instalação remota (sem clonar o repositório):**
- `scripts/install-remote.sh` — one-liner para Linux/macOS via `curl | bash`
- `scripts/install-remote.ps1` — one-liner para Windows via PowerShell `iwr | iex`
- Ambos detectam Node.js e usam `npx` como método primário com fallback para `curl+tar` e `git clone`

**README reescrito em português:**
- 5 métodos de instalação documentados com exemplos
- Tabela de comparação: instalação global vs por projeto
- Demo completo em PT-BR
- Badges npm adicionados

### Alterado

- `README.md` reescrito completamente em português
- `.npmignore` adicionado para controlar o que entra no pacote npm

---

## [1.0.0] — 2026-06-01

### Adicionado

**13 agentes especializados:**

- `genesis` — Orquestrador principal com suporte a projetos greenfield e brownfield
- `genesis-intake` — Coleta progressiva de requisitos com perguntas inteligentes
- `genesis-scout` — Mapeamento de código existente para projetos brownfield
- `genesis-architect` — Diagramas C4, ADRs, matrizes de trade-off, seleção de stack técnica
- `genesis-data` — Diagrama ER, schema SQL, estratégia de índices, guia de migrations
- `genesis-backend` — Implementação de API adaptando-se a Python/Node/Go/Java e mais
- `genesis-frontend` — Implementação de UI adaptando-se a React/Vue/RN/Flutter e mais
- `genesis-qa` — Pirâmide de testes, cenários BDD, E2E, cobertura
- `genesis-devops` — Docker, pipelines CI/CD, ambientes, monitoramento
- `genesis-sprint` — Geração de backlog e execução de sprints bottom-up
- `genesis-docs` — README, runbooks, catálogo de ADRs, docstrings
- `genesis-guard` — Auditor de conformidade pré-merge
- `genesis-reviewer` — Code review para bugs, anti-patterns e drift arquitetural

**Instalação:**
- `install.ps1` — Instalador PowerShell para Windows
- `install.sh` — Instalador bash para Linux/macOS

**Persistência de estado do projeto:**
- `.genesis/state.json` — rastreamento de fase entre sessões
- `.genesis/manifest.md` — bíblia imutável do projeto após o intake
- `.genesis/architecture/` — ADRs, C4, patterns, trade-offs
- `.genesis/contracts/` — OpenAPI, schema, contratos de testes
- `.genesis/memory/` — rastreamento de progresso, relatórios do guard

**Stacks suportadas no lançamento:**
- Backend: Python (FastAPI, Django), Node.js (NestJS, Express), Go (Gin), Java (Spring Boot)
- Frontend: React (Vite, Next.js), Vue, Angular, React Native, Flutter
- Banco: PostgreSQL, MySQL, MongoDB, SQLite, DynamoDB
- Deploy: Docker Compose, Kubernetes, AWS, Railway, Render

---

## Roadmap

### [1.5.0]
- [ ] `genesis-migrate` — planejador de migration para projetos brownfield complexos
- [ ] Melhorar `genesis-scout` para codebases >50k linhas
- [ ] `genesis-mobile` — agente dedicado para React Native + Expo
- [ ] `genesis-ml` — agente de pipeline ML

### [2.0.0]
- [ ] Interface web para tracking de sprints e progresso
- [ ] Registro de agentes da comunidade
- [ ] Suporte a Cursor Rules (`.cursorrules`)
