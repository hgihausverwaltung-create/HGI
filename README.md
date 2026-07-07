# HGI Protokoll-App

Ersatz für die bisher genutzte App "smaps": eine generische, konfigurierbare Formular-Engine für
Hausverwaltungs-Protokolle (Übergabeprotokoll, Abnahmeprotokoll, Objektbegehung, Mängelerfassung, …),
für Web und Mobile, mit Offline-Fähigkeit für den Außendienst.

Der vollständige Architekturplan steht in [`docs/executive-master-prompt.md`](docs/executive-master-prompt.md)
(Unternehmenskontext) sowie im Planungsdokument dieser Session. Kurzfassung:

- **Monorepo** (pnpm + Turborepo): `apps/api` (Fastify + tRPC), `apps/web` (React + Vite), `apps/mobile`
  (Expo/React Native), sowie geteilte Pakete unter `packages/*`.
- **Formular-Engine** (`packages/form-schema`): Zod-basierte Definition von Vorlagen (Sections, Felder,
  "Bestehend aus"-Checklisten, die pro Auswahl automatisch ein Unterformular erzeugen — z.B. ein
  Raum-Formular pro angehaktem Zimmer).
- **Datenmodell** (`apps/api/prisma/schema.prisma`): Objekte/Wohnungen, versionierte Formularvorlagen
  (veröffentlichte Versionen sind unveränderlich), Formularentwürfe, Anhänge, Sende-Protokoll.

Aktueller Stand: **M1** (Fundament + Formular-Engine + Web-Admin), **M2** (Web-Entwurf ausfüllen,
PDF-Erzeugung, Versand) und **M3** (Mobile-App, online) sind umgesetzt und end-to-end verifiziert.
**M4** (Offline-Sync) und **M5** (Feinschliff echtes Übergabeprotokoll) folgen.

M2 ergänzt:
- **`packages/form-renderer`**: React-Komponente (Web/DOM), die ein Vorlagen-Schema in ein ausfüllbares
  Formular rendert (inkl. Foto-Upload, Raum-Unterformulare).
- **`packages/pdf`**: rendert ein ausgefülltes Protokoll (Schema + Antworten + Fotos) als
  HGI-gebrandetes PDF, inkl. Auflösung von Objekt-/Wohnungs-Referenzen zu lesbaren Namen.
- **Entwurf-Workflow im Web** (`/templates/:id`, `/drafts/:id`): Übersicht/Entwürfe/Gesendet-Tabs wie in
  smaps, Entwurf anlegen/ausfüllen/Foto hochladen/speichern/senden.

M3 ergänzt:
- **`apps/mobile`**: Expo/React-Native-App (Expo Router) mit Login, Vorlagen-Kacheln,
  Übersicht/Entwürfe/Gesendet-Tabs und Entwurf-Ausfüllen inkl. Kamera/Galerie-Fotoaufnahme — bisher nur
  **online** (Offline-Sync ist M4).
- **`packages/form-renderer-native`**: eigenständiger Formular-Renderer mit React-Native-Primitiven
  (View/Text/TextInput/Switch/Modal). `packages/form-renderer` (Web, DOM-Elemente) läuft nicht nativ auf
  iOS/Android, daher ein separates Paket — beide teilen sich die Schema-/Validierungslogik aus
  `@hgi/form-schema`.
- Da `apps/mobile` (React 19/React Native) und `apps/api`+`apps/web` (React 18) im selben pnpm-Workspace
  koexistieren, baut `@hgi/api` jetzt echte `.d.ts`-Dateien (`pnpm --filter @hgi/api build`) statt rohen
  Quellcode als Typ-Export zu nutzen — sonst hätte TypeScript beim Prüfen von `apps/mobile` transitiv
  den React-PDF-Code aus `@hgi/pdf` mitprüfen müssen und wäre auf einen React-18/19-Typkonflikt gelaufen.

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

# 4. API- und Web-Dev-Server starten (API auf :4000, Web auf :5173)
pnpm dev

# 5. Mobile-App separat starten (eigenes Terminal)
cp apps/mobile/.env.example apps/mobile/.env
cd apps/mobile && pnpm exec expo start          # für Gerät/Simulator via Expo Go / Dev-Client
# Web-Vorschau ohne Gerät/Emulator: siehe "Bekannter Punkt" unten (expo start --web ist aktuell defekt)
```

Test-Logins nach dem Seed:

| Rolle | E-Mail | Passwort |
|---|---|---|
| ADMIN | admin@hgi-immobilien.de | admin1234 |
| FIELD_STAFF | aussendienst@hgi-immobilien.de | aussendienst1234 |

Der Seed legt außerdem ein Beispiel-Objekt/-Wohnung sowie die echte **Übergabeprotokoll**-Vorlage
(inkl. der "Bestehend aus"-Raumliste aus den smaps-Screenshots) als veröffentlichte Version 1 an.

## Bekannter Punkt: `expo start --web` im Dev-Modus

Im **Dev-Modus** (`expo start --web`) bricht das Bundling aktuell mit einem Fehler in
`@expo/log-box` (Expo SDK 57, Stand dieser Session) ab — ein Versionskonflikt zwischen
`@expo/metro-runtime` und `@expo/log-box` in der aktuellen npm-Registry, nicht etwas in unserem
Code. Ein **Produktions-Export** ist davon nicht betroffen (die Fehlerüberlagerung ist reiner
Dev-Code und wird beim Production-Build weggelassen):

```bash
cd apps/mobile
pnpm exec expo export --platform web
npx serve -s dist -l 8082   # oder ein beliebiger statischer Webserver
```

Für die native App (iOS/Android via Expo Go oder Dev-Client) tritt dieses Problem nicht auf, da
dort ein anderer, funktionierender Pfad für die Fehlerüberlagerung verwendet wird. Sobald Expo
eine neue Patch-Version von `@expo/log-box` veröffentlicht, sollte `expo start --web` wieder
funktionieren.

## Hinweis zu Auth/Storage/E-Mail in Produktion

Für den produktiven Betrieb sieht der Architekturplan **Supabase** (Postgres, Auth, Storage, EU-Region)
sowie einen echten E-Mail-Anbieter (Resend/Postmark) vor. In dieser lokalen Entwicklungsumgebung laufen
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
