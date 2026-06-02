# Contribuindo com o Genesis

Obrigado pelo interesse em contribuir! O Genesis melhora a cada novo agente, adapter de linguagem e caso de uso real.

## Formas de Contribuir

### 1. Adicionar um adapter de linguagem/framework

`genesis-backend` e `genesis-frontend` têm adapters para as stacks mais comuns. Se a sua não estiver lá, adicione uma seção no SKILL.md correspondente.

```markdown
### Ruby + Rails

**Estrutura:**
```
app/
├── controllers/
│   └── api/v1/{domain}_controller.rb
├── models/
│   └── {domain}.rb
├── services/
│   └── {domain}_service.rb
└── serializers/
    └── {domain}_serializer.rb
```
```

### 2. Criar um agente específico de domínio

Agentes do Genesis são apenas arquivos SKILL.md. Se você tem experiência em um domínio específico (e-commerce, saúde, IoT, ML), crie um agente especializado:

```
.agents/skills/
└── genesis-ecommerce/
    └── SKILL.md    ← sua orientação específica do domínio
```

### 3. Compartilhar um projeto real feito com Genesis

Adicione em [`examples/`](examples/) com um README breve mostrando o que o Genesis gerou vs o que você customizou.

### 4. Melhorar agentes existentes

Encontrou um padrão que funciona melhor? Melhore um SKILL.md existente com um PR explicando o porquê.

### 5. Reportar problemas

Encontrou um caso onde o Genesis deu uma orientação ruim? Abra uma issue com:
- O tipo de projeto (backend, fullstack, mobile)
- A stack utilizada
- O que o Genesis produziu
- O que deveria ter produzido

---

## Configuração do Ambiente

```bash
git clone https://github.com/rafaeldourado9/genesis-skill.git
cd genesis-skill

# Sem dependências — Genesis é apenas arquivos SKILL.md
# Teste instalando em um projeto de exemplo:
bash install.sh /tmp/projeto-teste
```

## Processo de Pull Request

1. Faça um fork do repositório
2. Crie uma branch: `git checkout -b feat/adapter-ruby-rails`
3. Faça suas alterações
4. Garanta que os arquivos SKILL.md seguem o formato existente (frontmatter + seções estruturadas)
5. Abra um PR com:
   - O que você adicionou/alterou
   - Exemplo do que o Genesis passa a produzir com sua mudança
   - Trade-offs ou limitações

## Formato do SKILL.md

Todos os agentes devem ter frontmatter:

```yaml
---
name: genesis-{nome}
description: >
  Descrição de um parágrafo. Usada pelo agente de IA para decidir quando invocar este agente.
metadata:
  author: {seu-usuario-github}
  version: "1.0.0"
  role: {papel}
  framework: genesis
---
```

## Código de Conduta

Seja gentil. Estamos todos aqui para construir software melhor, mais rápido.

Dúvidas? Abra uma [Discussion](https://github.com/rafaeldourado9/genesis-skill/discussions).
