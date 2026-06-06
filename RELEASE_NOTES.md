## Genesis Framework 1.5.0

A maior atualização desde o lançamento. Foco em três frentes: CLI de orquestração com segurança real, qualidade de prompts compatível com qualquer LLM, e controle de custos por design.

### `genesis-run` — CLI multi-LLM com vault seguro

Novo comando para usar os agentes fora do editor ou em pipelines:

```bash
genesis-run          # abre o REPL interativo
genesis-run /setup   # ou: genesis-run setup
```

REPL com prompt `›`, comandos `/slash`, entrada mascarada (`∗`) para senhas e API keys, e spinner animado durante as chamadas.

Chaves de API cifradas localmente com **AES-256-GCM + PBKDF2 (120k iterações)**. Suporte a até 5 providers. Variáveis de ambiente têm prioridade — funciona em CI/CD sem prompt.

### Roteamento automático de agentes

O CLI detecta o domínio e a complexidade da tarefa e escolhe o tier certo:

| Tier | Modelo | Quando |
|------|--------|--------|
| `junior` | claude-haiku | tarefa simples, < 25 palavras |
| `pleno` | claude-sonnet | padrão |
| `senior` | claude-opus | arquitetura, alta complexidade |
| `backend/frontend/qa` | claude-sonnet | domínio detectado por regex |

### Multi-LLM em paralelo

```
/parallel "revise esta decisão" --providers anthropic,openai,gemini
```

Roda a mesma tarefa em múltiplos LLMs simultaneamente e exibe os resultados lado a lado. Implementado via `fetch` nativo — sem dependências externas.

### Otimização de tokens

- **Cache SHA-256**: respostas idênticas retornam sem chamada à API
- **Request coalescing**: múltiplos requests em < 80ms são batched em uma única chamada
- **Prompt caching**: system prompt enviado com `cache_control: ephemeral` para Claude
- **Alertas de budget**: avisos em 80%, 90% e 95% do limite diário

### SKILL.md compatíveis com qualquer LLM

Todos os 13 agentes foram reescritos: saímos do padrão "Você é o X" (persona) para "Tarefa: produza Y, execute os passos na ordem" (procedimento). LLMs menores seguem procedimentos numerados muito melhor do que personas.

### Anti-overengineering por design

- `genesis-intake` agora coleta um **Plano de Capacidade** (Bloco 6): usuários simultâneos, volume, disponibilidade, tipo MVP vs produção
- `genesis-architect` calcula um **tier de escala** (nano → enterprise) e proíbe componentes acima do teto sem ADR de justificativa
- Exemplo: projeto MVP solo não pode ter microservices, Kafka ou Kubernetes sem justificativa explícita documentada

### Instalação

```bash
npx github:rafaeldourado9/genesis-skill init
```

Instalação global (Claude Code + Codex + OpenCode):

```bash
npx github:rafaeldourado9/genesis-skill global
```

Reinicie sessões abertas após instalação global.
