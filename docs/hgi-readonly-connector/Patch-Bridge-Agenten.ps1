<#
  HGI Immobilien GmbH – Claude-Connector "hgi-datenbank-readonly"
  Patch: Bridge akzeptiert statt nur 'claude-readonly' eine feste Liste persönlicher Agenten.

  - Nur auf dem Referenz-PC (Edgard) ausführen; die gepatchte Bridge wird danach
    über die Freigabe an die übrigen Arbeitsplätze verteilt.
  - Legt vorher eine Sicherung an, ändert nur die Agentenprüfung,
    die Prüfung von Endpunkt, Zertifikat und Werkzeugliste bleibt unverändert.
  - Mit -MitWissensEintrag werden zusätzlich 'save_knowledge' und 'update_own_knowledge'
    in ALLOWED_TOOLS aufgenommen (Entscheidung Edgard 09.10.2026: jeder darf Wissenseinträge anlegen).
    ERST ausführen, wenn der Server diese beiden Werkzeuge für ALLE Identitäten freigeschaltet hat –
    sonst lehnt die Bridge ab ("Unexpected HGI tool set") und der Connector fällt aus.
  - Mit -ZusatzWerkzeuge 'name1','name2' werden weitere, vom Server bestätigte Werkzeuge ergänzt
    (Entscheidung 09.10.2026: create_ticket, update_ticket, send_mail, create_calendar_event).
    Gleiche Regel: erst Server, dann Bridge.
  - Mit -Trockenlauf wird nur angezeigt, was geändert würde.
  Stand: 09.10.2026 (Wissenseintrag ergänzt)
#>
param(
    [string]$Bridge = 'C:\ProgramData\HGI-Claude-Readonly\hgi_readonly_bridge.py',
    [switch]$MitWissensEintrag,
    [ValidatePattern('^[a-z_]+$')][string[]]$ZusatzWerkzeuge = @(),
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

$text2 = $text
$block = ''
if ($text.Contains('ALLOWED_AGENTS')) {
    Write-Host 'Agentenpruefung ist bereits gepatcht.'
} else {
    if (-not $text.Contains($alt))             { throw "Erwartete Zeile nicht gefunden: $alt - Bridge weicht ab, bitte nicht patchen." }
    if (-not $text.Contains('def connector(')) { throw "'def connector(' nicht gefunden - Bridge weicht ab." }
    $liste = ($Agenten | ForEach-Object { "'$_'" }) -join ','
    $block = "ALLOWED_AGENTS={$liste}$nl$nl"
    $text2 = $text2.Replace($alt, $neu)
    $text2 = $text2.Insert($text2.IndexOf('def connector('), $block)
}

$gewuenscht = @()
if ($MitWissensEintrag) { $gewuenscht += 'save_knowledge','update_own_knowledge' }
$gewuenscht += $ZusatzWerkzeuge
$fehlend = @($gewuenscht | Select-Object -Unique | Where-Object { -not $text2.Contains("'$_'") })
$wissen = ''
if ($fehlend.Count -gt 0) {
    $m = [regex]::Match($text2, "(?s)ALLOWED_TOOLS=\{.*?\}")
    if (-not $m.Success) { throw 'ALLOWED_TOOLS nicht gefunden - Bridge weicht ab.' }
    $wissen = '    ' + (($fehlend | ForEach-Object { "'$_'" }) -join ',') + ",$nl"
    $text2  = $text2.Insert($m.Index + $m.Length - 1, $wissen)
} elseif ($gewuenscht.Count -gt 0) {
    Write-Host 'Gewuenschte Werkzeuge sind bereits in ALLOWED_TOOLS.'
}

if ($text2 -eq $text) { Write-Host 'Nichts zu tun.'; return }

if ($Trockenlauf) {
    Write-Host "TROCKENLAUF - es wird nichts geschrieben." -ForegroundColor Yellow
    if ($block)  { Write-Host "Neu vor 'def connector(':"; Write-Host $block; Write-Host "Ersetzt:  $alt"; Write-Host "durch:    $neu" }
    if ($wissen) { Write-Host "In ALLOWED_TOOLS ergaenzt:"; Write-Host $wissen }
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
