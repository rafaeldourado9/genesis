# Genesis Framework — Install Script (Windows PowerShell)
# Copia os skills Genesis para um projeto existente ou novo

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",

    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

$GenesisRoot = $PSScriptRoot
$SkillsSource = Join-Path $GenesisRoot ".agents\skills"
$TemplatesSource = Join-Path $GenesisRoot "templates"

# Resolver caminho absoluto do projeto alvo
$TargetPath = Resolve-Path $ProjectPath -ErrorAction SilentlyContinue
if (-not $TargetPath) {
    $TargetPath = $ProjectPath
}

Write-Host ""
Write-Host "Genesis Framework Installer" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Instalando em: $TargetPath" -ForegroundColor Yellow
Write-Host ""

# Verificar se é um projeto (tem algum indicador)
$isProject = (Test-Path (Join-Path $TargetPath "package.json")) -or
             (Test-Path (Join-Path $TargetPath "pyproject.toml")) -or
             (Test-Path (Join-Path $TargetPath "go.mod")) -or
             (Test-Path (Join-Path $TargetPath "pom.xml")) -or
             (Test-Path (Join-Path $TargetPath ".git")) -or
             $Force

if (-not $isProject) {
    $confirm = Read-Host "Diretório não parece ser um projeto. Continuar mesmo assim? (s/n)"
    if ($confirm -ne "s") {
        Write-Host "Instalação cancelada." -ForegroundColor Red
        exit 0
    }
}

# Criar diretórios alvo
$TargetSkills = Join-Path $TargetPath ".agents\skills"
$TargetGenesisTemplates = Join-Path $TargetPath ".genesis\templates"

New-Item -ItemType Directory -Force -Path $TargetSkills | Out-Null
New-Item -ItemType Directory -Force -Path $TargetGenesisTemplates | Out-Null

# Copiar skills Genesis
Write-Host "Copiando skills..." -ForegroundColor Green
$skillDirs = Get-ChildItem -Path $SkillsSource -Directory | Where-Object { $_.Name -like "genesis*" }

foreach ($skillDir in $skillDirs) {
    $targetSkillDir = Join-Path $TargetSkills $skillDir.Name

    if ((Test-Path $targetSkillDir) -and -not $Force) {
        Write-Host "  [SKIP] $($skillDir.Name) — já existe (use -Force para sobrescrever)" -ForegroundColor Gray
        continue
    }

    New-Item -ItemType Directory -Force -Path $targetSkillDir | Out-Null
    Copy-Item -Path (Join-Path $skillDir.FullName "SKILL.md") -Destination $targetSkillDir -Force
    Write-Host "  [OK]   $($skillDir.Name)" -ForegroundColor Green
}

# Copiar templates
Write-Host ""
Write-Host "Copiando templates..." -ForegroundColor Green
if (Test-Path $TemplatesSource) {
    Copy-Item -Path "$TemplatesSource\*" -Destination $TargetGenesisTemplates -Force
    Write-Host "  [OK]   templates" -ForegroundColor Green
}

# Criar CLAUDE.md se não existir
$claudeMdPath = Join-Path $TargetPath "CLAUDE.md"
if (-not (Test-Path $claudeMdPath)) {
    $claudeMdContent = @"
# Genesis

> Genesis Framework instalado neste projeto.

## Como usar

Digite ``/genesis`` para iniciar ou retomar a construção do projeto.

## Comportamento ao ativar

Quando o usuário digitar ``/genesis``:
1. Ative o skill ``genesis`` disponível em ``.agents/skills/genesis/SKILL.md``
2. Siga as instruções do orquestrador Genesis

## Regra não-negociável

Nunca apague ou sobrescreva arquivos existentes do projeto sem confirmação explícita.
O Genesis escreve principalmente em ``.genesis/`` e nos diretórios de código gerado.
"@
    Set-Content -Path $claudeMdPath -Value $claudeMdContent -Encoding UTF8
    Write-Host ""
    Write-Host "  [OK]   CLAUDE.md criado" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  [SKIP] CLAUDE.md — já existe" -ForegroundColor Gray
    Write-Host "         Adicione ao seu CLAUDE.md: 'Digite /genesis para usar o Genesis Framework'" -ForegroundColor Yellow
}

# Criar .genesis/state.json vazio
$stateDir = Join-Path $TargetPath ".genesis"
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
$statePath = Join-Path $stateDir "state.json"
if (-not (Test-Path $statePath)) {
    '{}' | Set-Content -Path $statePath -Encoding UTF8
}

# Criar .gitignore entry
$gitignorePath = Join-Path $TargetPath ".gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    if ($gitignoreContent -notmatch "\.genesis/memory") {
        Add-Content -Path $gitignorePath -Value "`n# Genesis Framework (runtime files)`n.genesis/memory/`n.genesis/state.json"
        Write-Host "  [OK]   .gitignore atualizado" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Genesis Framework instalado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Abra Claude Code neste projeto" -ForegroundColor White
Write-Host "  2. Digite: /genesis" -ForegroundColor White
Write-Host "  3. O Genesis vai iniciar o intake do projeto" -ForegroundColor White
Write-Host ""
Write-Host "Comandos disponíveis:" -ForegroundColor Cyan
Write-Host "  /genesis           — iniciar ou retomar" -ForegroundColor White
Write-Host "  /genesis-architect — apenas arquitetura" -ForegroundColor White
Write-Host "  /genesis-sprint    — executar próximo sprint" -ForegroundColor White
Write-Host "  /genesis-qa        — gerar/rodar testes" -ForegroundColor White
Write-Host "  /genesis-guard     — auditar conformidade" -ForegroundColor White
Write-Host "  /genesis-reviewer  — code review" -ForegroundColor White
Write-Host "  /genesis-docs      — gerar documentação" -ForegroundColor White
Write-Host ""
