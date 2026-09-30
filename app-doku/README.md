# HGI Dokumentenverwaltung

Internes Dokumentenmanagement-Tool fuer HGI Immobilien GmbH: Dokumente hochladen, kategorisieren und Objekten/Einheiten/Eigentuemern/Mietern zuordnen.

## Stack

Next.js (App Router) + TypeScript, PostgreSQL + Prisma, NextAuth (Credentials), lokales Dateisystem hinter einer Storage-Abstraktion.

## Lokale Entwicklung

```bash
docker compose up -d          # Postgres starten
cp .env.example .env          # Umgebungsvariablen anlegen
npm install
npx prisma migrate dev
npx prisma db seed            # Testbenutzer: test@hgi-immobilien.de / test1234
npm run dev
```

Danach `http://localhost:3000` oeffnen.

## Scope

Aktueller Stand ist das Dokumentenmanagement-MVP. Aufgabenmanagement, eine CRM-Uebersicht und eine Live-Anbindung an WinCasa/idwell sind bewusst noch nicht enthalten (siehe `scripts/import-csv.ts` fuer das vorbereitete, aber noch ungenutzte Import-Grundgeruest).
