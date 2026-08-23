/**
 * Einmaliger Import der WEG- und Mietverwaltungs-Objektliste aus dem
 * WinCasa-Export vom 05.07.2026 (Referenzdatei objekte.md, Stand 12.07.2026)
 * in die Ticket-App, damit Tickets echten Objekten statt Testdaten
 * zugeordnet werden koennen.
 *
 * Bewusst ausgelassen (mit Edgard Schroeder abgestimmt):
 * - Sammel-/Verrechnungskonten ohne eigenes Gebaeude: Nr. 201, 300, 990.
 * - TS-/WS-Konten, die laut Quelle dasselbe Gebaeude wie ein bereits
 *   gelistetes WEG-Objekt betreffen: Nr. 206, 900, 901, 903, 904, 950, 951.
 * - Archivierte, nicht mehr aktiv gefuehrte Objekte: Nr. 287, 600, 638.
 *
 * Nr. 87 (WEG Auf dem Busch 44-78) fehlte im Export und wurde am
 * 21.08.2026 von Edgard Schroeder nachgetragen - PLZ/Ort per Rueckfrage
 * bestaetigt (gleiche Strasse wie Nr. 2, 33699 Bielefeld).
 *
 * externeId = "wincasa-<Objektnummer>" fuer einen spaeteren Abgleich mit
 * WinCasa/idwell. Idempotent per upsert - mehrfacher Aufruf ist sicher.
 *
 * Aufruf: npx tsx scripts/import-objektliste.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type ObjektEintrag = {
  nr: number;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
};

const WEG_OBJEKTE: ObjektEintrag[] = [
  { nr: 1, name: "WEG Brueckenstr. 66, 66a", strasse: "Brueckenstr. 66, 66a", plz: "33607", ort: "Bielefeld" },
  { nr: 2, name: "WEG Auf dem Busch 1", strasse: "Auf dem Busch 1", plz: "33699", ort: "Bielefeld" },
  { nr: 4, name: "WEG Woerheider Weg 4", strasse: "Woerheider Weg 4", plz: "33739", ort: "Bielefeld" },
  { nr: 7, name: "WEG Auf der Suelte 6", strasse: "Auf der Suelte 6", plz: "33699", ort: "Bielefeld" },
  { nr: 10, name: "WEG Taxusstr. 12", strasse: "Taxusstr. 12", plz: "33699", ort: "Bielefeld" },
  { nr: 12, name: "WEG Myrtenweg 12", strasse: "Myrtenweg 12", plz: "33699", ort: "Bielefeld" },
  { nr: 15, name: "WEG Lange Str. 1", strasse: "Lange Str. 1", plz: "32139", ort: "Spenge" },
  { nr: 16, name: "WEG Loheide 16", strasse: "Loheide 16", plz: "33611", ort: "Bielefeld" },
  { nr: 17, name: "WEG Nonengrund 3B", strasse: "Nonengrund 3B", plz: "33813", ort: "Oerlinghausen" },
  { nr: 25, name: "WEG Obere Wiesenstr. 25", strasse: "Obere Wiesenstr. 25", plz: "32130", ort: "Hiddenhausen" },
  { nr: 27, name: "WEG Am Erdbeerfeld 27", strasse: "Am Erdbeerfeld 27", plz: "33659", ort: "Bielefeld" },
  { nr: 31, name: "WEG Brakhofstr. 31", strasse: "Brakhofstr. 31", plz: "33729", ort: "Bielefeld" },
  { nr: 32, name: "WEG Kreuzstr. 32", strasse: "Kreuzstr. 32", plz: "33602", ort: "Bielefeld" },
  { nr: 33, name: "WEG Stargarder Str. 26", strasse: "Stargarder Str. 26", plz: "33699", ort: "Bielefeld" },
  { nr: 34, name: "WEG Stargarder Str. 12", strasse: "Stargarder Str. 12", plz: "33699", ort: "Bielefeld" },
  { nr: 37, name: "WEG Am Jakobsberg 7/7A", strasse: "Am Jakobsberg 7/7A", plz: "33803", ort: "Steinhagen" },
  { nr: 38, name: "WEG Guetersloher Str. 38A", strasse: "Guetersloher Str. 38A", plz: "33649", ort: "Bielefeld" },
  { nr: 40, name: "WEG Koesliner Str. 8", strasse: "Koesliner Str. 8", plz: "33605", ort: "Bielefeld" },
  { nr: 41, name: "WEG August-Bebel-Str. 69", strasse: "August-Bebel-Str. 69", plz: "33602", ort: "Bielefeld" },
  { nr: 47, name: "WEG Kiebitzweg 47", strasse: "Kiebitzweg 47", plz: "33607", ort: "Bielefeld" },
  { nr: 48, name: "WEG Buschweg 48", strasse: "Buschweg 48", plz: "33758", ort: "Schloss Holte-Stukenbrock" },
  { nr: 55, name: "WEG Beckendorfstr. 55", strasse: "Beckendorfstr. 55", plz: "33739", ort: "Bielefeld" },
  { nr: 57, name: "WEG Jungbrunnenweg 71/73/75", strasse: "Jungbrunnenweg 71/73/75", plz: "33609", ort: "Bielefeld" },
  { nr: 69, name: "WEG Mainweg 69A", strasse: "Mainweg 69A", plz: "33689", ort: "Bielefeld" },
  { nr: 74, name: "WEG Dornberger Strasse 274-276", strasse: "Dornberger Strasse 274-276", plz: "33619", ort: "Bielefeld" },
  { nr: 87, name: "WEG Auf dem Busch 44-78", strasse: "Auf dem Busch 44-78", plz: "33699", ort: "Bielefeld" },
  { nr: 88, name: "WEG Osnabruecker Str. 88", strasse: "Osnabruecker Str. 88", plz: "33649", ort: "Bielefeld" },
  { nr: 103, name: "WEG Leharstr. 3/3A/3B", strasse: "Leharstr. 3/3A/3B", plz: "33647", ort: "Bielefeld" },
  {
    nr: 104,
    name: "WEG Kahler Krug 2,4,4a,4b / Joellenbecker Str. 391,393",
    strasse: "Kahler Krug 2,4,4a,4b / Joellenbecker Str. 391,393",
    plz: "33739",
    ort: "Bielefeld",
  },
  { nr: 115, name: "WEG Potsdamer Str. 15-17", strasse: "Potsdamer Str. 15-17", plz: "33719", ort: "Bielefeld" },
  { nr: 117, name: "WEG Gerhardstr. 17", strasse: "Gerhardstr. 17", plz: "33649", ort: "Bielefeld" },
];

const MIETVERWALTUNG_OBJEKTE: ObjektEintrag[] = [
  // Fremdverwaltung - externe Eigentuemer
  { nr: 168, name: "Wannseeweg 6+8", strasse: "Wannseeweg 6+8", plz: "33619", ort: "Bielefeld" },
  { nr: 173, name: "Loehner Str. 173 & 177", strasse: "Loehner Str. 173 & 177", plz: "32120", ort: "Hiddenhausen" },
  { nr: 183, name: "Joellenbecker Str. 183", strasse: "Joellenbecker Str. 183", plz: "33619", ort: "Bielefeld" },
  { nr: 902, name: "Am Sonnenberg 2", strasse: "Am Sonnenberg 2", plz: "32105", ort: "Bad Salzuflen" },
  // HGI GmbH & Co. KG
  { nr: 200, name: "Buerohaus HGI", strasse: "Buerohaus HGI", plz: "33649", ort: "Bielefeld" },
  { nr: 224, name: "Im Alten Krug 3", strasse: "Im Alten Krug 3", plz: "33729", ort: "Bielefeld" },
  { nr: 225, name: "Apartmenthaus Ziegelstr. 25", strasse: "Ziegelstr. 25", plz: "33609", ort: "Bielefeld" },
  { nr: 255, name: "Detmolder Str. 55", strasse: "Detmolder Str. 55", plz: "33602", ort: "Bielefeld" },
  { nr: 256, name: "Engerstr. 56", strasse: "Engerstr. 56", plz: "32051", ort: "Herford" },
  { nr: 286, name: "Apartmenthaus Apfelstr. 86", strasse: "Apfelstr. 86", plz: "33613", ort: "Bielefeld" },
  // HGI Immobilien GmbH
  { nr: 500, name: "Kafkastr. 74", strasse: "Kafkastr. 74", plz: "33729", ort: "Bielefeld" },
  // HGI Immogroup GmbH
  { nr: 610, name: "Gruete 13A, Haus Rechts", strasse: "Gruete 13A, Haus Rechts", plz: "33813", ort: "Oerlinghausen" },
  { nr: 611, name: "Gruete 13, Haus Links", strasse: "Gruete 13, Haus Links", plz: "33813", ort: "Oerlinghausen" },
  { nr: 637, name: "Juetlandstrasse", strasse: "Juetlandstrasse", plz: "33729", ort: "Bielefeld" },
  { nr: 639, name: "Stromstrasse 6-8", strasse: "Stromstrasse 6-8", plz: "33729", ort: "Bielefeld" },
];

const QUELLE = "objekte.md (WinCasa-Export 05.07.2026, Skill-Referenz Stand 12.07.2026)";

async function main() {
  const alleObjekte = [...WEG_OBJEKTE, ...MIETVERWALTUNG_OBJEKTE];

  const job = await prisma.importJob.create({
    data: { quelle: QUELLE, status: "RUNNING", startedAt: new Date(), zeilenGesamt: alleObjekte.length },
  });

  let erfolgreich = 0;
  const fehler: string[] = [];

  for (const eintrag of alleObjekte) {
    try {
      await prisma.objekt.upsert({
        where: { externeId: `wincasa-${eintrag.nr}` },
        update: {
          name: eintrag.name,
          strasse: eintrag.strasse,
          plz: eintrag.plz,
          ort: eintrag.ort,
        },
        create: {
          name: eintrag.name,
          strasse: eintrag.strasse,
          plz: eintrag.plz,
          ort: eintrag.ort,
          externeId: `wincasa-${eintrag.nr}`,
        },
      });
      erfolgreich += 1;
    } catch (err) {
      fehler.push(`Nr. ${eintrag.nr} (${eintrag.name}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await prisma.importJob.update({
    where: { id: job.id },
    data: {
      status: fehler.length === 0 ? "DONE" : "FAILED",
      zeilenErfolgreich: erfolgreich,
      zeilenFehler: fehler.length,
      fehlerLog: fehler.length > 0 ? fehler.join("\n") : null,
      finishedAt: new Date(),
    },
  });

  console.log(`Import abgeschlossen: ${erfolgreich}/${alleObjekte.length} Objekte importiert.`);
  if (fehler.length > 0) {
    console.error("Fehler:\n" + fehler.join("\n"));
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
