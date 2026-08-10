<#
.SYNOPSIS
    HGI Duplikate-Finder Pro v2.2

.BESCHREIBUNG
    Durchsucht einen Datenbestand rekursiv nach echten Datei-Duplikaten anhand SHA256-Inhalts-Hash.
    Standard ist ein sicherer Testlauf. Der Echtlauf muss ausdruecklich mit -Echtlauf gestartet werden.
    Im Echtlauf werden Duplikate NICHT geloescht, sondern in einen externen Pruef-/Quarantaeneordner
    verschoben. Es werden CSV-, Restore-CSV-, HTML- und Log-Berichte erzeugt.

.NEU IN v2.2
    - Get-PathPriority vergleicht Pfadmuster jetzt trennzeichen-unabhaengig (wie bereits bei den
      Ausschlussordnern), damit die Prioritaeten nicht stumm auf "Standard" zurueckfallen, falls
      Pfade mit Forward-Slash statt Backslash verarbeitet werden.
    - Abschlussausgabe zeigt CSV- und Restore-CSV-Pfad nur noch an, wenn diese Dateien auch
      tatsaechlich geschrieben wurden (bei 0 gefundenen Duplikaten wurden diese Pfade vorher
      faelschlich mit angezeigt, obwohl die Dateien nicht existierten).

.NEU IN v2.1
    - Echtlauf nur noch ueber ausdruecklichen Schalter -Echtlauf (robuster als -DryRun:$false,
      das je nach Aufrufart verschluckt werden konnte und dann stumm im falschen Modus lief).
    - Vor-Hash-Optimierung: Bei Dateien > 64 KB wird zunaechst nur der Anfang gehasht.
      Der vollstaendige SHA256 wird nur berechnet, wenn der Vor-Hash uebereinstimmt.
      Das reduziert das Lesevolumen bei grossen Bestaenden erheblich.
    - Dateien ohne Lesezugriff werden nicht mehr stumm uebersprungen, sondern protokolliert
      (Log + Fehler-CSV).
    - Langpfad-Absicherung: Pfade ab 240 Zeichen werden unter Windows automatisch mit dem
      \\?\-Praefix angesprochen (auch fuer UNC-Pfade), um Fehler an der 260-Zeichen-Grenze
      zu vermeiden.
    - Fortschritts-Log: Alle 10.000 gehashte Dateien wird eine Log-Zeile geschrieben, damit
      der Fortschritt bei Nachtlaeufen nachvollziehbar ist.

.SICHERHEIT
    - Testlauf ist standardmaessig aktiv. Echtlauf nur mit -Echtlauf.
    - Keine Datei wird geloescht. Duplikate werden im Echtlauf nur verschoben.
    - Der Pruefordner darf nicht innerhalb des Quellordners liegen.
    - Restore-CSV wird erzeugt, damit ein Ruecktransport moeglich ist.
    - 0-Byte-Dateien werden uebersprungen.
    - Hash-Vergleich erfolgt nur bei gleicher Dateigroesse.

.BEISPIELE
    # Sicherer Testlauf mit Standardpfaden
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\HGI_Duplikate_Finder_Pro_v2_1.ps1

    # Echtlauf nach Pruefung des Berichts (ausdruecklicher Schalter)
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\HGI_Duplikate_Finder_Pro_v2_1.ps1 -Echtlauf

    # Abweichende Pfade
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\HGI_Duplikate_Finder_Pro_v2_1.ps1 -QuellOrdner "\\srvdb\daten" -PruefOrdner "\\srvdb\daten_Pruefordner_Duplikate"

.HINWEIS BETRIEB
    Fuer grosse Bestaende (mehrere hunderttausend Dateien) das Skript direkt auf dem Server
    ausfuehren (lokaler Plattenzugriff), z. B. nachts per Aufgabenplanung. Der Lauf ueber eine
    Netzwerkfreigabe funktioniert, dauert aber deutlich laenger, da alle Dateiinhalte fuer den
    Hash-Vergleich uebertragen werden muessen.
#>

[CmdletBinding()]
param(
    [string]$QuellOrdner = "\\srvdb\daten",
    [string]$PruefOrdner = "\\srvdb\daten_Pruefordner_Duplikate",
    [switch]$Echtlauf,
    [switch]$IncludeHidden,
    [switch]$IncludeSystem,
    [int]$TopHtmlRows = 500,
    [int]$VorHashBytes = 65536,
    [int]$FortschrittAlle = 10000
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"

# Testlauf ist Standard. Echtlauf nur bei ausdruecklichem Schalter.
$DryRun = -not $Echtlauf

# Plattform ermitteln (PS 5.1 kennt $IsWindows nicht, daher eigene Pruefung)
$script:OnWindows = ([System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT)

# -----------------------------
# Konfiguration HGI-Prioritaeten
# -----------------------------
# Niedrige Zahl = bevorzugt behalten. Hohe Zahl = bevorzugt in Quarantaene.
$KeepPriorityPatterns = @(
    @{ Pattern = "\Objekte\"; Priority = 10; Reason = "Objektakte" },
    @{ Pattern = "\WEG_Objekte\"; Priority = 10; Reason = "WEG-Objektakte" },
    @{ Pattern = "\Mietverwaltung\"; Priority = 20; Reason = "Mietverwaltung" },
    @{ Pattern = "\Gewerbe\"; Priority = 25; Reason = "Gewerbeverwaltung" },
    @{ Pattern = "\Dokumente\"; Priority = 35; Reason = "Dokumentenordner" },
    @{ Pattern = "\01_Eingang\"; Priority = 40; Reason = "Eingang" }
)

$MovePriorityPatterns = @(
    @{ Pattern = "\Downloads\"; Priority = 900; Reason = "Downloads" },
    @{ Pattern = "\Desktop\"; Priority = 900; Reason = "Desktop" },
    @{ Pattern = "\Temp\"; Priority = 920; Reason = "Temp" },
    @{ Pattern = "\tmp\"; Priority = 920; Reason = "Temp" },
    @{ Pattern = "\Scan\"; Priority = 850; Reason = "Scan" },
    @{ Pattern = "\Scans\"; Priority = 850; Reason = "Scans" },
    @{ Pattern = "\Backup\"; Priority = 880; Reason = "Backup" },
    @{ Pattern = "\_Backup\"; Priority = 880; Reason = "Backup" },
    @{ Pattern = "\Alt\"; Priority = 870; Reason = "Altbestand" },
    @{ Pattern = "\Archiv_alt\"; Priority = 870; Reason = "Altarchiv" },
    @{ Pattern = "\Kopien\"; Priority = 860; Reason = "Kopien" },
    @{ Pattern = "\Kopie\"; Priority = 860; Reason = "Kopie" }
)

$ExcludeFolderNames = @(
    "_DUPLIKATE_QUARANTAENE",
    "_Duplikate",
    "_Archiv",
    "_Backup",
    "Win-CASA",
    "iDWELL",
    "`$RECYCLE.BIN",
    "System Volume Information"
)

# -----------------------------
# Hilfsfunktionen
# -----------------------------
function Normalize-FolderPath {
    param([string]$Path)
    return ([System.IO.Path]::GetFullPath($Path)).TrimEnd('\','/')
}

function Test-IsSubPath {
    param([string]$ChildPath, [string]$ParentPath)
    $child = (Normalize-FolderPath $ChildPath).ToLowerInvariant()
    $parent = (Normalize-FolderPath $ParentPath).ToLowerInvariant()
    $sep = [string][System.IO.Path]::DirectorySeparatorChar
    return ($child -eq $parent -or $child.StartsWith($parent + $sep))
}

function Get-IoPath {
    # Liefert einen fuer Dateioperationen sicheren Pfad.
    # Unter Windows werden lange Pfade (ab 240 Zeichen) mit dem \\?\-Praefix versehen,
    # damit Operationen nicht an der klassischen 260-Zeichen-Grenze scheitern.
    param([string]$Path)

    if (-not $script:OnWindows) { return $Path }
    if ($Path.StartsWith('\\?\')) { return $Path }
    if ($Path.Length -lt 240) { return $Path }

    if ($Path.StartsWith('\\')) {
        # UNC-Pfad: \\server\share -> \\?\UNC\server\share
        return '\\?\UNC\' + $Path.Substring(2)
    }
    return '\\?\' + $Path
}

function Write-Log {
    param([string]$Text, [string]$Level = "INFO")
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Level] $Text"
    Write-Host $line
    Add-Content -LiteralPath $script:LogDatei -Value $line -Encoding UTF8
}

function Convert-BytesReadable {
    param([Int64]$Bytes)
    if ($Bytes -ge 1TB) { return ("{0:N2} TB" -f ($Bytes / 1TB)) }
    if ($Bytes -ge 1GB) { return ("{0:N2} GB" -f ($Bytes / 1GB)) }
    if ($Bytes -ge 1MB) { return ("{0:N2} MB" -f ($Bytes / 1MB)) }
    if ($Bytes -ge 1KB) { return ("{0:N2} KB" -f ($Bytes / 1KB)) }
    return "$Bytes B"
}

function Normalize-PatternSeparators {
    # Macht Pfadmuster wie "\Objekte\" trennzeichen-unabhaengig, damit die Prioritaeten
    # nicht stumm auf "Standard" zurueckfallen, wenn Pfade mit "/" statt "\" ankommen.
    param([string]$Text)
    $sep = [string][System.IO.Path]::DirectorySeparatorChar
    return $Text.Replace('\', $sep).Replace('/', $sep)
}

function Get-PathPriority {
    param([string]$FullPath)

    $p = (Normalize-PatternSeparators $FullPath).ToLowerInvariant()
    $priority = 100
    $reason = "Standard"

    foreach ($rule in $KeepPriorityPatterns) {
        $pattern = (Normalize-PatternSeparators $rule.Pattern).ToLowerInvariant()
        if ($p.Contains($pattern)) {
            if ([int]$rule.Priority -lt $priority) {
                $priority = [int]$rule.Priority
                $reason = [string]$rule.Reason
            }
        }
    }

    foreach ($rule in $MovePriorityPatterns) {
        $pattern = (Normalize-PatternSeparators $rule.Pattern).ToLowerInvariant()
        if ($p.Contains($pattern)) {
            if ([int]$rule.Priority -gt $priority) {
                $priority = [int]$rule.Priority
                $reason = [string]$rule.Reason
            }
        }
    }

    return [PSCustomObject]@{
        Priority = $priority
        Reason   = $reason
    }
}

function Test-IsExcludedFile {
    param([System.IO.FileInfo]$File)

    $sep = [string][System.IO.Path]::DirectorySeparatorChar
    foreach ($folder in $ExcludeFolderNames) {
        $needle = ($sep + $folder + $sep).ToLowerInvariant()
        if ($File.FullName.ToLowerInvariant().Contains($needle)) { return $true }
    }

    if (-not $IncludeHidden -and (($File.Attributes -band [System.IO.FileAttributes]::Hidden) -ne 0)) { return $true }
    if (-not $IncludeSystem -and (($File.Attributes -band [System.IO.FileAttributes]::System) -ne 0)) { return $true }

    return $false
}

function Get-SafeDestinationPath {
    param([string]$TargetPath)

    if (-not (Test-Path -LiteralPath (Get-IoPath $TargetPath))) { return $TargetPath }

    $folder = Split-Path -Path $TargetPath -Parent
    $ext = [System.IO.Path]::GetExtension($TargetPath)
    $name = [System.IO.Path]::GetFileNameWithoutExtension($TargetPath)
    $counter = 1

    do {
        $candidate = Join-Path $folder ("{0}_DUP_{1}{2}" -f $name, $counter, $ext)
        $counter++
    } while (Test-Path -LiteralPath (Get-IoPath $candidate))

    return $candidate
}

function Get-VorHash {
    # Berechnet den SHA256 nur ueber die ersten $Bytes der Datei (Vor-Hash).
    # Dient als schneller Vorfilter: Unterschiedliche Dateien gleicher Groesse
    # werden so meist erkannt, ohne die komplette Datei lesen zu muessen.
    param([string]$Path, [int]$Bytes)

    $sha = [System.Security.Cryptography.SHA256]::Create()
    $stream = $null
    try {
        $stream = [System.IO.File]::Open((Get-IoPath $Path), [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
        $buffer = New-Object byte[] $Bytes
        $read = $stream.Read($buffer, 0, $Bytes)
        $hashBytes = $sha.ComputeHash($buffer, 0, $read)
        return ([System.BitConverter]::ToString($hashBytes)).Replace("-", "")
    } finally {
        if ($null -ne $stream) { $stream.Dispose() }
        $sha.Dispose()
    }
}

# -----------------------------
# Initialisierung
# -----------------------------
if (-not (Test-Path -LiteralPath $QuellOrdner)) {
    Write-Error "Quellordner wurde nicht gefunden: $QuellOrdner"
    exit 1
}

$QuellOrdner = Normalize-FolderPath $QuellOrdner
$PruefOrdner = Normalize-FolderPath $PruefOrdner

if (Test-IsSubPath -ChildPath $PruefOrdner -ParentPath $QuellOrdner) {
    Write-Error "Der Pruefordner liegt innerhalb des Quellordners. Bitte externen Pruefordner verwenden. Quellordner: $QuellOrdner | Pruefordner: $PruefOrdner"
    exit 1
}

New-Item -ItemType Directory -Force -Path $PruefOrdner | Out-Null

$Zeitstempel = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$RunFolder = Join-Path $PruefOrdner ("Lauf_" + $Zeitstempel)
New-Item -ItemType Directory -Force -Path $RunFolder | Out-Null

$script:LogDatei = Join-Path $RunFolder "HGI_Duplikate_Log.txt"
$BerichtCsv = Join-Path $RunFolder "HGI_Duplikate_Bericht.csv"
$RestoreCsv = Join-Path $RunFolder "HGI_Duplikate_Restore.csv"
$HtmlBericht = Join-Path $RunFolder "HGI_Duplikate_Bericht.html"

Write-Log "=== HGI Duplikate-Finder Pro v2.1 gestartet ==="
Write-Log "Quellordner: $QuellOrdner"
Write-Log "Pruefordner: $PruefOrdner"
Write-Log "Laufordner: $RunFolder"
Write-Log "Modus: $(if ($DryRun) { 'TESTLAUF - es wird nichts verschoben' } else { 'ECHTLAUF - Duplikate werden verschoben' })"
Write-Log "Vor-Hash-Grenze: $(Convert-BytesReadable $VorHashBytes)"
Write-Log "Ausschluesse: $($ExcludeFolderNames -join ', ')"

if (-not $DryRun) {
    Write-Log "ECHTLAUF aktiv. Bitte sicherstellen, dass eine aktuelle Datensicherung vorhanden ist." "WARN"
}

# -----------------------------
# Dateien einlesen
# -----------------------------
Write-Log "Lese Dateiliste ein..."
$sw = [System.Diagnostics.Stopwatch]::StartNew()

$enumErrors = @()
try {
    $rawFiles = @(Get-ChildItem -LiteralPath $QuellOrdner -Recurse -File -ErrorAction SilentlyContinue -ErrorVariable enumErrors)
} catch {
    Write-Log "Fehler beim Einlesen: $($_.Exception.Message)" "ERROR"
    exit 1
}

# NEU v2.1: Zugriffsfehler beim Einlesen protokollieren statt stumm zu uebergehen
$accessErrors = New-Object System.Collections.Generic.List[object]
foreach ($e in $enumErrors) {
    $target = if ($null -ne $e.TargetObject) { [string]$e.TargetObject } else { "(unbekannt)" }
    $accessErrors.Add([PSCustomObject]@{
        Pfad   = $target
        Phase  = "Einlesen"
        Fehler = $e.Exception.Message
    })
    Write-Log "Zugriffsfehler beim Einlesen: $target | $($e.Exception.Message)" "WARN"
}

$allCount = $rawFiles.Count
$files = @($rawFiles | Where-Object { -not (Test-IsExcludedFile $_) })
$excludedCount = $allCount - $files.Count
$zeroByteFiles = @($files | Where-Object { $_.Length -eq 0 })
$files = @($files | Where-Object { $_.Length -gt 0 })

Write-Log "Dateien gesamt: $allCount"
Write-Log "Ausgeschlossen: $excludedCount"
Write-Log "0-Byte-Dateien uebersprungen: $($zeroByteFiles.Count)"
Write-Log "Zugriffsfehler beim Einlesen: $($accessErrors.Count)"
Write-Log "Zu pruefende Dateien: $($files.Count)"

# -----------------------------
# Kandidaten nach Groesse
# -----------------------------
Write-Log "Gruppiere nach Dateigroesse..."
$sizeGroups = @($files | Group-Object -Property Length | Where-Object { $_.Count -gt 1 })
$sizeCandidateCount = 0
foreach ($g in $sizeGroups) { $sizeCandidateCount += $g.Count }
Write-Log "Hash-Kandidaten mit gleicher Dateigroesse: $sizeCandidateCount"

# -----------------------------
# Stufe 1: Vor-Hash (nur Dateianfang) fuer grosse Dateien
# -----------------------------
# Innerhalb einer Groessengruppe haben alle Dateien dieselbe Groesse.
# - Groesse <= VorHashBytes: Der Vor-Hash entspraeche ohnehin dem Voll-Hash -> direkt Voll-Hash.
# - Groesse >  VorHashBytes: Erst Vor-Hash; nur Untergruppen mit uebereinstimmendem Vor-Hash
#   kommen in die Voll-Hash-Stufe.
$fullHashQueue = New-Object System.Collections.Generic.List[object]
$hashErrors = New-Object System.Collections.Generic.List[object]
$prehashCount = 0
$prehashSkipped = 0
$prehashSavedBytes = [Int64]0
$processed = 0

foreach ($group in $sizeGroups) {
    $groupSize = [Int64]$group.Group[0].Length

    if ($groupSize -le $VorHashBytes) {
        foreach ($f in $group.Group) { $fullHashQueue.Add($f) }
        continue
    }

    # Vor-Hash berechnen und nach (Groesse ist je Gruppe konstant) Vor-Hash gruppieren
    $preMap = @{}
    foreach ($f in $group.Group) {
        $processed++
        if (($processed % $FortschrittAlle) -eq 0) {
            Write-Log "Fortschritt Vor-Hash: $processed Dateien verarbeitet, Laufzeit $($sw.Elapsed.ToString())"
        }
        try {
            $pre = Get-VorHash -Path $f.FullName -Bytes $VorHashBytes
            $prehashCount++
            if (-not $preMap.ContainsKey($pre)) { $preMap[$pre] = New-Object System.Collections.Generic.List[object] }
            $preMap[$pre].Add($f)
        } catch {
            $hashErrors.Add([PSCustomObject]@{
                Pfad   = $f.FullName
                Phase  = "Vor-Hash"
                Fehler = $_.Exception.Message
            })
            Write-Log "Vor-Hash-Fehler: $($f.FullName) | $($_.Exception.Message)" "WARN"
        }
    }

    foreach ($key in $preMap.Keys) {
        $bucket = $preMap[$key]
        if ($bucket.Count -gt 1) {
            foreach ($f in $bucket) { $fullHashQueue.Add($f) }
        } else {
            # Vor-Hash eindeutig -> Datei ist kein Duplikat, Voll-Hash gespart
            $prehashSkipped++
            $prehashSavedBytes += [Int64]$bucket[0].Length
        }
    }
}

Write-Log "Vor-Hash berechnet fuer: $prehashCount Dateien"
Write-Log "Durch Vor-Hash aussortiert (kein Voll-Hash noetig): $prehashSkipped Dateien ($(Convert-BytesReadable $prehashSavedBytes) Lesevolumen gespart)"
Write-Log "Voll-Hash erforderlich fuer: $($fullHashQueue.Count) Dateien"

# -----------------------------
# Stufe 2: Voll-Hash
# -----------------------------
$hashed = New-Object System.Collections.Generic.List[object]
$sourcePrefixLength = $QuellOrdner.TrimEnd('\','/').Length
$totalCandidates = [Math]::Max($fullHashQueue.Count, 1)
$index = 0

foreach ($file in $fullHashQueue) {
    $index++
    if (($index % 250) -eq 0 -or $index -eq 1 -or $index -eq $fullHashQueue.Count) {
        $percent = [int](($index / $totalCandidates) * 100)
        Write-Progress -Activity "HGI Duplikate-Finder" -Status "Voll-Hash $index von $($fullHashQueue.Count)" -PercentComplete $percent
    }
    if (($index % $FortschrittAlle) -eq 0) {
        Write-Log "Fortschritt Voll-Hash: $index von $($fullHashQueue.Count) Dateien, Laufzeit $($sw.Elapsed.ToString())"
    }

    try {
        $hash = Get-FileHash -LiteralPath (Get-IoPath $file.FullName) -Algorithm SHA256 -ErrorAction Stop
        $rel = $file.FullName.Substring($sourcePrefixLength).TrimStart('\','/')
        $prio = Get-PathPriority -FullPath $file.FullName

        $hashed.Add([PSCustomObject]@{
            Pfad        = $file.FullName
            RelativPfad = $rel
            Dateiname   = $file.Name
            Ordner      = $file.DirectoryName
            Groesse     = [Int64]$file.Length
            Geaendert   = $file.LastWriteTime
            Erstellt    = $file.CreationTime
            Hash        = $hash.Hash
            Prioritaet  = [int]$prio.Priority
            Grund       = [string]$prio.Reason
        })
    } catch {
        $hashErrors.Add([PSCustomObject]@{
            Pfad   = $file.FullName
            Phase  = "Voll-Hash"
            Fehler = $_.Exception.Message
        })
        Write-Log "Hash-Fehler: $($file.FullName) | $($_.Exception.Message)" "WARN"
    }
}
Write-Progress -Activity "HGI Duplikate-Finder" -Completed

# -----------------------------
# Duplikate bestimmen
# -----------------------------
$hashGroups = @($hashed | Group-Object -Property Hash | Where-Object { $_.Count -gt 1 })
Write-Log "Gefundene Duplikatgruppen: $($hashGroups.Count)"

$report = New-Object System.Collections.Generic.List[object]
$restore = New-Object System.Collections.Generic.List[object]
$duplicateBytes = [Int64]0
$dupCount = 0

foreach ($group in $hashGroups) {
    # Behalten: niedrigste Prioritaet, dann kuerzester Pfad, dann aelteste Aenderung.
    $sorted = @($group.Group | Sort-Object @{Expression='Prioritaet'; Ascending=$true}, @{Expression={$_.Pfad.Length}; Ascending=$true}, @{Expression='Geaendert'; Ascending=$true})
    $original = $sorted[0]
    $duplicates = @($sorted | Select-Object -Skip 1)

    foreach ($dup in $duplicates) {
        $dupCount++
        $duplicateBytes += [Int64]$dup.Groesse

        $targetPathRaw = Join-Path $RunFolder (Join-Path "Quarantaene" $dup.RelativPfad)
        $targetPath = $targetPathRaw
        $action = if ($DryRun) { "WUERDE_VERSCHOBEN" } else { "VERSCHOBEN" }
        $errorText = ""

        if (-not $DryRun) {
            try {
                $targetFolder = Split-Path -Path $targetPathRaw -Parent
                New-Item -ItemType Directory -Force -Path (Get-IoPath $targetFolder) | Out-Null
                $targetPath = Get-SafeDestinationPath -TargetPath $targetPathRaw
                Move-Item -LiteralPath (Get-IoPath $dup.Pfad) -Destination (Get-IoPath $targetPath) -ErrorAction Stop
            } catch {
                $action = "FEHLER"
                $errorText = $_.Exception.Message
                Write-Log "Fehler beim Verschieben: $($dup.Pfad) | $errorText" "ERROR"
            }
        }

        $row = [PSCustomObject]@{
            Aktion              = $action
            Hash                = $dup.Hash
            Groesse_Byte        = $dup.Groesse
            Groesse_Lesbar      = Convert-BytesReadable $dup.Groesse
            Behalten_Pfad       = $original.Pfad
            Behalten_Prioritaet = $original.Prioritaet
            Behalten_Grund      = $original.Grund
            Duplikat_Pfad       = $dup.Pfad
            Duplikat_Prioritaet = $dup.Prioritaet
            Duplikat_Grund      = $dup.Grund
            Zielpfad            = $targetPath
            Geaendert           = $dup.Geaendert
            Fehler              = $errorText
        }
        $report.Add($row)

        $restore.Add([PSCustomObject]@{
            OriginalPath   = $dup.Pfad
            QuarantinePath = $targetPath
            KeptPath       = $original.Pfad
            Hash           = $dup.Hash
            SizeBytes      = $dup.Groesse
            Action         = $action
            Error          = $errorText
        })
    }
}

# -----------------------------
# Berichte schreiben
# -----------------------------
if ($report.Count -gt 0) {
    $report | Export-Csv -LiteralPath $BerichtCsv -NoTypeInformation -Encoding UTF8 -Delimiter ";"
    $restore | Export-Csv -LiteralPath $RestoreCsv -NoTypeInformation -Encoding UTF8 -Delimiter ";"
    Write-Log "CSV-Bericht: $BerichtCsv"
    Write-Log "Restore-CSV: $RestoreCsv"
} else {
    Write-Log "Keine Duplikate gefunden."
}

# Fehler-CSV: Zugriffsfehler (Einlesen) + Hash-Fehler zusammen
$allErrors = New-Object System.Collections.Generic.List[object]
foreach ($e in $accessErrors) { $allErrors.Add($e) }
foreach ($e in $hashErrors) { $allErrors.Add($e) }

if ($allErrors.Count -gt 0) {
    $errorCsv = Join-Path $RunFolder "HGI_Duplikate_Fehler.csv"
    $allErrors | Export-Csv -LiteralPath $errorCsv -NoTypeInformation -Encoding UTF8 -Delimiter ";"
    Write-Log "Fehlerbericht ($($allErrors.Count) Eintraege): $errorCsv" "WARN"
}

$topRows = @($report | Sort-Object Groesse_Byte -Descending | Select-Object -First $TopHtmlRows)
$topRowsHtml = if ($topRows.Count -gt 0) { $topRows | ConvertTo-Html -Fragment } else { "<p>Keine Duplikate gefunden.</p>" }
$duration = $sw.Elapsed.ToString()
$duplicateReadable = Convert-BytesReadable $duplicateBytes
$modeText = if ($DryRun) { "TESTLAUF - keine Dateien verschoben" } else { "ECHTLAUF - Duplikate verschoben" }

$html = @"
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>HGI Duplikate-Finder Bericht</title>
<style>
body { font-family: Arial, sans-serif; margin: 24px; }
h1 { margin-bottom: 4px; }
.summary { display: grid; grid-template-columns: repeat(3, minmax(180px, 1fr)); gap: 12px; margin: 20px 0; }
.card { border: 1px solid #ccc; border-radius: 8px; padding: 12px; }
.card strong { font-size: 20px; display: block; margin-top: 4px; }
table { border-collapse: collapse; width: 100%; font-size: 12px; }
th, td { border: 1px solid #ccc; padding: 5px; vertical-align: top; }
th { background: #eee; }
.small { color: #666; font-size: 12px; }
</style>
</head>
<body>
<h1>HGI Duplikate-Finder Pro v2.1</h1>
<p class="small">Erstellt: $(Get-Date -Format 'dd.MM.yyyy HH:mm:ss') | Modus: $modeText</p>
<div class="summary">
  <div class="card">Dateien gesamt<strong>$allCount</strong></div>
  <div class="card">Gepruefte Dateien<strong>$($files.Count)</strong></div>
  <div class="card">Groessen-Kandidaten<strong>$sizeCandidateCount</strong></div>
  <div class="card">Durch Vor-Hash aussortiert<strong>$prehashSkipped</strong></div>
  <div class="card">Voll-Hash berechnet<strong>$($fullHashQueue.Count)</strong></div>
  <div class="card">Duplikatgruppen<strong>$($hashGroups.Count)</strong></div>
  <div class="card">Duplikatdateien<strong>$dupCount</strong></div>
  <div class="card">Potenzial Speicher<strong>$duplicateReadable</strong></div>
  <div class="card">Ausgeschlossen<strong>$excludedCount</strong></div>
  <div class="card">0-Byte uebersprungen<strong>$($zeroByteFiles.Count)</strong></div>
  <div class="card">Fehler (Zugriff/Hash)<strong>$($allErrors.Count)</strong></div>
  <div class="card">Laufzeit<strong>$duration</strong></div>
</div>
<h2>Groesste Duplikate / Auszug</h2>
$topRowsHtml
</body>
</html>
"@
$html | Set-Content -LiteralPath $HtmlBericht -Encoding UTF8
Write-Log "HTML-Bericht: $HtmlBericht"

Write-Log "Duplikatdateien: $dupCount"
Write-Log "Potenzial Speicher: $duplicateReadable"
Write-Log "Laufzeit: $duration"
Write-Log "=== HGI Duplikate-Finder beendet ==="

Write-Host ""
Write-Host "Fertig." -ForegroundColor Green
Write-Host "Modus: $modeText" -ForegroundColor Yellow
Write-Host "Laufordner: $RunFolder"
Write-Host "Log: $($script:LogDatei)"
if ($report.Count -gt 0) {
    Write-Host "CSV: $BerichtCsv"
    Write-Host "Restore-CSV: $RestoreCsv"
}
Write-Host "HTML: $HtmlBericht"
if ($DryRun) {
    Write-Host ""
    Write-Host "Naechster Schritt: CSV/HTML pruefen. Echtlauf erst danach mit dem Schalter -Echtlauf starten." -ForegroundColor Yellow
}
