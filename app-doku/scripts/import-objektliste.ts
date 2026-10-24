/**
 * Einmaliger Import der WEG- und Mietverwaltungs-Objektliste aus dem
 * WinCasa-Export vom 05.07.2026 (Referenzdatei objekte.md, Stand 12.07.2026)
 * in die Ticket-App, damit Tickets echten Objekten statt Testdaten
 * zugeordnet werden koennen.
 *
 * Entscheidung Edgard Schroeder 24.10.2026: Jedes WinCasa-Konto bekommt
 * seine eigene Objektnummer, wie in der zentralen Paperless-Ablage. Dazu
 * gehoeren die TS-/WS-Konten (900, 901, 903, 904, 950, 951), die
 * Sammel-/Verrechnungskonten (201, 300, 990) und Nr. 206 (Auf der Suelte 6
 * unter HGI GmbH & Co. KG). TS-/WS-Konten betreffen laut Quelle dasselbe
 * Gebaeude wie ein WEG-Objekt (z. B. 901/950 wie Nr. 7); die Namen tragen
 * deshalb das Praefix TS bzw. WS.
 *
 * Weiterhin ausgelassen:
 * - Archivierte Objekte Nr. 287 (Potsdamer Str. 15-17) und Nr. 638 (Suedstr. 72):
 *   von Edgard Schroeder am 24.10.2026 bestaetigt archiviert, werden nicht in die
 *   Ticket-App aufgenommen. Die Nummern bleiben vergeben und werden nicht neu
 *   verwendet.
 * - Synthetisches Musterhaus 996.
 * - Nr. 011 (frueher Fuerstenweg 1-3): archiviert, laut Edgard Schroeder
 *   24.10.2026 nicht mehr aktiv.
 * - Weitere in Paperless gefuehrte Nummern ohne PLZ/Ort: werden nicht erfunden,
 *   erst nach Nennung durch Edgard Schroeder. (Die zwei fehlenden WEG sind mit
 *   003 und 072 am 24.10.2026 nachgetragen.)
 *
 * Nr. 600 (HGI Immogroup GmbH, Sammelkonto, 33649 Bielefeld): laut Export
 * archiviert, am 24.10.2026 von Edgard Schroeder als aktiv bestaetigt. Daten
 * (Bezeichnung, PLZ/Ort) aus dem WinCasa-Export, Sammelkonto wie 201/300/990.
 *
 * Nr. 227 (kuenftig Ziegelstrasse 27, 33609 Bielefeld): am 24.10.2026 von
 * Edgard Schroeder genannt. Mietobjekt (kein WEG) der HGI GmbH & Co. KG,
 * Grundstueck neben Nr. 225 (vermietete Apartments), Neubauprojekt in
 * Planung: Bau naechstes Jahr, 18 Apartments vorgesehen.
 *
 * Nr. 003 (Faerberweg 3, 33659 Bielefeld) fehlte im Export; Name von Edgard
 * Schroeder am 24.10.2026 bestaetigt, PLZ/Ort aus dem Drive-Ordner "WEG 003".
 *
 * Nr. 072 (Queller Str. 72, 33649 Bielefeld) fehlte im Export; Strasse von
 * Edgard Schroeder am 24.10.2026 bestaetigt, PLZ/Ort aus dem Drive-Ordner
 * "WEG 072".
 *
 * Abgleich mit "Objeckte Alle Adressen.xlsx" (Drive, Stand 05.01.2026):
 * Nr. 637 erhaelt die Hausnummer 37 (Juetlandstr. 37), Nr. 200 (Buerohaus HGI)
 * die Strasse Osnabruecker Str. 49.
 *
 * PLZ-Pruefung 24.10.2026 (Claude, Gegenpruefung durch Edgard Schroeder offen):
 * - 015 Lange Str. 1: 32139 Spenge (Versicherungsschein "Lange Strasse 1, 32139
 *   Spenge"; Strassenverzeichnisse). Die 32052 der Adressdatei ist falsch.
 * - 016 Loheide 16: 33609 (Anschrift der Eigentuemer und Angebot des Dachdeckers
 *   vom 27.09.2026, ImmoScout24/onlinestreet/dasoertliche). Die 33611 aus dem
 *   WinCasa-Export und im Kopf der Vulcavo-Unterlagen ist abweichend.
 * - 038 Guetersloher Str. 38A: 33649 (Strassenschluessel Finanzverwaltung NRW:
 *   Nr. 38 bis 384A = 33649, Nr. 2 bis 12 = 33647; Vulcavo-Stammdaten, Tickets).
 *   Der Ordnername "33647" und das Angebot von 2024 sind abweichend.
 * - 200 Osnabruecker Str. 49: 33649 (Kaufvertrag 04.09.2025 und Briefkopf der HGI;
 *   33749 gibt es in Bielefeld nicht).
 * Bei bereits importierten Objekten wird die PLZ nur mit --uebernehmen=16 geaendert.
 *
 * Nr. 87 (WEG Auf dem Busch 44-78) fehlte im Export und wurde am
 * 21.08.2026 von Edgard Schroeder nachgetragen - PLZ/Ort per Rueckfrage
 * bestaetigt (gleiche Strasse wie Nr. 2, 33699 Bielefeld).
 *
 * Namen und Strassen werden von Sonderzeichen befreit ("/" wird "-",
 * "&" und "+" werden "und"), Vorgabe Edgard Schroeder 24.10.2026.
 *
 * Anzeigename = Objektnummer dreistellig, dann Bezeichnung, ohne "WEG"
 * (Vorgabe Edgard Schroeder 24.10.2026), z. B. "012 Myrtenweg 12".
 * Bereits importierte Objekte erhalten den neuen Namen beim naechsten Lauf.
 *
 * externeId = "wincasa-<Objektnummer dreistellig mit fuehrenden Nullen>",
 * z. B. wincasa-087, wie die Objektnummer in Paperless. Frueher importierte
 * Objekte mit der alten Schreibweise (wincasa-87) werden umbenannt, nicht
 * doppelt angelegt. Idempotent - mehrfacher Aufruf ist sicher.
 *
 * Aufruf: npx tsx scripts/import-objektliste.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import type { Kontoart, ObjektStatus, Verwaltungsart } from "../app/generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function objektNummer(nr: number): string {
  return String(nr).padStart(3, "0");
}

// Keine Sonderzeichen in Namen und Strassen, damit sie als Ordner- und Dateinamen
// und in Skripten keine Fehler verursachen: "/" wird "-", "&" und "+" werden "und".
function bereinige(text: string): string {
  const sauber = text
    .replace(/\s*[&+]\s*/g, " und ")
    .replace(/\s*\/\s*/g, (treffer) => (treffer.includes(" ") ? " - " : "-"))
    .replace(/[\\:*?"<>|]/g, "-")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!/^[A-Za-z0-9 .,()-]+$/.test(sauber)) {
    throw new Error(`Unzulaessige Zeichen in "${text}"`);
  }
  return sauber;
}

function anzeigename(eintrag: { nr: number; name: string }): string {
  return `${objektNummer(eintrag.nr)} ${bereinige(eintrag.name)}`;
}

type ObjektEintrag = {
  nr: number;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
};

// Klassifikation aus der Gruppierung der Quelle (WEG-Liste, Kommentarbloecke der
// Mietverwaltungsliste) und den Entscheidungen vom 24.10.2026. Nicht Bekanntes
// bleibt leer (null) statt geraten; so z. B. bei Gesellschaft der Fremdverwaltung
// und der privaten Zuordnung.
type Klassifikation = {
  verwaltungsart: Verwaltungsart;
  kontoart: Kontoart;
  gesellschaft: string | null;
  status: ObjektStatus;
};

const SAMMELKONTEN = new Set([201, 300, 600, 990]);
const TS_WS_KONTEN = new Set([900, 901, 903, 904, 950, 951]);
const GESELLSCHAFT_NACH_NR = new Map<number, string>([
  ...[200, 201, 206, 224, 225, 227, 255, 256, 286, 950, 951].map((nr): [number, string] => [nr, "HGI GmbH & Co. KG"]),
  ...[300, 500].map((nr): [number, string] => [nr, "HGI Immobilien GmbH"]),
  ...[600, 610, 611, 637, 639].map((nr): [number, string] => [nr, "HGI Immogroup GmbH"]),
]);
const IN_PLANUNG = new Set([227]);

function klassifiziere(nr: number, istWeg: boolean): Klassifikation {
  return {
    verwaltungsart: istWeg ? "WEG" : "MIETVERWALTUNG",
    kontoart: SAMMELKONTEN.has(nr) ? "SAMMELKONTO" : TS_WS_KONTEN.has(nr) ? "TS_WS_KONTO" : "GEBAEUDE",
    gesellschaft: GESELLSCHAFT_NACH_NR.get(nr) ?? null,
    status: IN_PLANUNG.has(nr) ? "IN_PLANUNG" : "AKTIV",
  };
}

const WEG_OBJEKTE: ObjektEintrag[] = [
  { nr: 1, name: "Brueckenstr. 66, 66a", strasse: "Brueckenstr. 66, 66a", plz: "33607", ort: "Bielefeld" },
  { nr: 2, name: "Auf dem Busch 1", strasse: "Auf dem Busch 1", plz: "33699", ort: "Bielefeld" },
  { nr: 3, name: "Faerberweg 3", strasse: "Faerberweg 3", plz: "33659", ort: "Bielefeld" },
  { nr: 4, name: "Woerheider Weg 4", strasse: "Woerheider Weg 4", plz: "33739", ort: "Bielefeld" },
  { nr: 7, name: "Auf der Suelte 6", strasse: "Auf der Suelte 6", plz: "33699", ort: "Bielefeld" },
  { nr: 10, name: "Taxusstr. 12", strasse: "Taxusstr. 12", plz: "33699", ort: "Bielefeld" },
  { nr: 12, name: "Myrtenweg 12", strasse: "Myrtenweg 12", plz: "33699", ort: "Bielefeld" },
  { nr: 15, name: "Lange Str. 1", strasse: "Lange Str. 1", plz: "32139", ort: "Spenge" },
  { nr: 16, name: "Loheide 16", strasse: "Loheide 16", plz: "33609", ort: "Bielefeld" },
  { nr: 17, name: "Nonengrund 3B", strasse: "Nonengrund 3B", plz: "33813", ort: "Oerlinghausen" },
  { nr: 25, name: "Obere Wiesenstr. 25", strasse: "Obere Wiesenstr. 25", plz: "32130", ort: "Hiddenhausen" },
  { nr: 27, name: "Am Erdbeerfeld 27", strasse: "Am Erdbeerfeld 27", plz: "33659", ort: "Bielefeld" },
  { nr: 31, name: "Brakhofstr. 31", strasse: "Brakhofstr. 31", plz: "33729", ort: "Bielefeld" },
  { nr: 32, name: "Kreuzstr. 32", strasse: "Kreuzstr. 32", plz: "33602", ort: "Bielefeld" },
  { nr: 33, name: "Stargarder Str. 26", strasse: "Stargarder Str. 26", plz: "33699", ort: "Bielefeld" },
  { nr: 34, name: "Stargarder Str. 12", strasse: "Stargarder Str. 12", plz: "33699", ort: "Bielefeld" },
  { nr: 37, name: "Am Jakobsberg 7/7A", strasse: "Am Jakobsberg 7/7A", plz: "33803", ort: "Steinhagen" },
  { nr: 38, name: "Guetersloher Str. 38A", strasse: "Guetersloher Str. 38A", plz: "33649", ort: "Bielefeld" },
  { nr: 40, name: "Koesliner Str. 8", strasse: "Koesliner Str. 8", plz: "33605", ort: "Bielefeld" },
  { nr: 41, name: "August-Bebel-Str. 69", strasse: "August-Bebel-Str. 69", plz: "33602", ort: "Bielefeld" },
  { nr: 47, name: "Kiebitzweg 47", strasse: "Kiebitzweg 47", plz: "33607", ort: "Bielefeld" },
  { nr: 48, name: "Buschweg 48", strasse: "Buschweg 48", plz: "33758", ort: "Schloss Holte-Stukenbrock" },
  { nr: 55, name: "Beckendorfstr. 55", strasse: "Beckendorfstr. 55", plz: "33739", ort: "Bielefeld" },
  { nr: 57, name: "Jungbrunnenweg 71/73/75", strasse: "Jungbrunnenweg 71/73/75", plz: "33609", ort: "Bielefeld" },
  { nr: 69, name: "Mainweg 69A", strasse: "Mainweg 69A", plz: "33689", ort: "Bielefeld" },
  { nr: 72, name: "Queller Str. 72", strasse: "Queller Str. 72", plz: "33649", ort: "Bielefeld" },
  { nr: 74, name: "Dornberger Strasse 274-276", strasse: "Dornberger Strasse 274-276", plz: "33619", ort: "Bielefeld" },
  { nr: 87, name: "Auf dem Busch 44-78", strasse: "Auf dem Busch 44-78", plz: "33699", ort: "Bielefeld" },
  { nr: 88, name: "Osnabruecker Str. 88", strasse: "Osnabruecker Str. 88", plz: "33649", ort: "Bielefeld" },
  { nr: 103, name: "Leharstr. 3/3A/3B", strasse: "Leharstr. 3/3A/3B", plz: "33647", ort: "Bielefeld" },
  {
    nr: 104,
    name: "Kahler Krug 2,4,4a,4b / Joellenbecker Str. 391,393",
    strasse: "Kahler Krug 2,4,4a,4b / Joellenbecker Str. 391,393",
    plz: "33739",
    ort: "Bielefeld",
  },
  { nr: 115, name: "Potsdamer Str. 15-17", strasse: "Potsdamer Str. 15-17", plz: "33719", ort: "Bielefeld" },
  { nr: 117, name: "Gerhardstr. 17", strasse: "Gerhardstr. 17", plz: "33649", ort: "Bielefeld" },
];

const MIETVERWALTUNG_OBJEKTE: ObjektEintrag[] = [
  // Fremdverwaltung - externe Eigentuemer
  { nr: 168, name: "Wannseeweg 6+8", strasse: "Wannseeweg 6+8", plz: "33619", ort: "Bielefeld" },
  { nr: 173, name: "Loehner Str. 173 & 177", strasse: "Loehner Str. 173 & 177", plz: "32120", ort: "Hiddenhausen" },
  { nr: 183, name: "Joellenbecker Str. 183", strasse: "Joellenbecker Str. 183", plz: "33619", ort: "Bielefeld" },
  { nr: 902, name: "Am Sonnenberg 2", strasse: "Am Sonnenberg 2", plz: "32105", ort: "Bad Salzuflen" },
  // HGI GmbH & Co. KG
  { nr: 200, name: "Buerohaus HGI", strasse: "Osnabruecker Str. 49", plz: "33649", ort: "Bielefeld" },
  { nr: 201, name: "HGI GmbH & Co. KG (Sammelkonto)", strasse: "HGI GmbH & Co. KG (Sammelkonto)", plz: "33649", ort: "Bielefeld" },
  { nr: 206, name: "Auf der Suelte 6", strasse: "Auf der Suelte 6", plz: "33699", ort: "Bielefeld" },
  { nr: 224, name: "Im Alten Krug 3", strasse: "Im Alten Krug 3", plz: "33729", ort: "Bielefeld" },
  { nr: 225, name: "Apartmenthaus Ziegelstr. 25", strasse: "Ziegelstr. 25", plz: "33609", ort: "Bielefeld" },
  // Nr. 227: Mietobjekt der HGI GmbH & Co. KG, Grundstueck neben Nr. 225, kuenftig Ziegelstr. 27.
  // Neubauprojekt in Planung (Bau 2027 geplant, 18 Apartments). Noch keine Einheiten anlegen.
  { nr: 227, name: "Neubauprojekt Ziegelstr. 27 (in Planung)", strasse: "Ziegelstr. 27", plz: "33609", ort: "Bielefeld" },
  { nr: 255, name: "Detmolder Str. 55", strasse: "Detmolder Str. 55", plz: "33602", ort: "Bielefeld" },
  { nr: 256, name: "Engerstr. 56", strasse: "Engerstr. 56", plz: "32051", ort: "Herford" },
  { nr: 286, name: "Apartmenthaus Apfelstr. 86", strasse: "Apfelstr. 86", plz: "33613", ort: "Bielefeld" },
  { nr: 950, name: "WS Auf der Suelte 6", strasse: "Auf der Suelte 6", plz: "33699", ort: "Bielefeld" },
  { nr: 951, name: "WS Koesliner Str. 8", strasse: "Koesliner Str. 8", plz: "33605", ort: "Bielefeld" },
  // HGI Immobilien GmbH
  { nr: 300, name: "HGI Immobilien GmbH (Sammelkonto)", strasse: "HGI Immobilien GmbH (Sammelkonto)", plz: "33649", ort: "Bielefeld" },
  { nr: 500, name: "Kafkastr. 74", strasse: "Kafkastr. 74", plz: "33729", ort: "Bielefeld" },
  // HGI Immogroup GmbH
  { nr: 600, name: "HGI Immogroup GmbH (Sammelkonto)", strasse: "HGI Immogroup GmbH (Sammelkonto)", plz: "33649", ort: "Bielefeld" },
  { nr: 610, name: "Gruete 13A, Haus Rechts", strasse: "Gruete 13A, Haus Rechts", plz: "33813", ort: "Oerlinghausen" },
  { nr: 611, name: "Gruete 13, Haus Links", strasse: "Gruete 13, Haus Links", plz: "33813", ort: "Oerlinghausen" },
  { nr: 637, name: "Juetlandstr. 37", strasse: "Juetlandstr. 37", plz: "33729", ort: "Bielefeld" },
  { nr: 639, name: "Stromstrasse 6-8", strasse: "Stromstrasse 6-8", plz: "33729", ort: "Bielefeld" },
  // Private Zuordnung (Tetyana Schroeder) und Sonstige
  { nr: 900, name: "TS Stargarder Str. 26", strasse: "Stargarder Str. 26", plz: "33699", ort: "Bielefeld" },
  { nr: 901, name: "TS Auf der Suelte 6", strasse: "Auf der Suelte 6", plz: "33699", ort: "Bielefeld" },
  { nr: 903, name: "TS Koesliner Str. 8", strasse: "Koesliner Str. 8", plz: "33605", ort: "Bielefeld" },
  { nr: 904, name: "TS Taxusstr. 12", strasse: "Taxusstr. 12", plz: "33699", ort: "Bielefeld" },
  { nr: 990, name: "PV-Anlage Strom GbR", strasse: "PV-Anlage Strom GbR", plz: "33649", ort: "Bielefeld" },
];

const QUELLE = "objekte.md (WinCasa-Export 05.07.2026, Skill-Referenz Stand 12.07.2026), Nachtraege Edgard Schroeder 24.10.2026";

type Ziel = ObjektEintrag &
  Klassifikation & { neueId: string; alteId: string; anzeige: string; strasseSauber: string };

type Datenbank = Pick<PrismaClient, "objekt">;
type Aktion = "NEU" | "UMBENENNEN" | "UNVERAENDERT" | "AENDERN" | "KONFLIKT";
type PlanZeile = { ziel: Ziel; aktion: Aktion; vorhanden?: VorhandenesObjekt; daten?: Record<string, unknown>; konflikte: string[] };
type VorhandenesObjekt = NonNullable<Awaited<ReturnType<Datenbank["objekt"]["findFirst"]>>>;

function parseArgs(argv: string[]) {
  const ausfuehren = argv.includes("--ausfuehren");
  const arg = argv.find((a) => a.startsWith("--uebernehmen="));
  const wert = arg?.slice("--uebernehmen=".length) ?? "";
  const alle = wert === "alle";
  const nummern = new Set(
    alle ? [] : wert.split(",").filter(Boolean).map((n) => {
      const nr = Number(n);
      if (!Number.isInteger(nr)) throw new Error(`--uebernehmen: "${n}" ist keine Objektnummer`);
      return nr;
    }),
  );
  return { ausfuehren, uebernehmenAlle: alle, uebernehmenNummern: nummern };
}

function ziele(): { ziele: Ziel[]; fehler: string[] } {
  const fehler: string[] = [];
  const liste: Ziel[] = [];
  const gesehenNr = new Set<number>();
  for (const [eintraege, istWeg] of [[WEG_OBJEKTE, true], [MIETVERWALTUNG_OBJEKTE, false]] as const) {
    for (const e of eintraege) {
      try {
        if (gesehenNr.has(e.nr)) throw new Error("Objektnummer doppelt in der Liste");
        gesehenNr.add(e.nr);
        liste.push({
          ...e,
          ...klassifiziere(e.nr, istWeg),
          neueId: `wincasa-${objektNummer(e.nr)}`,
          alteId: `wincasa-${e.nr}`,
          anzeige: anzeigename(e),
          strasseSauber: bereinige(e.strasse),
        });
      } catch (err) {
        fehler.push(`Nr. ${e.nr} (${e.name}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  return { ziele: liste, fehler };
}

// Ermittelt je Objekt, was zu tun ist. Liest nur, schreibt nichts.
async function plane(db: Datenbank, alle: Ziel[], uebernehmen: { alle: boolean; nummern: Set<number> }) {
  const vorhandene = await db.objekt.findMany({
    where: { externeId: { in: alle.flatMap((z) => [z.neueId, z.alteId]) } },
  });
  const nachId = new Map(vorhandene.map((o) => [o.externeId, o]));
  const fehler: string[] = [];
  const zeilen: PlanZeile[] = [];

  for (const z of alle) {
    const neu = nachId.get(z.neueId);
    const alt = z.alteId !== z.neueId ? nachId.get(z.alteId) : undefined;
    if (neu && alt) {
      fehler.push(`Nr. ${z.nr}: ${z.alteId} und ${z.neueId} existieren beide, bitte manuell zusammenfuehren`);
      continue;
    }
    const vorhanden = neu ?? alt;
    if (!vorhanden) {
      zeilen.push({
        ziel: z,
        aktion: "NEU",
        konflikte: [],
        daten: {
          name: z.anzeige, strasse: z.strasseSauber, plz: z.plz, ort: z.ort, externeId: z.neueId,
          verwaltungsart: z.verwaltungsart, kontoart: z.kontoart, gesellschaft: z.gesellschaft, status: z.status,
          stammdatenQuelle: QUELLE,
        },
      });
      continue;
    }

    const daten: Record<string, unknown> = {};
    const konflikte: string[] = [];
    if (alt) daten.externeId = z.neueId;

    const darfUeberschreiben = uebernehmen.alle || uebernehmen.nummern.has(z.nr);
    const stamm: [string, string, string][] = [
      ["name", vorhanden.name, z.anzeige],
      ["strasse", vorhanden.strasse, z.strasseSauber],
      ["plz", vorhanden.plz, z.plz],
      ["ort", vorhanden.ort, z.ort],
    ];
    for (const [feld, istWert, sollWert] of stamm) {
      if (istWert === sollWert) continue;
      if (darfUeberschreiben) daten[feld] = sollWert;
      else konflikte.push(`${feld}: DB "${istWert}" / Liste "${sollWert}"`);
    }
    // Klassifikation: leere Felder fuellen, abweichende Werte als Konflikt melden.
    const klass: [string, unknown, unknown][] = [
      ["verwaltungsart", vorhanden.verwaltungsart, z.verwaltungsart],
      ["kontoart", vorhanden.kontoart, z.kontoart],
      ["gesellschaft", vorhanden.gesellschaft, z.gesellschaft],
    ];
    for (const [feld, istWert, sollWert] of klass) {
      if (istWert === sollWert || sollWert === null) continue;
      if (istWert === null) daten[feld] = sollWert;
      else if (darfUeberschreiben) daten[feld] = sollWert;
      else konflikte.push(`${feld}: DB "${istWert}" / Liste "${sollWert}"`);
    }
    // status hat einen Default (AKTIV): nur von AKTIV auf IN_PLANUNG heben, nie zurueckstufen.
    if (vorhanden.status !== z.status) {
      if (darfUeberschreiben || (vorhanden.status === "AKTIV" && z.status === "IN_PLANUNG")) daten.status = z.status;
      else konflikte.push(`status: DB "${vorhanden.status}" / Liste "${z.status}"`);
    }
    if (Object.keys(daten).length > 0 && vorhanden.stammdatenQuelle !== QUELLE) daten.stammdatenQuelle = QUELLE;

    const aktion: Aktion =
      konflikte.length > 0 ? "KONFLIKT" : alt ? "UMBENENNEN" : Object.keys(daten).length > 0 ? "AENDERN" : "UNVERAENDERT";
    // Ein Konflikt blockiert nicht die uebrigen, unstrittigen Felder desselben Objekts.
    zeilen.push({ ziel: z, aktion, vorhanden, daten, konflikte });
  }
  return { zeilen, fehler };
}

function bericht(zeilen: PlanZeile[]): string {
  const anzahl = (a: Aktion) => zeilen.filter((z) => z.aktion === a).length;
  const kopf =
    `Neu: ${anzahl("NEU")}, Umbenennen: ${anzahl("UMBENENNEN")}, Aendern: ${anzahl("AENDERN")}, ` +
    `Unveraendert: ${anzahl("UNVERAENDERT")}, Konflikt: ${anzahl("KONFLIKT")}`;
  const details = zeilen
    .filter((z) => z.aktion !== "UNVERAENDERT")
    .map((z) => {
      const felder = Object.keys(z.daten ?? {}).filter((f) => f !== "stammdatenQuelle");
      return `  ${z.aktion.padEnd(10)} ${objektNummer(z.ziel.nr)} ${z.ziel.anzeige}` +
        (z.aktion !== "NEU" && felder.length > 0 ? ` -> setzt: ${felder.join(", ")}` : "") +
        z.konflikte.map((k) => `\n             Konflikt ${k}`).join("");
    });
  return [kopf, ...details].join("\n");
}

async function main() {
  const { ausfuehren, uebernehmenAlle, uebernehmenNummern } = parseArgs(process.argv.slice(2));
  const uebernehmen = { alle: uebernehmenAlle, nummern: uebernehmenNummern };
  const { ziele: alle, fehler: vorabFehler } = ziele();

  if (!ausfuehren) {
    const { zeilen, fehler } = await plane(prisma, alle, uebernehmen);
    const alleFehler = [...vorabFehler, ...fehler];
    console.log("PROBELAUF - es wird nichts geschrieben. Zum Schreiben --ausfuehren angeben.");
    console.log(bericht(zeilen));
    if (alleFehler.length > 0) {
      console.error("Fehler (Ausfuehren waere abgebrochen):\n" + alleFehler.join("\n"));
      process.exitCode = 1;
    }
    return;
  }

  const job = await prisma.importJob.create({
    data: { quelle: QUELLE, status: "RUNNING", startedAt: new Date(), zeilenGesamt: alle.length },
  });
  let backupDatei: string | null = null;
  try {
    if (vorabFehler.length > 0) throw new Error(vorabFehler.join("\n"));
    const ergebnis = await prisma.$transaction(
      async (tx) => {
        const { zeilen, fehler } = await plane(tx, alle, uebernehmen);
        if (fehler.length > 0) throw new Error(fehler.join("\n"));

        const betroffen = zeilen.filter((z) => z.vorhanden && z.daten && Object.keys(z.daten).length > 0);
        if (betroffen.length > 0) {
          const ordner = path.join(process.env.STORAGE_ROOT ?? "./storage", "import-backups");
          await mkdir(ordner, { recursive: true });
          backupDatei = path.join(ordner, `objektliste-${job.id}.json`);
          await writeFile(
            backupDatei,
            JSON.stringify({ importJobId: job.id, quelle: QUELLE, vorwerte: betroffen.map((z) => z.vorhanden) }, null, 2),
          );
        }
        for (const z of zeilen) {
          if (z.aktion === "NEU") {
            await tx.objekt.create({ data: z.daten as never });
          } else if (z.vorhanden && z.daten && Object.keys(z.daten).length > 0) {
            await tx.objekt.update({ where: { id: z.vorhanden.id }, data: z.daten as never });
          }
        }
        return zeilen;
      },
      { timeout: 60_000 },
    );

    const konflikte = ergebnis.filter((z) => z.aktion === "KONFLIKT");
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: "DONE",
        zeilenErfolgreich: ergebnis.length - konflikte.length,
        zeilenFehler: konflikte.length,
        fehlerLog:
          konflikte.length > 0
            ? "KONFLIKTE (Stammdaten nicht ueberschrieben, mit --uebernehmen aufloesen):\n" +
              konflikte.map((z) => `Nr. ${z.ziel.nr}: ${z.konflikte.join("; ")}`).join("\n")
            : null,
        finishedAt: new Date(),
      },
    });
    console.log(bericht(ergebnis));
    console.log(`Transaktion abgeschlossen. ImportJob ${job.id}.`);
    if (backupDatei) console.log(`Vorwerte gesichert in ${backupDatei}`);
    if (konflikte.length > 0) console.log(`${konflikte.length} Konflikt(e) offen, siehe oben.`);
  } catch (err) {
    const meldung = err instanceof Error ? err.message : String(err);
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        zeilenFehler: 1,
        fehlerLog: `Transaktion zurueckgerollt, es wurde nichts geaendert.\n${meldung}`,
        finishedAt: new Date(),
      },
    });
    console.error(`FEHLER - nichts geaendert (zurueckgerollt):\n${meldung}`);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
