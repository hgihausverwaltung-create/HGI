# HGI Protokoll-App

Ersatz für die bisher genutzte App "smaps": eine generische, konfigurierbare Formular-Engine für
Hausverwaltungs-Protokolle (Übergabeprotokoll, Abnahmeprotokoll, Objektbegehung, Mängelerfassung, …),
für Web und Mobile, mit Offline-Fähigkeit für den Außendienst.

Der vollständige Architekturplan steht in [`docs/executive-master-prompt.md`](docs/executive-master-prompt.md)
(Unternehmenskontext) sowie im Planungsdokument dieser Session. Kurzfassung:

- **Monorepo** (pnpm + Turborepo): `apps/api` (Fastify + tRPC), `apps/web` (React + Vite), `apps/mobile`
  (Expo, folgt in M3/M4), sowie geteilte Pakete unter `packages/*`.
- **Formular-Engine** (`packages/form-schema`): Zod-basierte Definition von Vorlagen (Sections, Felder,
  "Bestehend aus"-Checklisten, die pro Auswahl automatisch ein Unterformular erzeugen — z.B. ein
  Raum-Formular pro angehaktem Zimmer).
- **Datenmodell** (`apps/api/prisma/schema.prisma`): Objekte/Wohnungen, versionierte Formularvorlagen
  (veröffentlichte Versionen sind unveränderlich), Formularentwürfe, Anhänge, Sende-Protokoll.

Aktueller Stand: **Meilenstein M1** (Fundament + Formular-Engine + Web-Admin) ist umgesetzt und
end-to-end verifiziert. M2 (Web-Entwurf-Ausfüllen + PDF + Versand), M3 (Mobile), M4 (Offline-Sync) und
M5 (echtes Übergabeprotokoll) folgen.

## Lokale Entwicklung

Voraussetzungen: Node.js ≥ 20, pnpm, eine lokale PostgreSQL-Instanz.

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

Test-Logins nach dem Seed:

| Rolle | E-Mail | Passwort |
|---|---|---|
| ADMIN | admin@hgi-immobilien.de | admin1234 |
| FIELD_STAFF | aussendienst@hgi-immobilien.de | aussendienst1234 |

Der Seed legt außerdem ein Beispiel-Objekt/-Wohnung sowie die echte **Übergabeprotokoll**-Vorlage
(inkl. der "Bestehend aus"-Raumliste aus den smaps-Screenshots) als veröffentlichte Version 1 an.

## Hinweis zu Auth/Hosting in Produktion

Für den produktiven Betrieb sieht der Architekturplan **Supabase** (Postgres, Auth, Storage, EU-Region)
vor. In dieser lokalen Entwicklungsumgebung läuft stattdessen eine gewöhnliche PostgreSQL-Instanz mit
einem eigenen, dazu kompatiblen E-Mail/Passwort-Login (`apps/api/src/lib/auth.ts`), da hierfür keine
Cloud-Zugangsdaten benötigt werden. Der Wechsel auf Supabase Auth ist auf diese eine Datei begrenzt.

## Tests

```bash
pnpm test
```
