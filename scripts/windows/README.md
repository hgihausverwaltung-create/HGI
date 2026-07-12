# Windows-Setup: Claude Code Integration

PowerShell-Skripte für die lokale Einrichtung von Claude Code auf einem Windows-Rechner.

## Reihenfolge

1. `Install-ClaudeCode.ps1` – installiert Claude Code, prüft Git for Windows, verifiziert die Installation.
2. `Clone-HGI-Repo.ps1` – installiert bei Bedarf die GitHub CLI, meldet sich bei GitHub an und klont dieses Repo nach `C:\HGI`.

## Ausführen

```powershell
Unblock-File .\Install-ClaudeCode.ps1
.\Install-ClaudeCode.ps1

Unblock-File .\Clone-HGI-Repo.ps1
.\Clone-HGI-Repo.ps1

cd C:\HGI
claude
```
