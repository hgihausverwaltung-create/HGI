# Claude-Connector `hgi-datenbank-readonly` – Einrichtung je Arbeitsplatz

> Hinweis: Der Name „readonly“ bleibt aus technischen Gründen. Über den Connector sind Lesen und das Anlegen/Ändern eigener Wissenseinträge möglich, sonst nichts.

Stand: 09.10.2026 · Variante A (lokaler Connector pro PC, nur Büronetz/VPN) · Entscheidung Edgard Schröder

## Hintergrund

Der Connector ist ein lokaler MCP-Server (Python-Bridge), den Claude Desktop auf dem jeweiligen PC startet.
Er spricht per HTTPS mit der Agenten-API der HGI-Plattform (`https://192.168.50.17/agent-api/mcp`).
Ein organisationsweiter Connector ist damit nicht möglich: Remote-Connectoren werden aus dem Internet
aufgerufen, der Server ist nur intern erreichbar. Deshalb wird jeder Arbeitsplatz einzeln eingerichtet.

Fehlerbehebung vom 09.10.2026: Die Bridge erwartete 6 Schreibwerkzeuge, die der Server für
`claude-readonly` nicht (mehr) anbietet → „Unexpected HGI tool set“. `ALLOWED_TOOLS` wurde auf die
16 Lesewerkzeuge des Servers gesetzt (Sicherung `hgi_readonly_bridge.py.bak-2026-10-09`).

## Personen, Agenten-Identitäten, Rechner

Namen und Identitäten von Edgard Schröder am 09.10.2026 bestätigt.

| Person | Agent-Identität (Server) | Rechner | Stand |
|---|---|---|---|
| Edgard Schröder | `claude-readonly` (bestehend) | AGENT007 (virtuell) | läuft, repariert am 09.10.2026 |
| Edgard Schröder | `claude-readonly` (bestehend) | Eddy_NUC | läuft (Stand 09.10.2026) |
| Leon Schröder | `claude-leon-schroeder` | `[•]` | Server-Zugang fehlt |
| Inna Görz | `claude-inna-goerz` | `[•]` | Server-Zugang fehlt |
| Marina Korotaev | `claude-marina-korotaev` | `[•]` | Server-Zugang fehlt |

## Grundsätze

- Lesewerkzeuge plus Wissenseintrag: Alle Identitäten erhalten dieselben 16 Lesewerkzeuge und zusätzlich
  `save_knowledge` und `update_own_knowledge` (Entscheidung Edgard Schröder, 09.10.2026: jeder darf
  Einträge in der Wissensdatenbank anlegen). Keine Ticket-, Mail- oder Kalender-Schreibrechte.
  Die Werkzeugliste muss für alle Identitäten exakt gleich sein, sonst lehnt die Bridge ab.
- Jede Identität ändert nur ihre eigenen Einträge; jede Änderung erzeugt eine Historienversion.
  Einträge bleiben ZUR PRÜFUNG, bis ein anderer Prüfer sie freigibt.
- Reihenfolge zwingend: **erst** Server umstellen, **dann** Bridge mit `-MitWissensEintrag` patchen.
  Umgekehrt fällt der Connector aus (genau die Störung vom 09.10.2026).
- Kein gemeinsames Token. Jede Person bekommt ein eigenes Token; es wird persönlich übergeben,
  nie per E-Mail, Chat oder in Dokumenten.
- Die Prüfungen der Bridge (Endpunkt, Zertifikat, Werkzeugliste) bleiben unverändert.
- Vor jeder Änderung Sicherung, zuerst Trockenlauf.

## Ablauf

1. **Server (Codex bzw. Herr Kreker):** Identitäten anlegen, siehe `anfrage-server-zugaenge.md`.
2. **Bridge patchen (einmal, auf AGENT007):** erst nach Rückmeldung, dass der Server umgestellt ist:
   `Patch-Bridge-Agenten.ps1 -MitWissensEintrag -Trockenlauf`, dann ohne `-Trockenlauf`.
   Danach akzeptiert die Bridge die vier Identitäten und die beiden Wissens-Werkzeuge.
   Funktionstest wie in Schritt 4 auf AGENT007, bevor die Bridge verteilt wird.
   Eddy_NUC hat eine eigene Kopie der Bridge: dort denselben Patch ausführen (oder die gepatchte Bridge
   aus dem Freigabeordner übernehmen), sonst fällt der Connector auf Eddy_NUC nach der Server-Umstellung aus.
3. **Freigabeordner befüllen** (`[•]` Ort festlegen, nur für Administratoren lesbar):
   gepatchte `hgi_readonly_bridge.py` und `HGI_Server_Zertifikat.crt`. **Keine** `access.json`.
4. **Je Arbeitsplatz** (PowerShell als Administrator, angemeldet als der Mitarbeiter):
   ```powershell
   .\Install-HGI-Connector.ps1 -Agent claude-leon-schroeder -Quelle '<Freigabeordner>' -Trockenlauf
   .\Install-HGI-Connector.ps1 -Agent claude-leon-schroeder -Quelle '<Freigabeordner>'
   ```
   Das Skript prüft Python, Server und Zertifikat-Fingerabdruck, kopiert die Dateien, fragt das Token
   verdeckt ab, beschränkt die Leserechte der `access.json`, trägt den Connector in Claude Desktop ein
   und testet ihn.
5. **Abnahme:** Claude Desktop neu starten, im neuen Chat: „Zeig mit hgi-datenbank-readonly das Schema der Tabelle Objekte.“

## Bekannte Stolperfallen

- Umlaute im Windows-Benutzerordner (z. B. `E.Schröder`) sind unkritisch für die Bridge,
  aber der 8.3-Kurzname (`E9BBC~1.SCH`) kann bei `Remove-Item` mit `$env:TEMP` scheitern.
- Claude Desktop aus dem Microsoft Store legt die Konfiguration ggf. an anderer Stelle ab –
  dann `-ClaudeConfig` mit dem richtigen Pfad angeben.
- Fehlermeldungen der Bridge sind absichtlich allgemein („HGI connector request failed“).
  Diagnose: Kopie mit `traceback.print_exc()` im `except`-Zweig, nie das Original ändern.
