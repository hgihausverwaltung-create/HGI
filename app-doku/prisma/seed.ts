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
