<#
    Clone-HGI-Repo.ps1
    Klont das GitHub-Repo hgihausverwaltung-create/hgi lokal und bereitet
    es fuer die Arbeit mit Claude Code vor.
    Voraussetzung: Claude Code ist bereits installiert (siehe Install-ClaudeCode.ps1).
    Ausfuehren in PowerShell: .\Clone-HGI-Repo.ps1
#>

[CmdletBinding()]
param(
    [string]$TargetPath = "C:\HGI",
    [string]$Repo = "hgihausverwaltung-create/hgi"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-CommandExists {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

# 1. Git pruefen
Write-Step "Pruefe Git"
if (Test-CommandExists "git") {
    Write-Host "Git gefunden: $(git --version)" -ForegroundColor Green
} else {
    Write-Warning "Git wurde nicht gefunden."
    if (Test-CommandExists "winget") {
        $answer = Read-Host "Git jetzt per winget installieren? (j/n)"
        if ($answer -eq "j") {
            winget install --id Git.Git -e --source winget
        } else {
            Write-Error "Ohne Git kann das Repo nicht geklont werden. Abbruch."
        }
    } else {
        Write-Error "Bitte Git manuell installieren: https://git-scm.com/downloads/win"
    }
}

# 2. GitHub CLI pruefen/installieren
Write-Step "Pruefe GitHub CLI (gh)"
if (Test-CommandExists "gh") {
    Write-Host "GitHub CLI gefunden: $(gh --version | Select-Object -First 1)" -ForegroundColor Green
} else {
    Write-Warning "GitHub CLI (gh) wurde nicht gefunden."
    if (Test-CommandExists "winget") {
        $answer = Read-Host "GitHub CLI jetzt per winget installieren? (j/n)"
        if ($answer -eq "j") {
            winget install --id GitHub.cli -e --source winget
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + `
                        [System.Environment]::GetEnvironmentVariable("Path", "User")
        } else {
            Write-Error "Ohne die GitHub CLI kann die Anmeldung nicht automatisiert werden. Abbruch."
        }
    } else {
        Write-Error "Bitte GitHub CLI manuell installieren: https://cli.github.com"
    }
}

if (-not (Test-CommandExists "gh")) {
    Write-Error "Der Befehl 'gh' ist weiterhin nicht verfuegbar. Bitte PowerShell neu starten und Skript erneut ausfuehren."
    exit 1
}

# 3. GitHub-Authentifizierung
Write-Step "Pruefe GitHub-Anmeldung"
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Du bist noch nicht bei GitHub angemeldet. Es oeffnet sich gleich der Browser."
    gh auth login --web -h github.com
} else {
    Write-Host "Du bist bereits bei GitHub angemeldet." -ForegroundColor Green
}
gh auth status

# 4. Zielordner pruefen
Write-Step "Pruefe Zielordner '$TargetPath'"
if (Test-Path $TargetPath) {
    if (Test-Path (Join-Path $TargetPath ".git")) {
        Write-Host "Ordner existiert bereits und ist ein Git-Repo." -ForegroundColor Yellow
        $answer = Read-Host "Aenderungen vom Remote nachladen (git fetch)? (j/n)"
        if ($answer -eq "j") {
            Push-Location $TargetPath
            git fetch origin
            Pop-Location
        }
        Write-Host "Ueberspringe Klonen, da Ordner bereits existiert."
        $skipClone = $true
    } else {
        Write-Error "Der Ordner '$TargetPath' existiert bereits, ist aber kein Git-Repo. Bitte anderen Zielpfad waehlen oder Ordner pruefen. Abbruch."
        exit 1
    }
} else {
    $skipClone = $false
}

# 5. Repo klonen
if (-not $skipClone) {
    Write-Step "Klone Repo '$Repo' nach '$TargetPath'"
    gh repo clone $Repo $TargetPath
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Klonen fehlgeschlagen. Bitte Fehlermeldung oben pruefen."
        exit 1
    }
    Write-Host "Repo erfolgreich geklont." -ForegroundColor Green
}

# 6. Default-Branch ermitteln
Write-Step "Ermittle Standard-Branch des Repos"
$defaultBranch = gh repo view $Repo --json defaultBranchRef -q ".defaultBranchRef.name"
if ([string]::IsNullOrWhiteSpace($defaultBranch)) {
    Write-Warning "Standard-Branch konnte nicht ermittelt werden."
} else {
    Write-Host "Standard-Branch: $defaultBranch" -ForegroundColor Green
}

Push-Location $TargetPath
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Aktuell ausgecheckter Branch: $currentBranch"
Pop-Location

# 7. Abschluss
Write-Step "Fertig"
Write-Host "Repo liegt unter: $TargetPath" -ForegroundColor Yellow
Write-Host "Aktueller Branch: $currentBranch" -ForegroundColor Yellow
Write-Host ""
Write-Host "Hinweis: Falls du an der bisherigen Session weiterarbeiten willst, wechsle in diesen Branch:"
Write-Host "  git checkout claude/powershell-claude-code-integration-51gde3"
Write-Host ""
Write-Host "Naechste Schritte:" -ForegroundColor Yellow
Write-Host "  cd $TargetPath"
Write-Host "  claude"
