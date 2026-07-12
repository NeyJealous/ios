[CmdletBinding()]
param(
    [string]$ProjectPath = "",
    [switch]$SkipNetwork
)

$ErrorActionPreference = "Continue"
$results = [System.Collections.Generic.List[object]]::new()

function Add-Result {
    param(
        [string]$Category,
        [string]$Name,
        [string]$Status,
        [string]$Value,
        [bool]$Required = $true,
        [string]$Details = ""
    )
    $results.Add([pscustomobject]@{
        Category = $Category
        Name = $Name
        Status = $Status
        Value = $Value
        Required = $Required
        Details = $Details
    })
}

function Get-CommandVersion {
    param([string]$Command, [string[]]$Arguments = @("--version"))
    $cmd = Get-Command $Command -ErrorAction SilentlyContinue
    if (-not $cmd) { return $null }
    try {
        $output = & $Command @Arguments 2>&1 | Select-Object -First 1
        return [string]$output
    } catch {
        return "FOUND_BUT_VERSION_FAILED: $($_.Exception.Message)"
    }
}

Write-Host "IOS Windows environment check" -ForegroundColor Cyan
Write-Host "Read-only: no software installation, no token reading." -ForegroundColor DarkGray

$os = Get-CimInstance Win32_OperatingSystem
$computer = Get-CimInstance Win32_ComputerSystem
Add-Result "System" "Windows" "PASS" "$($os.Caption) $($os.Version) build $($os.BuildNumber)" $true
Add-Result "System" "Architecture" "PASS" "$env:PROCESSOR_ARCHITECTURE" $true
Add-Result "System" "RAM" "INFO" ("{0:N1} GB" -f ($computer.TotalPhysicalMemory / 1GB)) $false

$toolDefinitions = @(
    @{ Name = "winget"; Command = "winget"; Args = @("--version"); Required = $true },
    @{ Name = "PowerShell 7"; Command = "pwsh"; Args = @("--version"); Required = $true },
    @{ Name = "Git"; Command = "git"; Args = @("--version"); Required = $true },
    @{ Name = "Node.js"; Command = "node"; Args = @("--version"); Required = $true },
    @{ Name = "npm"; Command = "npm"; Args = @("--version"); Required = $true },
    @{ Name = "clasp"; Command = "clasp"; Args = @("--version"); Required = $true },
    @{ Name = "Codex CLI"; Command = "codex"; Args = @("--version"); Required = $true },
    @{ Name = "VS Code"; Command = "code"; Args = @("--version"); Required = $true }
)

foreach ($tool in $toolDefinitions) {
    $version = Get-CommandVersion -Command $tool.Command -Arguments $tool.Args
    if ($null -eq $version) {
        Add-Result "Tools" $tool.Name "FAIL" "NOT_FOUND" $tool.Required "Command '$($tool.Command)' is not available in PATH."
    } else {
        Add-Result "Tools" $tool.Name "PASS" $version $tool.Required
    }
}

$nodeVersionRaw = Get-CommandVersion -Command "node" -Arguments @("--version")
if ($nodeVersionRaw -match "v?(\d+)\.") {
    $major = [int]$matches[1]
    Add-Result "Compatibility" "Node.js major >= 22" $(if ($major -ge 22) {"PASS"} else {"FAIL"}) "$major" $true
}

if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitName = git config --global user.name 2>$null
    $gitEmail = git config --global user.email 2>$null
    Add-Result "Git" "user.name" $(if ($gitName) {"PASS"} else {"FAIL"}) $(if ($gitName) {$gitName} else {"NOT_CONFIGURED"}) $true
    Add-Result "Git" "user.email" $(if ($gitEmail) {"PASS"} else {"FAIL"}) $(if ($gitEmail) {$gitEmail} else {"NOT_CONFIGURED"}) $true
}

if (Get-Command clasp -ErrorAction SilentlyContinue) {
    try {
        $help = (& clasp help 2>&1 | Out-String)
        foreach ($requiredCommand in @("login", "pull", "push", "run-function")) {
            $found = $help -match [regex]::Escape($requiredCommand)
            Add-Result "clasp" "Command: $requiredCommand" $(if ($found) {"PASS"} else {"FAIL"}) $(if ($found) {"AVAILABLE"} else {"MISSING"}) $true
        }
        $statusCommand = ($help -match "show-file-status") -or ($help -match "\bstatus\b")
        Add-Result "clasp" "File status command" $(if ($statusCommand) {"PASS"} else {"FAIL"}) $(if ($statusCommand) {"AVAILABLE"} else {"MISSING"}) $true
        $deployCommand = ($help -match "list-deployments") -or ($help -match "\bdeployments\b")
        Add-Result "clasp" "Deployment list command" $(if ($deployCommand) {"PASS"} else {"FAIL"}) $(if ($deployCommand) {"AVAILABLE"} else {"MISSING"}) $true
    } catch {
        Add-Result "clasp" "Help inspection" "FAIL" $_.Exception.Message $true
    }
}

if (-not $SkipNetwork) {
    foreach ($hostName in @(
        "github.com",
        "registry.npmjs.org",
        "script.google.com",
        "oauth2.googleapis.com",
        "chatgpt.com"
    )) {
        try {
            $test = Test-NetConnection -ComputerName $hostName -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
            Add-Result "Network" "$hostName`:443" $(if ($test) {"PASS"} else {"FAIL"}) $(if ($test) {"REACHABLE"} else {"UNREACHABLE"}) $true
        } catch {
            Add-Result "Network" "$hostName`:443" "FAIL" $_.Exception.Message $true
        }
    }
}

$resolvedProjectPath = $null
if ($ProjectPath) {
    try {
        $resolvedProjectPath = (Resolve-Path $ProjectPath -ErrorAction Stop).Path
        Add-Result "Project" "Project path" "PASS" $resolvedProjectPath $true
    } catch {
        Add-Result "Project" "Project path" "FAIL" $ProjectPath $true "Path does not exist."
    }
} else {
    Add-Result "Project" "Project path" "INFO" "NOT_PROVIDED" $false
}

if ($resolvedProjectPath) {
    $requiredFiles = @(".gitignore", ".clasp.json", ".claspignore", "appsscript.json", "AGENTS.md")
    foreach ($file in $requiredFiles) {
        $found = Get-ChildItem -Path $resolvedProjectPath -Filter $file -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
        Add-Result "Project" $file $(if ($found) {"PASS"} else {"FAIL"}) $(if ($found) {$found.FullName.Replace($resolvedProjectPath, ".")} else {"MISSING"}) $true
    }

    $isGitRepo = Test-Path (Join-Path $resolvedProjectPath ".git")
    Add-Result "Project" "Git repository" $(if ($isGitRepo) {"PASS"} else {"FAIL"}) $(if ($isGitRepo) {"FOUND"} else {"MISSING"}) $true

    $claspPath = Get-ChildItem -Path $resolvedProjectPath -Filter ".clasp.json" -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($claspPath) {
        try {
            $claspConfig = Get-Content $claspPath.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
            $scriptId = [string]$claspConfig.scriptId
            $suffix = if ($scriptId.Length -gt 6) { "..." + $scriptId.Substring($scriptId.Length - 6) } else { "CONFIGURED" }
            Add-Result "Project" "clasp scriptId" $(if ($scriptId) {"PASS"} else {"FAIL"}) $(if ($scriptId) {$suffix} else {"EMPTY"}) $true
            Add-Result "Project" "clasp rootDir" "INFO" ([string]$claspConfig.rootDir) $false
        } catch {
            Add-Result "Project" ".clasp.json JSON" "FAIL" $_.Exception.Message $true
        }
    }

    $manifestPath = Get-ChildItem -Path $resolvedProjectPath -Filter "appsscript.json" -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($manifestPath) {
        try {
            $manifest = Get-Content $manifestPath.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
            Add-Result "Project" "Apps Script runtime" $(if ($manifest.runtimeVersion -eq "V8") {"PASS"} else {"WARN"}) ([string]$manifest.runtimeVersion) $true
            $hasExecutionApi = $null -ne $manifest.executionApi
            Add-Result "Project" "executionApi" $(if ($hasExecutionApi) {"PASS"} else {"FAIL"}) $(if ($hasExecutionApi) {"CONFIGURED"} else {"MISSING"}) $true
        } catch {
            Add-Result "Project" "appsscript.json JSON" "FAIL" $_.Exception.Message $true
        }
    }

    $sensitivePatterns = @(".clasprc.json", "client_secret*.json", "credentials*.json", ".env", ".env.*", "*.token", "*.secret")
    $sensitiveFound = @()
    foreach ($pattern in $sensitivePatterns) {
        $sensitiveFound += Get-ChildItem -Path $resolvedProjectPath -Filter $pattern -Recurse -File -ErrorAction SilentlyContinue
    }
    $sensitiveFound = $sensitiveFound | Sort-Object FullName -Unique
    if ($sensitiveFound.Count -eq 0) {
        Add-Result "Security" "Sensitive files in repository" "PASS" "NONE_FOUND" $true
    } else {
        $names = ($sensitiveFound | ForEach-Object { $_.FullName.Replace($resolvedProjectPath, ".") }) -join "; "
        Add-Result "Security" "Sensitive files in repository" "FAIL" $names $true
    }

    $reportDir = Join-Path $resolvedProjectPath "docs\environment"
    New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
    $utf8TestPath = Join-Path $reportDir ".utf8-test.tmp"
    "Счета; Стратегии; Советник" | Set-Content -Path $utf8TestPath -Encoding utf8
    $utf8Content = Get-Content $utf8TestPath -Raw -Encoding UTF8
    Remove-Item $utf8TestPath -Force
    Add-Result "Encoding" "UTF-8 Russian text" $(if ($utf8Content -match "Стратегии") {"PASS"} else {"FAIL"}) "Счета / Стратегии / Советник" $true
}

$requiredFailures = @($results | Where-Object { $_.Required -and $_.Status -eq "FAIL" })
$ready = $requiredFailures.Count -eq 0
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"

if ($resolvedProjectPath) {
    $reportDir = Join-Path $resolvedProjectPath "docs\environment"
} else {
    $reportDir = Join-Path (Get-Location) "environment-report"
}
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

$summary = [pscustomobject]@{
    CheckedAt = $timestamp
    ReadyForCodex00 = $ready
    RequiredFailureCount = $requiredFailures.Count
    Results = $results
}

$jsonPath = Join-Path $reportDir "windows-toolchain-report.json"
$mdPath = Join-Path $reportDir "windows-toolchain-report.md"
$summary | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonPath -Encoding utf8

$md = [System.Collections.Generic.List[string]]::new()
$md.Add("# Windows Toolchain Report")
$md.Add("")
$md.Add("- Проверено: $timestamp")
$md.Add("- Готовность к CODEX-00: **$(if ($ready) {'Да'} else {'Нет'})**")
$md.Add("- Критических проблем: $($requiredFailures.Count)")
$md.Add("")
$md.Add("| Категория | Проверка | Статус | Значение | Обязательная |")
$md.Add("|---|---|---|---|---:|")
foreach ($r in $results) {
    $safeValue = ([string]$r.Value).Replace("|", "\|").Replace("`r", " ").Replace("`n", " ")
    $md.Add("| $($r.Category) | $($r.Name) | $($r.Status) | $safeValue | $(if ($r.Required) {'Да'} else {'Нет'}) |")
}
if (-not $ready) {
    $md.Add("")
    $md.Add("## Блокирующие проблемы")
    $md.Add("")
    foreach ($failure in $requiredFailures) {
        $md.Add("- **$($failure.Name):** $($failure.Value) $($failure.Details)")
    }
}
$md | Set-Content -Path $mdPath -Encoding utf8

$results | Format-Table Category, Name, Status, Value -AutoSize
Write-Host ""
Write-Host "Markdown report: $mdPath" -ForegroundColor Cyan
Write-Host "JSON report: $jsonPath" -ForegroundColor Cyan
Write-Host "Ready for CODEX-00: $ready" -ForegroundColor $(if ($ready) {"Green"} else {"Red"})

if (-not $ready) { exit 1 }
