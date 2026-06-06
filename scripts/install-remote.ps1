# Genesis Framework remote installer for Windows
# Usage: iwr -useb https://raw.githubusercontent.com/rafaeldourado9/genesis-skill/main/scripts/install-remote.ps1 | iex

param(
    [string]$Target = ".",
    [switch]$Global = $false
)

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js 16+ com npx e necessario. Instale em https://nodejs.org"
    exit 1
}

$Package = "github:rafaeldourado9/genesis-skill"
if ($Global) {
    & npx --yes $Package global
} else {
    & npx --yes $Package init $Target
}
exit $LASTEXITCODE
