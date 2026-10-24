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
 * - Archivierte, nicht mehr aktiv gefuehrte Objekte: Nr. 287, 600, 638.
 * - Synthetisches Musterhaus 996.
 * - Weitere in Paperless gefuehrte Nummern ohne PLZ/Ort (u. a. zwei WEG):
 *   werden nicht erfunden, erst nach Nennung durch Edgard Schroeder.
 *
 * Nr. 227 (Ziegelstrasse 27, 33609 Bielefeld) am 24.10.2026 von Edgard
 * Schroeder genannt; in Paperless als Behoerdenschreiben-Objekt gefuehrt.
 *
 * Nr. 87 (WEG Auf dem Busch 44-78) fehlte im Export und wurde am
 * 21.08.2026 von Edgard Schroeder nachgetragen - PLZ/Ort per Rueckfrage
 * bestaetigt (gleiche Strasse wie Nr. 2, 33699 Bielefeld).
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
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function objektNummer(nr: number): string {
  return String(nr).padStart(3, "0");
}

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
  { nr: 201, name: "HGI GmbH & Co. KG (Sammelkonto)", strasse: "HGI GmbH & Co. KG (Sammelkonto)", plz: "33649", ort: "Bielefeld" },
  { nr: 206, name: "Auf der Suelte 6 (Konto 206)", strasse: "Auf der Suelte 6", plz: "33699", ort: "Bielefeld" },
  { nr: 224, name: "Im Alten Krug 3", strasse: "Im Alten Krug 3", plz: "33729", ort: "Bielefeld" },
  { nr: 225, name: "Apartmenthaus Ziegelstr. 25", strasse: "Ziegelstr. 25", plz: "33609", ort: "Bielefeld" },
  { nr: 255, name: "Detmolder Str. 55", strasse: "Detmolder Str. 55", plz: "33602", ort: "Bielefeld" },
  { nr: 256, name: "Engerstr. 56", strasse: "Engerstr. 56", plz: "32051", ort: "Herford" },
  { nr: 286, name: "Apartmenthaus Apfelstr. 86", strasse: "Apfelstr. 86", plz: "33613", ort: "Bielefeld" },
  { nr: 950, name: "WS Auf der Suelte 6", strasse: "Auf der Suelte 6", plz: "33699", ort: "Bielefeld" },
  { nr: 951, name: "WS Koesliner Str. 8", strasse: "Koesliner Str. 8", plz: "33605", ort: "Bielefeld" },
  // HGI Immobilien GmbH
  { nr: 300, name: "HGI Immobilien GmbH (Sammelkonto)", strasse: "HGI Immobilien GmbH (Sammelkonto)", plz: "33649", ort: "Bielefeld" },
  { nr: 500, name: "Kafkastr. 74", strasse: "Kafkastr. 74", plz: "33729", ort: "Bielefeld" },
  // HGI Immogroup GmbH
  { nr: 610, name: "Gruete 13A, Haus Rechts", strasse: "Gruete 13A, Haus Rechts", plz: "33813", ort: "Oerlinghausen" },
  { nr: 611, name: "Gruete 13, Haus Links", strasse: "Gruete 13, Haus Links", plz: "33813", ort: "Oerlinghausen" },
  { nr: 637, name: "Juetlandstrasse", strasse: "Juetlandstrasse", plz: "33729", ort: "Bielefeld" },
  { nr: 639, name: "Stromstrasse 6-8", strasse: "Stromstrasse 6-8", plz: "33729", ort: "Bielefeld" },
  // Weitere in Paperless gefuehrte Nummer (PLZ/Ort von Edgard Schroeder am 24.10.2026 genannt)
  { nr: 227, name: "Ziegelstr. 27", strasse: "Ziegelstr. 27", plz: "33609", ort: "Bielefeld" },
  // Private Zuordnung (Tetyana Schroeder) und Sonstige
  { nr: 900, name: "TS Stargarder Str. 26", strasse: "Stargarder Str. 26", plz: "33699", ort: "Bielefeld" },
  { nr: 901, name: "TS Auf der Suelte 6", strasse: "Auf der Suelte 6", plz: "33699", ort: "Bielefeld" },
  { nr: 903, name: "TS Koesliner Str. 8", strasse: "Koesliner Str. 8", plz: "33605", ort: "Bielefeld" },
  { nr: 904, name: "TS Taxusstr. 12", strasse: "Taxusstr. 12", plz: "33699", ort: "Bielefeld" },
  { nr: 990, name: "PV-Anlage Strom GbR", strasse: "PV-Anlage Strom GbR", plz: "33649", ort: "Bielefeld" },
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
      const neueId = `wincasa-${objektNummer(eintrag.nr)}`;
      const alteId = `wincasa-${eintrag.nr}`;
      if (alteId !== neueId) {
        const alt = await prisma.objekt.findUnique({ where: { externeId: alteId } });
        if (alt) {
          const neu = await prisma.objekt.findUnique({ where: { externeId: neueId } });
          if (neu) {
            throw new Error(`${alteId} und ${neueId} existieren beide, bitte manuell zusammenfuehren`);
          }
          await prisma.objekt.update({ where: { id: alt.id }, data: { externeId: neueId } });
        }
      }
      await prisma.objekt.upsert({
        where: { externeId: neueId },
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
          externeId: neueId,
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
