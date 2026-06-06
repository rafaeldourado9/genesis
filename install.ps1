# Genesis Framework installer for Windows
param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectPath = ".",
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false,
    [Parameter(Mandatory=$false)]
    [switch]$Global = $false
)

$Cli = Join-Path $PSScriptRoot "bin\genesis.js"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js 16+ e necessario para instalar o Genesis."
    exit 1
}

$Arguments = @($Cli)
if ($Global) {
    $Arguments += "global"
} else {
    $Arguments += @("init", $ProjectPath)
}
if ($Force) {
    $Arguments += "--force"
}

& node @Arguments
exit $LASTEXITCODE
