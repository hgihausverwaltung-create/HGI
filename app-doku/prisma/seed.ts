import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const KATEGORIEN = ["Vertrag", "Protokoll", "Abrechnung", "Schreiben", "Sonstiges"];

async function main() {
  for (const [index, name] of KATEGORIEN.entries()) {
    await prisma.dokumentKategorie.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: index },
    });
  }

  const testEmail = "test@hgi-immobilien.de";
  const passwordHash = await bcrypt.hash("test1234", 10);
  await prisma.user.upsert({
    where: { email: testEmail },
    update: {},
    create: {
      email: testEmail,
      passwordHash,
      name: "Testbenutzer",
      role: "ADMIN",
    },
  });

  const objekt = await prisma.objekt.upsert({
    where: { externeId: "seed-objekt-1" },
    update: {},
    create: {
      name: "Musterstrasse 12",
      strasse: "Musterstrasse 12",
      plz: "33649",
      ort: "Bielefeld",
      externeId: "seed-objekt-1",
    },
  });

  if ((await prisma.versammlung.count()) === 0) {
    await prisma.versammlung.create({
      data: {
        titel: "Ordentliche Eigentuemerversammlung 2026",
        datum: new Date("2026-08-15T18:00:00"),
        einladungsdatum: new Date("2026-07-25T00:00:00"),
        status: "GEPLANT",
        objektId: objekt.id,
        tagesordnungspunkte: {
          create: [
            { reihenfolge: 1, titel: "Begruessung und Feststellung der Beschlussfaehigkeit" },
            {
              reihenfolge: 2,
              titel: "Genehmigung der Jahresabrechnung 2025",
              beschlussvorschlag:
                "Die Eigentuemerversammlung genehmigt die vorgelegte Jahresabrechnung 2025.",
            },
            {
              reihenfolge: 3,
              titel: "Beschluss ueber Fassadensanierung",
              beschreibung: "Angebot der Firma Mustermann Bau liegt vor.",
              beschlussvorschlag: "Die Fassadensanierung wird gemaess Angebot beauftragt.",
            },
          ],
        },
      },
    });
  }

  const einheit1 = await prisma.einheit.upsert({
    where: { externeId: "seed-einheit-1" },
    update: {},
    create: {
      objektId: objekt.id,
      bezeichnung: "WE 1",
      typ: "WOHNUNG",
      externeId: "seed-einheit-1",
    },
  });

  const einheit2 = await prisma.einheit.upsert({
    where: { externeId: "seed-einheit-2" },
    update: {},
    create: {
      objektId: objekt.id,
      bezeichnung: "WE 2",
      typ: "WOHNUNG",
      externeId: "seed-einheit-2",
    },
  });

  const versammlungFuerPlan = await prisma.versammlung.findFirst({ where: { objektId: objekt.id } });

  const wirtschaftsplan = await prisma.wirtschaftsplan.upsert({
    where: { objektId_wirtschaftsjahr: { objektId: objekt.id, wirtschaftsjahr: 2026 } },
    update: {},
    create: {
      objektId: objekt.id,
      wirtschaftsjahr: 2026,
      status: "ENTWURF",
      versammlungId: versammlungFuerPlan?.id,
    },
  });

  await prisma.hausgeldSoll.upsert({
    where: {
      wirtschaftsplanId_einheitId: { wirtschaftsplanId: wirtschaftsplan.id, einheitId: einheit1.id },
    },
    update: {},
    create: { wirtschaftsplanId: wirtschaftsplan.id, einheitId: einheit1.id, betragMonatlich: "250.00" },
  });

  await prisma.hausgeldSoll.upsert({
    where: {
      wirtschaftsplanId_einheitId: { wirtschaftsplanId: wirtschaftsplan.id, einheitId: einheit2.id },
    },
    update: {},
    create: { wirtschaftsplanId: wirtschaftsplan.id, einheitId: einheit2.id, betragMonatlich: "180.00" },
  });

  const testUser = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });

  if ((await prisma.ticket.count()) === 0) {
    await prisma.ticket.create({
      data: {
        titel: "Heizung in WE 1 faellt aus",
        beschreibung: "Mieter meldet, dass die Heizung seit gestern kalt bleibt.",
        kategorie: "SCHADENSMELDUNG",
        prioritaet: "HOCH",
        status: "IN_BEARBEITUNG",
        objektId: objekt.id,
        einheitId: einheit1.id,
        zugewiesenAnId: testUser.id,
        kommentare: {
          create: [{ text: "Handwerker beauftragt, Termin morgen 9 Uhr.", erstelltVonId: testUser.id }],
        },
      },
    });

    await prisma.ticket.create({
      data: {
        titel: "Frage zur Nebenkostenabrechnung",
        kategorie: "ANFRAGE",
        prioritaet: "NIEDRIG",
        status: "OFFEN",
        objektId: objekt.id,
        einheitId: einheit2.id,
      },
    });
  }

  console.log("Seed abgeschlossen. Testbenutzer: %s / test1234", testEmail);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
