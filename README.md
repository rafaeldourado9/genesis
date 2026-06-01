# Genesis Framework

> Construa software profissional do zero com agentes de IA especializados.

## O que é

Genesis é um framework de engenharia de software orientado a agentes de IA. Você descreve
o projeto em linguagem natural — Genesis gera a arquitetura, ADRs, contratos de API,
schema do banco, sprints de desenvolvimento, código e testes.

Funciona com **qualquer linguagem, framework ou banco de dados**.

## Como funciona

```
Você descreve o projeto
        ↓
genesis-intake pergunta os detalhes
        ↓
genesis-scout mapeia código existente (se houver)
        ↓
genesis-architect escolhe stack, gera C4, ADRs, tradeoffs
        ↓
genesis-data projeta o schema e estratégia de migrations
        ↓
genesis-sprint gera backlog e executa sprint por sprint
        ↓
genesis-backend + genesis-frontend implementam o código
        ↓
genesis-qa garante cobertura e testes
        ↓
genesis-guard audita conformidade antes do merge
        ↓
genesis-docs gera README, runbook, ADR catalog
```

## Instalação

### Em um projeto existente (Windows)

```powershell
cd D:\tools\genesis
.\install.ps1 -ProjectPath "C:\seu\projeto"
```

### Em um projeto existente (Linux/macOS)

```bash
cd ~/tools/genesis
bash install.sh /caminho/do/projeto
```

### Em um novo projeto (criar do zero)

```powershell
# Criar diretório do projeto
mkdir C:\projects\meu-projeto
cd C:\projects\meu-projeto
git init

# Instalar Genesis
.\install.ps1 -ProjectPath "C:\projects\meu-projeto"

# Abrir Claude Code e digitar /genesis
```

## Comandos

| Comando | O que faz |
|---------|-----------|
| `/genesis` | Iniciar projeto novo ou retomar existente |
| `/genesis-scout` | Mapear código existente |
| `/genesis-architect` | Gerar/atualizar arquitetura, ADRs, tradeoffs |
| `/genesis-sprint` | Planejar e executar próximo sprint |
| `/genesis-backend` | Implementar camada de API/serviços |
| `/genesis-frontend` | Implementar interface de usuário |
| `/genesis-data` | Projetar schema, migrations, índices |
| `/genesis-qa` | Gerar estratégia de testes, BDD, cobertura |
| `/genesis-devops` | Docker, CI/CD, monitoring |
| `/genesis-guard` | Auditar conformidade com specs |
| `/genesis-reviewer` | Code review — bugs, anti-patterns |
| `/genesis-docs` | README, ADRs, runbook |

## Stacks suportadas

**Backend:**
- Python + FastAPI / Django / Flask
- Node.js + NestJS / Express
- Go + Gin / Echo
- Java + Spring Boot
- Ruby + Rails
- PHP + Laravel
- Rust + Axum

**Frontend:**
- React (Vite SPA, Next.js SSR)
- Vue (Vite, Nuxt)
- Angular
- React Native + Expo
- Flutter
- Svelte

**Banco de dados:**
- PostgreSQL, MySQL, SQLite
- MongoDB, DynamoDB, Firestore
- Redis (como banco principal)

**Deploy:**
- Docker + Compose
- Kubernetes
- AWS (ECS, Lambda, EKS)
- Railway, Render, Fly.io
- Self-hosted VPS

## O que Genesis gera

### Arquitetura
- Diagrama C4 (Context + Containers) em Mermaid
- ADRs para cada decisão significativa
- Tradeoff matrices para escolhas de tecnologia
- Patterns registry do projeto
- Tech stack justificado

### Dados
- ER Diagram em Mermaid
- Schema SQL completo com constraints e índices
- Estratégia de migrations e rollback
- Guia de índices justificado

### Código
- Estrutura de projeto completa
- API contracts (OpenAPI 3.0)
- Service + Repository layer
- Auth + RBAC
- Dockerfile + docker-compose
- CI/CD pipeline (GitHub Actions ou equivalente)

### Testes
- Estratégia de pirâmide de testes
- Test contracts (Given-When-Then)
- Unit + Integration + E2E tests
- Coverage report

### Documentação
- README profissional
- CONTRIBUTING.md
- Runbook de produção
- ADR catalog

## Estrutura de saída (`.genesis/`)

```
.genesis/
├── state.json              # Estado atual, tech stack, progresso
├── manifest.md             # Project bible (imutável após intake)
├── context/
│   ├── surface.json        # Mapeamento do código existente
│   └── existing-code.md    # Relatório legível do scout
├── architecture/
│   ├── system-design.md    # C4 + arquitetura
│   ├── tech-stack.md       # Stack escolhida com justificativas
│   ├── patterns.md         # Convenções do projeto
│   └── adrs/               # Architecture Decision Records
│       ├── 001-database.md
│       └── ...
├── contracts/
│   ├── openapi.yaml        # API spec
│   ├── db-schema.sql       # Schema do banco
│   ├── er-diagram.md       # ER Diagram
│   ├── test-contracts.md   # Given-When-Then specs
│   └── migrations.md       # Estratégia de migrations
├── sprints/
│   ├── backlog.md          # Backlog completo
│   ├── sprint-001.md
│   └── ...
└── memory/
    ├── progress.md         # Progresso das tasks
    ├── decisions.md        # Log de decisões
    └── guard-report-*.md   # Relatórios de auditoria
```

## Princípios

1. **Spec antes de código** — arquitetura e contratos antes de qualquer implementação
2. **ADR-first** — toda decisão não-trivial tem registro escrito
3. **Bottom-up** — dados → backend → frontend (nunca ao contrário)
4. **Testes obrigatórios** — pirâmide de testes aplicada, zero merge sem testes
5. **Memory persistente** — sessions podem ser retomadas, nada se perde
6. **Tech-agnostic** — adapta-se à stack do projeto

## Agentes especializados

| Agente | Especialidade |
|--------|--------------|
| `genesis` | Orquestração, gestão de fases |
| `genesis-intake` | Elicitação de requisitos |
| `genesis-scout` | Análise de código existente |
| `genesis-architect` | System design, ADRs, tradeoffs, C4 |
| `genesis-data` | Schema, ER, migrations, índices |
| `genesis-backend` | API, services, repositories |
| `genesis-frontend` | UI, componentes, state |
| `genesis-qa` | Testes, cobertura, BDD |
| `genesis-devops` | Docker, CI/CD, observabilidade |
| `genesis-sprint` | Sprint planning, execução |
| `genesis-docs` | Documentação, ADRs, runbooks |
| `genesis-guard` | Auditoria de conformidade |
| `genesis-reviewer` | Code review, anti-patterns |

## License

MIT — use, modifique, distribua livremente.
