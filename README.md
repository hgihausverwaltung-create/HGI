# HGI – Projektübersicht und Protokoll-App

Dieses Repository enthält Software und Arbeitsunterlagen für die HGI Immobilien GmbH.
Der Standardzweig `claude/new-session-udlv7n` enthält die browserbasierte **Protokoll-App**.
Weitere Anwendungen und Erweiterungen liegen in separaten Entwicklungszweigen.

**Stand der Bestandsaufnahme: 21.10.2026.** Dies ist eine Übersicht des Repository-Codes,
keine Bestätigung einer Installation auf dem HGI-Server oder einer Freigabe für den Echtbetrieb.

## Hier beginnen

- [Projektstand und nächste Schritte](docs/projektstand.md): Module, offene Änderungen und Abhängigkeiten.
- [HGI Executive Master Prompt](docs/executive-master-prompt.md): fachliche Vorgaben für den KI-Assistenten.
- [iPad-Zugriff über VPN](docs/anleitung-ipad-server-zugriff.md): Anleitung zum Serverzugriff.
- [Arbeitsanweisungen für Claude Code](CLAUDE.md): technische Orientierung und Regeln für Änderungen.

## Welche Dateien gehören wozu?

| Pfad | Aufgabe |
|---|---|
| `apps/web/` | Browseroberfläche: Anmeldung, Objekte, Vorlagen und Protokollentwürfe |
| `apps/api/` | Serverlogik, Berechtigungen, Datenbankzugriff, Datei- und Versandabläufe |
| `apps/api/prisma/schema.prisma` | Datenbankstruktur; enthält nicht die laufende Kundendatenbank |
| `apps/api/prisma/migrations/` | Versionierte Änderungen der Datenbankstruktur |
| `packages/form-schema/` | Formularaufbau und Prüfung der Eingaben |
| `packages/form-renderer/` | Ausfüllbare Formulare für den Browser |
| `packages/pdf/` | PDF-Erstellung aus ausgefüllten Protokollen |
| `packages/domain/` | Gemeinsame Rollen, Status und E-Mail-Platzhalter |
| `packages/api-client/` | Verbindung zwischen Oberfläche und Server |
| `docs/` | Fachliche Vorgaben und Anleitungen |
| `package.json`, `pnpm-workspace.yaml`, `turbo.json` | Entwicklungsbefehle und Organisation der Softwarepakete |

## Was ist im Standardzweig vorhanden?

Die Protokoll-App soll die bisher genutzte App „smaps“ ersetzen.
Vorhanden sind eine konfigurierbare Formular-Engine, Objekt-/Wohnungsverwaltung,
versionierte Vorlagen, Protokollentwürfe mit Fotos und PDF-Erstellung.
Betreff und Text der Versandvorlage lassen sich pro Formularvorlage konfigurieren.

**Der E-Mail-Versand ist eine lokale Simulation.** `apps/api/src/lib/email.ts` schreibt
eine JSON-Datei nach `apps/api/storage/outbox`; die Nachricht wird nicht an Empfänger zugestellt.
Ein als „gesendet“ angezeigter Protokollstatus belegt daher keine tatsächliche E-Mail-Zustellung.

Mobile-App und Offline-Synchronisierung liegen als offener Entwurf in
[PR #12](https://github.com/hgihausverwaltung-create/HGI/pull/12).
Die Dokumentenverwaltung `app-doku/` liegt auf einer separaten Entwicklungslinie
([PR #2](https://github.com/hgihausverwaltung-create/HGI/pull/2)) und ist in diesem Standardzweig nicht enthalten.
GitHub Desktop zeigt jeweils die Dateien des ausgewählten Zweigs an.

M1/M2 wurden laut bisherigen Entwicklungsunterlagen lokal getestet.
Diese Bestandsaufnahme hat die Anwendung nicht erneut ausgeführt.
Für die zuletzt integrierten E-Mail-Vorlagen stehen laut
[PR #16](https://github.com/hgihausverwaltung-create/HGI/pull/16) die Prüfung der
Datenbankmigration gegen eine echte Testdatenbank und der manuelle Versandablauf noch aus.

## Lokale Entwicklung

Voraussetzungen: Node.js ≥ 20, pnpm (laut `package.json`: 10.33.0), eine lokale PostgreSQL-Instanz.

Die folgenden Befehle sind für eine separate Entwicklungsdatenbank bestimmt. `db:seed` legt Testdaten an; keine produktive Datenbank dafür verwenden. In `apps/api/.env` sind `DATABASE_URL` und ein eigener `JWT_SECRET` einzutragen.

Die `cp`-Befehle gelten für Git Bash/Linux/macOS. In Windows PowerShell stattdessen:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Die Dateien einmalig anlegen; vorhandene Konfigurationen nicht überschreiben.

```bash
# 1. Abhängigkeiten installieren
pnpm install

# 2. .env-Dateien anlegen (einmalig)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# DATABASE_URL in apps/api/.env auf eine erreichbare Postgres-Datenbank anpassen

# 3. Datenbank migrieren + mit Testdaten befüllen
pnpm db:migrate
pnpm db:seed

# 4. Beide Dev-Server starten (API auf :4000, Web auf :5173)
pnpm dev
```

Der Seed legt lokale Testbenutzer mit den Rollen ADMIN und FIELD_STAFF an.
Die Angaben stehen in `apps/api/prisma/seed.ts`; sie sind keine produktiven Zugänge.

Der Seed legt außerdem ein Beispiel-Objekt/-Wohnung sowie die echte **Übergabeprotokoll**-Vorlage
(inkl. der "Bestehend aus"-Raumliste aus den smaps-Screenshots) als veröffentlichte Version 1 an.

## Entwicklungsbetrieb und geplante Produktionsanbindung

Die bisherige Projektbeschreibung nennt **Supabase** (Postgres, Auth, Storage, EU-Region)
und einen echten E-Mail-Anbieter (Resend/Postmark) als geplante Produktionsanbindungen. Eine tatsächlich eingerichtete Anbindung ist damit nicht belegt. In dieser lokalen Entwicklungsumgebung laufen
stattdessen kompatible, eigenständige Ersatz-Implementierungen, da hierfür keine Cloud-Zugangsdaten
benötigt werden — jeweils auf eine Datei begrenzt, damit der spätere Wechsel isoliert bleibt:

- **Auth**: eigenes E-Mail/Passwort-Login (`apps/api/src/lib/auth.ts`) statt Supabase Auth.
- **Dateispeicher**: lokales Verzeichnis `apps/api/storage/files` (`apps/api/src/lib/storage.ts`) statt
  Supabase Storage.
- **E-Mail-Versand**: schreibt die "gesendete" E-Mail als JSON-Datei nach `apps/api/storage/outbox`
  (`apps/api/src/lib/email.ts`) statt sie tatsächlich zu verschicken.

## Tests

```bash
pnpm test
```
