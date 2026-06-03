# Como usar a Spec Agent

> Guia prático para usar a Spec Agent no fluxo de desenvolvimento com Claude Code ou qualquer assistente de código.

---

## O problema que ela resolve

O assistente de código cria módulos tecnicamente funcionais, mas frequentemente incompletos:

- Cria telas sem botões de ação
- Cria endpoints sem integração frontend
- Cria PUT genérico que aceita alterar `status` direto
- Gera domínio anêmico (entidades sem métodos de negócio)
- Esquece loading/empty/error state nas telas
- Não testa autenticação nos endpoints
- Mistura lógica de negócio no frontend
- Acopla bounded contexts diretamente

A Spec Agent existe para detectar e bloquear esses problemas antes que cheguem ao PR.

---

## Onde está o arquivo

```
.ai/agents/spec-agent.md
```

---

## Fluxo de uso

```
1. ANTES de codar       → Gerar spec prospectiva
2. DURANTE a impl.      → Auditoria parcial por camada
3. APÓS a impl.         → Auditoria completa + Gap Report
4. ANTES do PR          → Validação final + Acceptance Criteria
```

---

## 1. Antes de codar um módulo

**Objetivo**: Gerar a especificação completa antes de escrever qualquer linha de código.

### Prompt para o assistente

```
Leia o arquivo .ai/agents/spec-agent.md e gere a spec completa para o módulo [NOME_DO_MÓDULO].

O módulo ainda não existe. Gere a spec prospectiva com:
- Telas obrigatórias
- Botões obrigatórios por tela
- Status Transition Matrix (se aplicável)
- Route Map by Use Case
- Business Action Matrix
- Frontend Action Map
- Permission Codes
- Checklist de testes obrigatórios

Contexto do módulo:
[descreva brevemente o módulo aqui]
```

**Resultado esperado**: Um relatório `Module Spec and Audit Report` com todas as seções preenchidas. Use esse relatório como contrato de implementação.

**Dica**: Salve o relatório gerado em `.genesis/specs/[module-name]-spec.md` para referência durante a implementação.

---

## 2. Durante a implementação

**Objetivo**: Auditar camadas individualmente para detectar gaps antes de avançar.

### Auditoria do backend (após implementar entidade e use cases)

```
Leia o arquivo .ai/agents/spec-agent.md e audite o backend do módulo [NOME_DO_MÓDULO].

Leia os arquivos:
- [caminho/entidade.py]
- [caminho/use_cases.py]
- [caminho/repository.py]
- [caminho/router.py ou views.py]

Gere o Backend Domain Quality Report.
Classifique como Rich Domain, Acceptable, Anemic ou CRUD-only.
Liste todos os domain methods ausentes.
Identifique se status pode ser alterado via PUT genérico.
```

### Auditoria do frontend (após implementar telas)

```
Leia o arquivo .ai/agents/spec-agent.md e audite o frontend do módulo [NOME_DO_MÓDULO].

Leia os arquivos:
- [caminho/pages/ListPage.tsx]
- [caminho/pages/DetailPage.tsx]
- [caminho/pages/FormPage.tsx]
- [caminho/services/api.ts]

Gere o Frontend Action Map.
Verifique se todos os botões obrigatórios estão implementados.
Verifique se botões condicionais respeitam o status da entidade.
Verifique se loading/empty/error state estão implementados.
Verifique se Authorization header é enviado em todas as chamadas.
```

---

## 3. Após a implementação

**Objetivo**: Auditoria completa de todas as camadas, com Gap Report detalhado.

### Prompt de auditoria completa

```
Leia o arquivo .ai/agents/spec-agent.md e faça a auditoria completa do módulo [NOME_DO_MÓDULO].

Leia todos os arquivos relevantes do módulo:
[liste os diretórios ou arquivos principais]

Gere o Module Spec and Audit Report completo com todas as 25 seções.

Para cada gap encontrado:
- Classifique como CRITICAL, MAJOR ou MINOR
- Descreva o que está faltando
- Sugira o que precisa ser implementado

Ao final, indique se a feature está APPROVED ou BLOCKED para PR.
```

---

## 4. Antes de abrir PR

**Objetivo**: Validação final. Nenhum PR deve ser aberto com gap crítico.

### Prompt de validação final

```
Leia o arquivo .ai/agents/spec-agent.md e valide se o módulo [NOME_DO_MÓDULO] está pronto para PR.

Verifique especificamente as Blocking Rules da Spec Agent.

Para cada regra de bloqueio, confirme se está satisfeita ou se é um gap.

Gere o Gap Report final com:
- CRITICAL GAPS (bloqueiam o PR)
- MAJOR GAPS (devem ser corrigidos antes do merge)
- MINOR GAPS (podem ser follow-up)

Conclua com APPROVED ou BLOCKED e a lista de itens obrigatórios antes do merge.
```

---

## 5. Como gerar o Gap Report

O Gap Report é gerado automaticamente como parte do relatório completo (Seção 23).

Para gerar apenas o Gap Report de um módulo existente:

```
Leia o arquivo .ai/agents/spec-agent.md e gere apenas o Gap Report para o módulo [NOME_DO_MÓDULO].

Leia o código existente e compare com as regras da Spec Agent.

Formato esperado:

## Gap Report — [NOME_DO_MÓDULO]

### CRITICAL GAPS
- [ ] [descrição do gap + onde está + o que falta]

### MAJOR GAPS
- [ ] [descrição do gap + onde está + o que falta]

### MINOR GAPS
- [ ] [descrição do gap + onde está + o que falta]

### Status: BLOCKED / APPROVED
```

---

## 6. Como mandar o assistente corrigir os gaps

Após gerar o Gap Report, use os gaps como instrução de correção.

### Corrigir gap de domínio anêmico

```
O Gap Report do módulo [NOME] identificou os seguintes gaps de domínio:
- Entidade AccountPayable não possui método mark_as_paid()
- Entidade AccountPayable não possui método cancel()
- Status está sendo alterado via PUT genérico

Implemente as correções:
1. Adicione os domain methods na entidade
2. Crie os use cases específicos: MarkAccountPayableAsPaidUseCase, CancelAccountPayableUseCase
3. Crie endpoints PATCH dedicados: /finance/accounts-payable/{id}/pay e /cancel
4. Remova o campo status do DTO do PUT genérico
5. Adicione testes de domínio para cada invariante
```

### Corrigir gap de frontend

```
O Gap Report identificou os seguintes gaps no frontend do módulo [NOME]:
- Botão "Marcar como paga" não existe na tela de detalhe
- Loading state não implementado na tela de listagem
- PATCH /pay não envia Authorization header

Implemente as correções:
1. Adicione o botão "Marcar como paga" na tela de detalhe, visível apenas para status PENDING e OVERDUE
2. Adicione loading state na tela de listagem durante o fetch
3. Corrija o HTTP client para injetar Authorization: Bearer token em todas as chamadas
4. Após marcar como paga, atualize o status na tela sem reload completo
```

### Corrigir gap de autenticação

```
O Gap Report identificou que o endpoint POST /finance/accounts-payable está retornando 401.

Causa provável: frontend não está enviando Authorization header.

Verifique e corrija:
1. O HTTP client tem interceptor configurado?
2. O token está sendo lido do storage correto?
3. O header Authorization: Bearer [token] está sendo enviado?
4. Adicione teste que valida que POST envia o header de autenticação.
```

### Corrigir gap de contextos

```
O Gap Report identificou acoplamento inválido:
- O módulo Finance está importando o aggregate Supplier diretamente do contexto Suppliers

Corrija:
1. Remova o import direto do aggregate Supplier
2. No aggregate AccountPayable, mantenha apenas supplier_id (UUID)
3. Adicione supplier_name como snapshot (salvo no momento da criação)
4. Para o formulário de criação, use um endpoint de listagem do contexto Suppliers que retorne apenas {id, name}
5. Documente a relação na Cross-Context Relationship Matrix
```

---

## Referência rápida — Comandos por situação

| Situação | Prompt base |
|----------|-------------|
| Antes de codar | "Leia spec-agent.md e gere spec prospectiva para [módulo]" |
| Auditar backend | "Leia spec-agent.md e audite o backend de [módulo], classifique o domínio" |
| Auditar frontend | "Leia spec-agent.md e audite o frontend de [módulo], verifique botões e estados" |
| Auditoria completa | "Leia spec-agent.md e faça auditoria completa de [módulo] com todas as 25 seções" |
| Gap Report | "Leia spec-agent.md e gere Gap Report para [módulo]" |
| Validar para PR | "Leia spec-agent.md e valide se [módulo] está pronto para PR" |
| Corrigir gaps | "O Gap Report identificou [gap]. Implemente as correções: [lista]" |

---

## Integração com o Genesis Framework

Se o projeto usa o Genesis Framework:

- Use `/genesis-guard` para auditoria de conformidade geral
- Use `/spec-agent [módulo]` para auditoria profunda de um módulo específico
- A Spec Agent complementa o genesis-guard com análise de domínio, status transitions e frontend actions
- Salve specs geradas em `.genesis/specs/` para referência dos agentes de implementação

---

## Boas práticas

1. **Sempre gere a spec antes de codar** — evita retrabalho de refatoração de domínio anêmico
2. **Use a Status Transition Matrix como contrato** — o backend e o frontend devem seguir exatamente essa matriz
3. **Não permita PUT com campo status** — sempre use endpoints específicos de ação (PATCH /pay, PATCH /cancel)
4. **Salve o relatório gerado** — use como referência durante code review
5. **Gap Report antes do PR** — nenhum PR com gap crítico deve ser aprovado
6. **Revise o Shared Kernel antes de criar dependências** — pergunte: "este conceito pertence a todos os contextos ou a um específico?"
