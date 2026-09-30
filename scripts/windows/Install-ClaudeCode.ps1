<#
    Install-ClaudeCode.ps1
    Installiert Claude Code auf Windows und prüft die Voraussetzungen.
    Ausführen in PowerShell (nicht CMD): .\Install-ClaudeCode.ps1
#>

[CmdletBinding()]
param(
    [switch]$SkipGitCheck
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

# 1. PowerShell-Version prüfen
Write-Step "Pruefe PowerShell-Version"
$psVersion = $PSVersionTable.PSVersion
Write-Host "Gefundene PowerShell-Version: $psVersion"
if ($psVersion.Major -lt 5) {
    Write-Warning "PowerShell 5.1 oder neuer wird empfohlen. Bitte aktualisiere PowerShell: https://aka.ms/PSWindows"
}

# 2. Execution Policy pruefen (nur informativ, keine Aenderung ohne Rueckfrage)
Write-Step "Pruefe Execution Policy"
$currentPolicy = Get-ExecutionPolicy -Scope CurrentUser
Write-Host "Aktuelle Execution Policy (CurrentUser): $currentPolicy"
if ($currentPolicy -eq "Restricted") {
    Write-Warning "Deine Execution Policy ist 'Restricted'. Skripte koennen dadurch blockiert werden."
    $answer = Read-Host "Soll die Policy fuer deinen Benutzer auf 'RemoteSigned' gesetzt werden? (j/n)"
    if ($answer -eq "j") {
        Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
        Write-Host "Execution Policy wurde auf 'RemoteSigned' gesetzt." -ForegroundColor Green
    }
}

# 3. Git for Windows pruefen (empfohlen, aber optional)
if (-not $SkipGitCheck) {
    Write-Step "Pruefe Git for Windows"
    if (Test-CommandExists "git") {
        $gitVersion = (git --version)
        Write-Host "Git gefunden: $gitVersion" -ForegroundColor Green
    } else {
        Write-Warning "Git wurde nicht gefunden. Claude Code nutzt ohne Git PowerShell statt Bash."
        if (Test-CommandExists "winget") {
            $answer = Read-Host "Git jetzt per winget installieren? (j/n)"
            if ($answer -eq "j") {
                winget install --id Git.Git -e --source winget
            }
        } else {
            Write-Host "Bitte Git manuell installieren: https://git-scm.com/downloads/win"
        }
    }
}

# 4. Claude Code installieren
Write-Step "Installiere Claude Code"
if (Test-CommandExists "claude") {
    $existing = claude --version
    Write-Host "Claude Code ist bereits installiert: $existing" -ForegroundColor Green
    $answer = Read-Host "Trotzdem neu installieren/aktualisieren? (j/n)"
    if ($answer -ne "j") {
        Write-Host "Installation uebersprungen."
    } else {
        Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression
    }
} else {
    Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression
}

# 5. PATH fuer die aktuelle Session neu laden, damit "claude" sofort erkannt wird
Write-Step "Aktualisiere PATH fuer diese Session"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + `
            [System.Environment]::GetEnvironmentVariable("Path", "User")

# 6. Installation verifizieren
Write-Step "Verifiziere Installation"
if (Test-CommandExists "claude") {
    $version = claude --version
    Write-Host "Claude Code erfolgreich installiert: $version" -ForegroundColor Green
} else {
    Write-Warning "Der Befehl 'claude' wurde nicht gefunden. Bitte PowerShell neu starten und erneut pruefen."
    exit 1
}

# 7. Naechste Schritte anzeigen
Write-Step "Fertig"
Write-Host "Naechste Schritte:" -ForegroundColor Yellow
Write-Host "  1. Wechsle in dein Projektverzeichnis, z. B.:"
Write-Host "     cd C:\Pfad\zu\deinem\Projekt"
Write-Host "  2. Starte Claude Code:"
Write-Host "     claude"
Write-Host "  3. Beim ersten Start oeffnet sich der Browser zur Anmeldung mit deinem Claude-Konto."
