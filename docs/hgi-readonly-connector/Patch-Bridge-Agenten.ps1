<#
  HGI Immobilien GmbH – Claude-Connector "hgi-datenbank-readonly"
  Patch: Bridge akzeptiert statt nur 'claude-readonly' eine feste Liste persönlicher Agenten.

  - Nur auf dem Referenz-PC (Edgard) ausführen; die gepatchte Bridge wird danach
    über die Freigabe an die übrigen Arbeitsplätze verteilt.
  - Legt vorher eine Sicherung an, ändert nur die Agentenprüfung,
    die Prüfung von Endpunkt, Zertifikat und Werkzeugliste bleibt unverändert.
  - Mit -Trockenlauf wird nur angezeigt, was geändert würde.
  Stand: 09.10.2026
#>
param(
    [string]$Bridge = 'C:\ProgramData\HGI-Claude-Readonly\hgi_readonly_bridge.py',
    [switch]$Trockenlauf
)
$ErrorActionPreference = 'Stop'

# Zugelassene Agenten-Identitäten (müssen 1:1 so auf dem Server angelegt sein)
$Agenten = @(
    'claude-readonly',          # Edgard Schröder (bestehend)
    'claude-leon-schroeder',    # Leon Schröder
    'claude-inna-goerz',        # Inna Görz
    'claude-marina-korotaev'    # Marina Korotaev
)

$text = [IO.File]::ReadAllText($Bridge)
$nl   = if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }

$alt = "config.get('agent')!='claude-readonly'"
$neu = "config.get('agent') not in ALLOWED_AGENTS"

if ($text.Contains('ALLOWED_AGENTS')) { Write-Host 'Bridge ist bereits gepatcht - nichts zu tun.'; return }
if (-not $text.Contains($alt))        { throw "Erwartete Zeile nicht gefunden: $alt - Bridge weicht ab, bitte nicht patchen." }
if (-not $text.Contains('def connector(')) { throw "'def connector(' nicht gefunden - Bridge weicht ab." }

$liste = ($Agenten | ForEach-Object { "'$_'" }) -join ','
$block = "ALLOWED_AGENTS={$liste}$nl$nl"

$text2 = $text.Replace($alt, $neu)
$idx   = $text2.IndexOf('def connector(')
$text2 = $text2.Insert($idx, $block)

if ($Trockenlauf) {
    Write-Host "TROCKENLAUF - es wird nichts geschrieben." -ForegroundColor Yellow
    Write-Host "Neu eingefuegt vor 'def connector(':"; Write-Host $block
    Write-Host "Ersetzt:  $alt"; Write-Host "durch:    $neu"
    return
}

$sicherung = "$Bridge.bak-agenten-$(Get-Date -Format yyyy-MM-dd_HHmm)"
Copy-Item $Bridge $sicherung
[IO.File]::WriteAllText($Bridge, $text2, (New-Object Text.UTF8Encoding $false))
Write-Host "Sicherung: $sicherung"

# Syntaxprüfung mit Python; bei Fehler Sicherung zurückspielen
$py = (Get-Command py -ErrorAction SilentlyContinue)
$pyArgs = if ($py) { @('-3','-m','py_compile',$Bridge) } else { @('-m','py_compile',$Bridge) }
$pyExe  = if ($py) { 'py' } else { 'python' }
& $pyExe @pyArgs
if ($LASTEXITCODE -ne 0) {
    Copy-Item $sicherung $Bridge -Force
    throw 'Syntaxpruefung fehlgeschlagen - Sicherung wurde zurueckgespielt.'
}
Write-Host 'Bridge gepatcht und Syntax geprueft.' -ForegroundColor Green
