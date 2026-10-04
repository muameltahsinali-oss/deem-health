<#
  Deem Health - one-command local setup & verification (Windows PowerShell 5.1+ / PowerShell 7).

    npm run setup            full setup: .env, database, install, migrate, seed, checks, build
    npm run verify           checks only: typecheck, lint, unit tests, production build

  (Before the first `npm install` you can run it directly:
     powershell -ExecutionPolicy Bypass -File scripts\setup.ps1)

  Everything is written to setup-log.txt (or verify-log.txt) in the project folder.
  Secrets (encryption key, admin password) are never written to the log.
#>
param([switch]$ChecksOnly)

$ErrorActionPreference = "Continue"
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:CI = ""   # keep Prisma/Next interactive-safe defaults

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$LogName = "setup-log.txt"
if ($ChecksOnly) { $LogName = "verify-log.txt" }
$Log = Join-Path $Root $LogName
$Results = New-Object System.Collections.ArrayList

function Write-Log([string]$Text) {
  Add-Content -Path $Log -Value $Text -Encoding UTF8
}

function Say([string]$Text, [string]$Color = "Gray") {
  Write-Host $Text -ForegroundColor $Color
  Write-Log $Text
}

function Invoke-Step([string]$Name, [string]$Command, [switch]$Critical) {
  Say ""
  Say "==> $Name" "Cyan"
  Write-Log "`$ $Command"
  $started = Get-Date
  $output = & cmd.exe /d /c "chcp 65001>nul & $Command 2>&1"
  $code = $LASTEXITCODE
  $seconds = [int]((Get-Date) - $started).TotalSeconds
  if ($output) { Write-Log (($output | ForEach-Object { "$_" }) -join "`r`n") }
  $status = "PASS"
  if ($code -ne 0) { $status = "FAIL" }
  Write-Log "[exit $code, ${seconds}s]"
  [void]$Results.Add([pscustomobject]@{ Step = $Name; Status = $status; Seconds = $seconds })
  if ($code -eq 0) {
    Say "    ok (${seconds}s)" "Green"
  } else {
    Say "    FAILED (exit $code) - last lines:" "Red"
    if ($output) { $output | Select-Object -Last 15 | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray } }
    if ($Critical) { Finish; exit 1 }
  }
  return ($code -eq 0)
}

function Finish {
  Say ""
  Say "================ SUMMARY ================" "Cyan"
  foreach ($r in $Results) {
    $color = "Green"; if ($r.Status -ne "PASS") { $color = "Red" }
    Say ("  {0,-4}  {1}" -f $r.Status, $r.Step) $color
  }
  Say "Full log: $Log"
  Say "Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

function Set-EnvValue([string]$Path, [string]$Key, [string]$Value) {
  $lines = Get-Content -Path $Path -Encoding UTF8
  $found = $false
  $out = foreach ($line in $lines) {
    if ($line -match "^\s*$Key\s*=") { $found = $true; "$Key=`"$Value`"" } else { $line }
  }
  if (-not $found) { $out += "$Key=`"$Value`"" }
  [System.IO.File]::WriteAllLines($Path, [string[]]$out, (New-Object System.Text.UTF8Encoding($false)))
}

function Get-EnvValue([string]$Path, [string]$Key) {
  foreach ($line in (Get-Content -Path $Path -Encoding UTF8)) {
    if ($line -match "^\s*$Key\s*=\s*`"?([^`"]*)`"?\s*$") { return $Matches[1] }
  }
  return ""
}

function New-Secret([int]$Bytes) {
  $buf = New-Object byte[] $Bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buf)
  return [Convert]::ToBase64String($buf)
}

function Test-Port([string]$HostName, [int]$Port) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $task = $client.ConnectAsync($HostName, $Port)
    $ok = $task.Wait(1500) -and $client.Connected
    $client.Close()
    return $ok
  } catch { return $false }
}

# ---------------------------------------------------------------------------
Set-Content -Path $Log -Value "Deem Health $LogName - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Encoding UTF8
Say "Deem Health - $(if ($ChecksOnly) { 'verification' } else { 'setup' })" "Cyan"
Write-Log "Folder: $Root"
Write-Log "OS: $([System.Environment]::OSVersion.VersionString)  PowerShell: $($PSVersionTable.PSVersion)"

# 1) Node.js
$nodeVersion = ""
try { $nodeVersion = (& node -v) 2>$null } catch {}
if (-not $nodeVersion) {
  Say "Node.js is not installed. Install Node.js 22 LTS from https://nodejs.org and run this again." "Red"
  exit 1
}
$npmVersion = ""
try { $npmVersion = (& cmd.exe /d /c "npm -v") 2>$null } catch {}
Say "Node $nodeVersion, npm $npmVersion"
$parts = $nodeVersion.TrimStart("v").Split(".")
if ([int]$parts[0] -lt 20 -or ([int]$parts[0] -eq 20 -and [int]$parts[1] -lt 9)) {
  Say "Node.js 20.9 or newer is required (22 LTS recommended): https://nodejs.org" "Red"
  exit 1
}

if (-not $ChecksOnly) {
  # 2) .env
  $envPath = Join-Path $Root ".env"
  if (-not (Test-Path $envPath)) {
    Copy-Item (Join-Path $Root ".env.example") $envPath
    Say "Created .env from .env.example"
  }
  if (-not (Get-EnvValue $envPath "APP_ENCRYPTION_KEY")) {
    Set-EnvValue $envPath "APP_ENCRYPTION_KEY" (New-Secret 32)
    Say "Generated APP_ENCRYPTION_KEY in .env"
  }
  $adminEmail = Get-EnvValue $envPath "ADMIN_EMAIL"
  $adminPassword = Get-EnvValue $envPath "ADMIN_PASSWORD"
  $newPassword = $false
  if ($adminPassword.Length -lt 10) {
    $adminPassword = ((New-Secret 12) -replace "[^A-Za-z0-9]", "") + "Dh7"
    Set-EnvValue $envPath "ADMIN_PASSWORD" $adminPassword
    $newPassword = $true
    Write-Log "Generated ADMIN_PASSWORD in .env (not logged)"
  }

  # 3) PostgreSQL
  $dbUrl = Get-EnvValue $envPath "DATABASE_URL"
  $dbHost = "localhost"; $dbPort = 5432
  if ($dbUrl -match "@([^:/?]+)(?::(\d+))?/") { $dbHost = $Matches[1]; if ($Matches[2]) { $dbPort = [int]$Matches[2] } }
  Say ""
  Say "==> Database at ${dbHost}:${dbPort}" "Cyan"
  if (-not (Test-Port $dbHost $dbPort)) {
    $isLocal = @("localhost", "127.0.0.1", "::1") -contains $dbHost
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($isLocal -and $docker) {
      $ok = Invoke-Step "Start PostgreSQL (docker compose up -d)" "docker compose up -d"
      if ($ok) {
        for ($i = 0; $i -lt 40 -and -not (Test-Port $dbHost $dbPort); $i++) { Start-Sleep -Seconds 2 }
        Start-Sleep -Seconds 3
      }
    }
    if (-not (Test-Port $dbHost $dbPort)) {
      Say "Cannot reach PostgreSQL at ${dbHost}:${dbPort}." "Red"
      Say "Choose one:" "Yellow"
      Say "  a) Install Docker Desktop (https://www.docker.com/products/docker-desktop/), start it, then run this again." "Yellow"
      Say "  b) Install PostgreSQL 16 (https://www.postgresql.org/download/windows/), create a database, and set DATABASE_URL in .env." "Yellow"
      Say "  c) Use a hosted database (Railway / Neon / Supabase) and paste its connection string into DATABASE_URL in .env." "Yellow"
      [void]$Results.Add([pscustomobject]@{ Step = "Database reachable"; Status = "FAIL"; Seconds = 0 })
      Finish
      exit 1
    }
  }
  Say "    PostgreSQL is reachable" "Green"
  [void]$Results.Add([pscustomobject]@{ Step = "Database reachable"; Status = "PASS"; Seconds = 0 })

  # 4) Install, migrate, seed
  Invoke-Step "Install dependencies (npm install)" "npm install --no-audit --no-fund" -Critical | Out-Null
  $hasMigrations = Test-Path (Join-Path $Root "prisma\migrations")
  if ($hasMigrations) {
    Invoke-Step "Apply database migrations" "npx prisma migrate dev --skip-seed" -Critical | Out-Null
  } else {
    Invoke-Step "Create database schema (first migration)" "npx prisma migrate dev --name init --skip-seed" -Critical | Out-Null
  }
  Invoke-Step "Seed demo data + admin account" "npm run db:seed" -Critical | Out-Null
} else {
  if (-not (Test-Path (Join-Path $Root "node_modules"))) {
    Invoke-Step "Install dependencies (npm install)" "npm install --no-audit --no-fund" -Critical | Out-Null
  } else {
    Invoke-Step "Sync dependencies (npm install)" "npm install --no-audit --no-fund" | Out-Null
  }
  Invoke-Step "Generate Prisma client" "npx prisma generate" | Out-Null
  if (Test-Path (Join-Path $Root "prisma\migrations")) {
    Invoke-Step "Apply database migrations" "npx prisma migrate dev --skip-seed" | Out-Null
  }
}

# 5) Quality checks + production build
Invoke-Step "Type check (tsc)" "npm run typecheck" | Out-Null
Invoke-Step "Lint (eslint)" "npm run lint" | Out-Null
Invoke-Step "Unit tests (vitest)" "npm test" | Out-Null
Invoke-Step "Production build (next build)" "npm run build" | Out-Null

Finish

if (-not $ChecksOnly) {
  Write-Host ""
  Write-Host "Start the store:   npm run dev" -ForegroundColor Cyan
  Write-Host "  Store:  http://localhost:3000" -ForegroundColor Cyan
  Write-Host "  Admin:  http://localhost:3000/admin" -ForegroundColor Cyan
  Write-Host "  Login:  $adminEmail" -ForegroundColor Cyan
  if ($newPassword) {
    Write-Host "  Password (generated, saved in .env as ADMIN_PASSWORD): $adminPassword" -ForegroundColor Yellow
  } else {
    Write-Host "  Password: ADMIN_PASSWORD from your .env" -ForegroundColor Cyan
  }
}
