# CLAUDE.md

Arbeitsanweisungen für Claude Code und andere Entwicklungsassistenten.

## Repository und Entwicklungsstände

Dieses Repository enthält die **HGI Protokoll-App** und fachliche Dokumentation für
die HGI Immobilien GmbH. Es ist ein Softwareprojekt mit Build-System und Tests.
Die frühere Beschreibung als reiner Dokumentenspeicher ist überholt.

Vor Änderungen den tatsächlich ausgecheckten Zweig und seinen Inhalt prüfen.
Der Standardzweig heißt derzeit `claude/new-session-udlv7n`.
Eine Übersicht der separaten Entwicklungslinien steht in [docs/projektstand.md](docs/projektstand.md).
Offene Pull Requests gelten nicht als integriert oder produktiv installiert.

## Aufbau des Standardzweigs

- `apps/api`: Fastify, tRPC, Prisma/PostgreSQL, Authentifizierung, Uploads und Versandabläufe.
- `apps/web`: React/Vite-Oberfläche.
- `packages/form-schema`: Zod-basierte Formular- und Antwortvalidierung.
- `packages/form-renderer`: React-Web-Renderer; nicht ungeprüft als nativen Mobile-Renderer verwenden.
- `packages/pdf`: PDF-Erstellung.
- `packages/domain`, `packages/api-client`, `packages/config`: gemeinsame Bausteine.
- `docs/executive-master-prompt.md`: fachliche HGI-Vorgaben.

Mobile/Offline und die separate Anwendung `app-doku` liegen nicht im Standardzweig.
Vor Arbeiten daran den passenden Branch und dessen eigene Anleitung prüfen.

## Entwicklung und Prüfung

Node.js >= 20; Paketmanager laut Root-`package.json`: pnpm 10.33.0.
PostgreSQL und lokale `.env`-Dateien sind für den Entwicklungsbetrieb erforderlich.
Die Anleitung in [README.md](README.md) beachten.

Verfügbare Root-Befehle:

```bash
pnpm install
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Nur zur Änderung passende Prüfungen ausführen. Erfolgreiche Prüfungen, Fehler und
nicht ausgeführte Prüfungen getrennt berichten; frühere PR-Testberichte sind keine neuen Testergebnisse.
`db:migrate` und `db:seed` verändern eine Datenbank. Für Entwicklung eine separate
Testdatenbank verwenden und niemals ungeprüft gegen die HGI-Produktivdatenbank ausführen.

## Grenzen der aktuellen Implementierung

- Authentifizierung ist eine eigene lokale Implementierung, kein belegter Supabase-Auth-Betrieb.
- Dateien liegen lokal unter `apps/api/storage/files`.
- `apps/api/src/lib/email.ts` schreibt JSON-Dateien nach `storage/outbox`.
  Ein erfolgreicher Aufruf oder ein „gesendet“-Status bedeutet hier keine tatsächliche Zustellung.
- Datenbankmodelle und Importskripte belegen weder eine produktive Datenübernahme noch eine Live-Schnittstelle.
- Testzugänge aus dem Seed sind ausschließlich für lokale Entwicklung vorgesehen.
- Keine Zugangsdaten, Tokens, `.env`-Dateien oder personenbezogenen Exporte in das Repository einchecken.

## Arbeit am Executive Master Prompt

- Das Dokument ist deutsch. Es spricht den Assistenten mit „du“ an;
  Korrespondenz an Dritte verwendet grundsätzlich „Sie“.
- Die bestehende Nummerierung der Abschnitte erhalten; neue Abschnitte fortlaufend ergänzen.
- Abschnitt 19 enthält die Signatur als wörtlichen Block. Format und Inhalt bei
  fachfremden Änderungen erhalten.
- Keine Fakten, Beträge, Daten oder Fristen erfinden. Fehlende Angaben als Platzhalter
  kennzeichnen oder gezielt erfragen.
- Gesicherte Fakten, Annahmen, rechtliche Einordnung, wirtschaftliche Bewertung
  und praktische Empfehlung klar unterscheiden.
- Einschlägige Rechtsgrundlagen und Aktualität rechtlicher Aussagen kenntlich machen.
  Der Assistent ersetzt keine Rechts-, Steuer- oder Notarberatung.
- Personenbezogene Daten sparsam verwenden und nur erforderliche Angaben weitergeben.
- Für Skripte mit Schreibzugriff auf Produktivdaten, insbesondere WinCasa/idwell,
  zunächst einen Trockenlauf vorschlagen und auf vorherige Datensicherung hinweisen.
- Struktur und Ton erhalten; nur aufgabenbezogene Änderungen vornehmen.
