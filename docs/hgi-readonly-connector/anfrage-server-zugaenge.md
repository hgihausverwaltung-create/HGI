# Auftrag an Codex (Betrieb HGI-Plattform) – persönliche Claude-Zugänge für die Agenten-API

Stand: 09.10.2026 · Auftraggeber: Edgard Schröder · Umsetzung auf `ubuntu17` (192.168.50.17)

## Ziel

Der lokale Claude-Connector `hgi-datenbank-readonly` (Python-Bridge auf den Arbeitsplätzen) soll für
vier Mitarbeiter der HGI Immobilien GmbH mit jeweils eigener Identität und eigenem Token auf
`https://192.168.50.17/agent-api/mcp` zugreifen.

## 1. Identitäten

| Identität | Person | Status |
|---|---|---|
| `claude-readonly` | Edgard Schröder (AGENT007, Eddy_NUC) | besteht, Rechte erweitern |
| `claude-leon-schroeder` | Leon Schröder | neu anlegen |
| `claude-inna-goerz` | Inna Görz | neu anlegen |
| `claude-marina-korotaev` | Marina Korotaev | neu anlegen |

## 2. Rechte – für alle vier identisch (Entscheidung Edgard Schröder, 09.10.2026)

- **Lesen (16):** `attachment_status`, `get_document`, `get_hgi_record`, `get_mail`, `get_ticket`,
  `hgi_table_schema`, `knowledge_history`, `mail_catalog`, `read_calendar`, `read_wincasa`,
  `search_hgi_data`, `search_knowledge`, `search_mail`, `search_tickets`,
  `ticket_attachment_status`, `ticket_history`
- **Schreiben (6):** `save_knowledge`, `update_own_knowledge`, `create_ticket`, `update_ticket`,
  `send_mail` (Absender **info@hgi-immobilien.de**), `create_calendar_event`

- **Neu (1): Outlook-Entwurf mit Anhängen**, z. B. `create_mail_draft` – genauen Namen bitte mitteilen:
  - legt einen Entwurf im Outlook-Postfach **info@hgi-immobilien.de** an (Ordner „Entwürfe“),
    der dort von einem Mitarbeiter geprüft und gesendet werden kann;
  - **Anhänge sind Pflicht-Funktion:** Dokumente per Dokumentnachweis-ID (wie `get_document`) und
    Ticket-Anlagen (wie `ticket_attachment_status`) müssen sich anhängen lassen; die Größenbegrenzung
    von `get_document` (2 MiB) darf dafür nicht gelten, da die Datei serverseitig angehängt wird;
  - Rückgabe: Entwurfs-ID, Empfänger, Betreff, Liste der angehängten Dateien mit Dateihash.
- `send_mail` ebenfalls mit Anhängen nach demselben Verfahren.

Die Werkzeugliste muss für alle vier exakt gleich sein (23 Werkzeuge), da die Bridge jede Abweichung ablehnt.
WinCasa-Tabellen bleiben nur lesend.

## 3. Weitere Anforderungen

- Protokollierung jedes Aufrufs je Identität, insbesondere jedes `send_mail` (Empfänger, Betreff, Zeitpunkt).
- Tokens nicht per E-Mail oder Chat übermitteln, sondern persönlich übergeben.
- Sperrweg je Token dokumentieren (z. B. bei Austritt oder Geräteverlust).
- Rückfrage: Für Edgard Schröder je Rechner (AGENT007, Eddy_NUC) ein eigenes Token derselben Identität möglich?
- Bitte melden, wenn die Umstellung live ist. **Erst danach** wird die Bridge auf den Arbeitsplätzen gepatcht –
  umgekehrt fällt der Connector aus (Störung vom 09.10.2026: Bridge erwartete Schreibwerkzeuge,
  Server bot nur Lesewerkzeuge → „Unexpected HGI tool set“).

## 4. Rückmeldung an Edgard Schröder

- Umstellung live seit: `[•]`
- Werkzeugliste je Identität (Ausgabe `tools/list`): `[•]`
- Name des Entwurfswerkzeugs: `[•]`
- Tokens übergeben an: `[•]`
