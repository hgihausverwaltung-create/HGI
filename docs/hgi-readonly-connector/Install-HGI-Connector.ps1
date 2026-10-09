<#
  HGI Immobilien GmbH – Claude-Connector "hgi-datenbank-readonly" je Arbeitsplatz einrichten
  (nur lesender Zugriff auf die HGI-Plattform 192.168.50.17, nur im Büronetz/VPN)

  Ausführen: PowerShell als Administrator, angemeldet als der Mitarbeiter, der Claude Desktop nutzt.
    .\Install-HGI-Connector.ps1 -Agent claude-leon-schroeder -Quelle '<Freigabeordner mit Bridge und Zertifikat>'
    Erst mit -Trockenlauf testen.

  - Das persönliche Token wird verdeckt abgefragt und nur in die lokale access.json geschrieben.
    Es erscheint nie auf dem Bildschirm und wird nicht protokolliert.
  - Bestehende Dateien werden vorher gesichert (*.bak-JJJJ-MM-TT_HHMM).
  Stand: 09.10.2026
#>
param(
    [Parameter(Mandatory)][ValidateSet('claude-readonly','claude-leon-schroeder','claude-inna-goerz','claude-marina-korotaev')]
    [string]$Agent,
    [Parameter(Mandatory)][string]$Quelle,
    [string]$Ziel = 'C:\ProgramData\HGI-Claude-Readonly',
    [string]$ClaudeConfig = (Join-Path $env:APPDATA 'Claude\claude_desktop_config.json'),
    [switch]$Trockenlauf
)
$ErrorActionPreference = 'Stop'
$BaseUrl     = 'https://192.168.50.17/agent-api'
$CertName    = 'HGI_Server_Zertifikat.crt'
$CertThumb   = '6AFADB1B432D577C4F097C32897B6C46BA5B17CE'
$ConnName    = 'hgi-datenbank-readonly'
$Stempel     = Get-Date -Format 'yyyy-MM-dd_HHmm'
$Utf8        = New-Object Text.UTF8Encoding $false

function Schritt($t) { Write-Host "`n== $t" -ForegroundColor Cyan }
function Sichern($p) { if (Test-Path $p) { Copy-Item $p "$p.bak-$Stempel"; Write-Host "  Sicherung: $p.bak-$Stempel" } }

# 1. Voraussetzungen
Schritt '1. Voraussetzungen'
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { throw 'Bitte PowerShell als Administrator starten.' }
foreach ($f in 'hgi_readonly_bridge.py', $CertName) {
    if (-not (Test-Path (Join-Path $Quelle $f))) { throw "In der Quelle fehlt: $f" }
}
$py = $null
if (Get-Command py -ErrorAction SilentlyContinue) { $py = (& py -3 -c "import sys;print(sys.executable)").Trim() }
elseif (Get-Command python -ErrorAction SilentlyContinue) { $py = (& python -c "import sys;print(sys.executable)").Trim() }
if (-not $py -or -not (Test-Path $py)) { throw 'Python 3 nicht gefunden. Bitte Python 3.12 von python.org installieren (Haken "Add to PATH").' }
$ver = & $py -c "import sys;print('%d.%d'%sys.version_info[:2])"
if ([version]$ver -lt [version]'3.9') { throw "Python $ver ist zu alt (mindestens 3.9)." }
Write-Host "  Python: $py ($ver)"
$nc = Test-NetConnection 192.168.50.17 -Port 443 -WarningAction SilentlyContinue
if (-not $nc.TcpTestSucceeded) { throw 'Server 192.168.50.17:443 nicht erreichbar (Buero-Netz/VPN?).' }
Write-Host '  Server erreichbar.'

# 2. Zertifikat prüfen
Schritt '2. Zertifikat pruefen'
$c = New-Object Security.Cryptography.X509Certificates.X509Certificate2((Join-Path $Quelle $CertName))
if ($c.Thumbprint -ne $CertThumb) { throw "Zertifikat in der Quelle hat falschen Fingerabdruck ($($c.Thumbprint)). Abbruch." }
Write-Host "  Fingerabdruck ok, gueltig bis $($c.NotAfter.ToString('dd.MM.yyyy'))."

if ($Trockenlauf) {
    Schritt 'TROCKENLAUF - es wird nichts geschrieben'
    Write-Host "  Wuerde kopieren:  Bridge + Zertifikat nach $Ziel"
    Write-Host "  Wuerde anlegen:   $Ziel\access.json (agent=$Agent, Token verdeckt abgefragt)"
    Write-Host "  Wuerde eintragen: '$ConnName' in $ClaudeConfig"
    return
}

# 3. Dateien kopieren
Schritt '3. Dateien kopieren'
New-Item -ItemType Directory -Force -Path $Ziel | Out-Null
$bridge = Join-Path $Ziel 'hgi_readonly_bridge.py'
$cfg    = Join-Path $Ziel 'access.json'
Sichern $bridge; Sichern (Join-Path $Ziel $CertName); Sichern $cfg
Copy-Item (Join-Path $Quelle 'hgi_readonly_bridge.py') $bridge -Force
Copy-Item (Join-Path $Quelle $CertName) (Join-Path $Ziel $CertName) -Force
Write-Host "  Bridge und Zertifikat in $Ziel"

# 4. access.json mit persönlichem Token
Schritt '4. Persoenliches Token'
$sec = Read-Host "Token fuer $Agent eingeben (Eingabe bleibt unsichtbar)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
try { $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
if ([string]::IsNullOrWhiteSpace($token)) { throw 'Kein Token eingegeben.' }
$json = [ordered]@{ agent = $Agent; base_url = $BaseUrl; api_key = $token; certificate = $CertName } | ConvertTo-Json
[IO.File]::WriteAllText($cfg, $json, $Utf8)
Remove-Variable token, json
# Nur der angemeldete Benutzer, Administratoren und SYSTEM dürfen die Datei lesen
$me = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls $cfg /inheritance:r /grant:r "*${me}:(R)" "*S-1-5-32-544:(F)" "*S-1-5-18:(F)" | Out-Null
Write-Host '  access.json angelegt, Zugriff auf Benutzer/Administratoren beschraenkt.'

# 5. Claude Desktop eintragen
Schritt '5. Claude Desktop konfigurieren'
if (-not (Test-Path (Split-Path $ClaudeConfig))) { throw "Claude-Ordner nicht gefunden: $(Split-Path $ClaudeConfig). Claude Desktop einmal starten oder -ClaudeConfig angeben." }
Sichern $ClaudeConfig
$conf = if (Test-Path $ClaudeConfig) { Get-Content $ClaudeConfig -Raw | ConvertFrom-Json } else { [pscustomobject]@{} }
if (-not $conf.PSObject.Properties['mcpServers']) { $conf | Add-Member mcpServers ([pscustomobject]@{}) }
$eintrag = [pscustomobject]@{ command = $py; args = @($bridge, '--config', $cfg) }
if ($conf.mcpServers.PSObject.Properties[$ConnName]) { $conf.mcpServers.$ConnName = $eintrag }
else { $conf.mcpServers | Add-Member $ConnName $eintrag }
[IO.File]::WriteAllText($ClaudeConfig, ($conf | ConvertTo-Json -Depth 20), $Utf8)
Write-Host "  '$ConnName' eingetragen."

# 6. Funktionstest
Schritt '6. Funktionstest'
$init = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"install-test","version":"1"}}}'
$list = '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
$call = '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"hgi_table_schema","arguments":{"table":"Objekte"}}}'
$out = @($init, $list, $call) | & $py $bridge --config $cfg
$ok2 = $out | Where-Object { $_ -match '"id": 2' -and $_ -match '"tools"' }
$ok3 = $out | Where-Object { $_ -match '"id": 3' -and $_ -match '"result"' }
if ($ok2 -and $ok3) {
    Write-Host '  ERFOLG: Werkzeugliste und Testabfrage funktionieren.' -ForegroundColor Green
    Write-Host '  Jetzt Claude Desktop komplett beenden (auch im Infobereich) und neu starten.'
} else {
    Write-Host '  FEHLER: Test nicht bestanden. Ausgabe (ohne Token):' -ForegroundColor Red
    $out | ForEach-Object { Write-Host "  $_" }
    Write-Host '  Haeufige Ursachen: Agent auf dem Server nicht angelegt, Token falsch, Bridge nicht gepatcht (Unexpected agent identity).'
}
