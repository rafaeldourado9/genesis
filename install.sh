#!/usr/bin/env bash
# Genesis Framework — Install Script (Linux/macOS)
# Copia os skills Genesis para um projeto existente ou novo

set -euo pipefail

GENESIS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SOURCE="$GENESIS_ROOT/.agents/skills"
TEMPLATES_SOURCE="$GENESIS_ROOT/templates"
TARGET_PATH="${1:-.}"
FORCE="${2:-false}"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}Genesis Framework Installer${NC}"
echo -e "${CYAN}============================${NC}"
echo ""
echo -e "Instalando em: ${YELLOW}$TARGET_PATH${NC}"
echo ""

# Verificar se é um projeto
IS_PROJECT=false
for f in "package.json" "pyproject.toml" "go.mod" "pom.xml" "Cargo.toml" "composer.json" ".git"; do
    if [ -e "$TARGET_PATH/$f" ]; then
        IS_PROJECT=true
        break
    fi
done

if [ "$IS_PROJECT" = false ] && [ "$FORCE" != "--force" ]; then
    echo -n "Diretório não parece ser um projeto. Continuar? (s/n): "
    read -r confirm
    if [ "$confirm" != "s" ]; then
        echo -e "${RED}Instalação cancelada.${NC}"
        exit 0
    fi
fi

# Criar diretórios
TARGET_SKILLS="$TARGET_PATH/.agents/skills"
TARGET_GENESIS_TEMPLATES="$TARGET_PATH/.genesis/templates"

mkdir -p "$TARGET_SKILLS"
mkdir -p "$TARGET_GENESIS_TEMPLATES"

# Copiar skills Genesis
echo -e "${GREEN}Copiando skills...${NC}"
for skill_dir in "$SKILLS_SOURCE"/genesis*; do
    if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")
        target_skill="$TARGET_SKILLS/$skill_name"

        if [ -d "$target_skill" ] && [ "$FORCE" != "--force" ]; then
            echo -e "  ${GRAY}[SKIP] $skill_name — já existe (use --force para sobrescrever)${NC}"
            continue
        fi

        mkdir -p "$target_skill"
        cp "$skill_dir/SKILL.md" "$target_skill/"
        echo -e "  ${GREEN}[OK]   $skill_name${NC}"
    fi
done

# Copiar templates
echo ""
echo -e "${GREEN}Copiando templates...${NC}"
if [ -d "$TEMPLATES_SOURCE" ]; then
    cp -r "$TEMPLATES_SOURCE/"* "$TARGET_GENESIS_TEMPLATES/" 2>/dev/null || true
    echo -e "  ${GREEN}[OK]   templates${NC}"
fi

# Criar CLAUDE.md se não existir
CLAUDE_MD="$TARGET_PATH/CLAUDE.md"
if [ ! -f "$CLAUDE_MD" ]; then
    cat > "$CLAUDE_MD" << 'EOF'
# Genesis

> Genesis Framework instalado neste projeto.

## Como usar

Digite `/genesis` para iniciar ou retomar a construção do projeto.

## Comportamento ao ativar

Quando o usuário digitar `/genesis`:
1. Ative o skill `genesis` disponível em `.agents/skills/genesis/SKILL.md`
2. Siga as instruções do orquestrador Genesis

## Regra não-negociável

Nunca apague ou sobrescreva arquivos existentes do projeto sem confirmação explícita.
O Genesis escreve principalmente em `.genesis/` e nos diretórios de código gerado.
EOF
    echo ""
    echo -e "  ${GREEN}[OK]   CLAUDE.md criado${NC}"
else
    echo ""
    echo -e "  ${GRAY}[SKIP] CLAUDE.md — já existe${NC}"
    echo -e "         ${YELLOW}Adicione ao seu CLAUDE.md: 'Digite /genesis para usar o Genesis Framework'${NC}"
fi

# Criar .genesis/state.json
mkdir -p "$TARGET_PATH/.genesis"
STATE_PATH="$TARGET_PATH/.genesis/state.json"
if [ ! -f "$STATE_PATH" ]; then
    echo '{}' > "$STATE_PATH"
fi

# Atualizar .gitignore
GITIGNORE="$TARGET_PATH/.gitignore"
if [ -f "$GITIGNORE" ]; then
    if ! grep -q ".genesis/memory" "$GITIGNORE"; then
        cat >> "$GITIGNORE" << 'EOF'

# Genesis Framework (runtime files)
.genesis/memory/
.genesis/state.json
EOF
        echo -e "  ${GREEN}[OK]   .gitignore atualizado${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Genesis Framework instalado com sucesso!${NC}"
echo ""
echo -e "${CYAN}Próximos passos:${NC}"
echo "  1. Abra Claude Code neste projeto"
echo "  2. Digite: /genesis"
echo "  3. O Genesis vai iniciar o intake do projeto"
echo ""
echo -e "${CYAN}Comandos disponíveis:${NC}"
echo "  /genesis           — iniciar ou retomar"
echo "  /genesis-architect — apenas arquitetura"
echo "  /genesis-sprint    — executar próximo sprint"
echo "  /genesis-qa        — gerar/rodar testes"
echo "  /genesis-guard     — auditar conformidade"
echo "  /genesis-reviewer  — code review"
echo "  /genesis-docs      — gerar documentação"
echo ""
