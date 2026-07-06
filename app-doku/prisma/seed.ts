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

  await prisma.objekt.upsert({
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
