[CmdletBinding()]
param([switch]$Apply)

$ErrorActionPreference = "Stop"

$packages = @(
    @{ Id = "Git.Git"; Name = "Git for Windows" },
    @{ Id = "OpenJS.NodeJS.LTS"; Name = "Node.js LTS" },
    @{ Id = "Microsoft.VisualStudioCode"; Name = "Visual Studio Code" },
    @{ Id = "Microsoft.PowerShell"; Name = "PowerShell 7" },
    @{ Id = "Microsoft.WindowsTerminal"; Name = "Windows Terminal" }
)

Write-Host "IOS Windows core tools installer" -ForegroundColor Cyan
Write-Host "Mode: $(if ($Apply) {'APPLY'} else {'PREVIEW ONLY'})" -ForegroundColor Yellow

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "WinGet is not available. Update App Installer/Windows before continuing."
}

foreach ($package in $packages) {
    Write-Host ""
    Write-Host "$($package.Name) [$($package.Id)]" -ForegroundColor Cyan
    winget list --id $package.Id --exact --accept-source-agreements 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Already installed." -ForegroundColor Green
        continue
    }

    $commandText = "winget install --id $($package.Id) --exact --accept-package-agreements --accept-source-agreements"
    if ($Apply) {
        winget install --id $package.Id --exact --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -ne 0) { throw "Installation failed: $($package.Id)" }
    } else {
        Write-Host $commandText -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "Global npm tools" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js/npm is not available in this terminal yet." -ForegroundColor Yellow
    Write-Host "Restart Windows or reopen PowerShell 7, then run this script again with -Apply."
    exit 0
}

$nodeVersion = (& node --version)
if ($nodeVersion -notmatch "v?(\d+)\.") { throw "Cannot determine Node.js version: $nodeVersion" }
if ([int]$matches[1] -lt 22) { throw "Node.js $nodeVersion is too old. clasp requires Node.js 22 or newer." }

if ($Apply) {
    npm install -g @google/clasp @openai/codex
    if ($LASTEXITCODE -ne 0) { throw "npm global installation failed." }
    clasp --version
    codex --version
} else {
    Write-Host "npm install -g @google/clasp @openai/codex" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Next: restart terminal and run Check-IOSDevEnvironment.ps1." -ForegroundColor Cyan
