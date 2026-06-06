## Genesis Framework 1.4.0

Esta versão torna a instalação realmente automática nos principais agentes de código.

### Destaques

- Claude Code: skills em `.claude/skills/` e ativação por `/genesis`.
- OpenCode: skills e comandos em `.opencode/`, com ativação por `/genesis`.
- Codex: skills em `.agents/skills/`, com `$genesis`, `/skills` ou `/prompts:genesis`.
- Instalação global ou por projeto pelo mesmo CLI.
- Novo executável curto `genesis`, mantendo `genesis-framework` por compatibilidade.
- Testes automatizados para todos os adapters de instalação.

### Instalação

```bash
npx github:rafaeldourado9/genesis-skill init
```

Instalação global:

```bash
npx github:rafaeldourado9/genesis-skill global
```

Reinicie sessões abertas do Claude Code, Codex ou OpenCode após uma instalação global.
