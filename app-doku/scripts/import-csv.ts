/**
 * Generisches Grundgeruest fuer einen spaeteren WinCasa/idwell-CSV-Import.
 *
 * Das genaue Exportformat von WinCasa/idwell ist noch nicht bekannt, daher
 * gibt es hier bewusst noch keinen konkreten Parser. Diese Datei zeigt nur,
 * wie ein Import als ImportJob nachvollziehbar protokolliert werden soll.
 *
 * Aufruf: npx tsx scripts/import-csv.ts <pfad-zur-csv> <quelle>
 */
import { readFile } from "fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [, , csvPath, quelle] = process.argv;
  if (!csvPath || !quelle) {
    console.error("Nutzung: npx tsx scripts/import-csv.ts <pfad-zur-csv> <quelle>");
    process.exit(1);
  }

  const job = await prisma.importJob.create({
    data: { quelle, status: "RUNNING", startedAt: new Date() },
  });

  try {
    const raw = await readFile(csvPath, "utf-8");
    const zeilen = raw.split("\n").filter((zeile) => zeile.trim().length > 0);

    // TODO: sobald das WinCasa/idwell-Exportformat bekannt ist, hier die
    // Spalten auf Objekt/Einheit/Eigentuemer/Mieter mappen und per
    // prisma.objekt.upsert({ where: { externeId } }) etc. einspielen.
    console.log(`Gelesen: ${zeilen.length} Zeilen aus ${csvPath}. Kein Parser konfiguriert.`);

    await prisma.importJob.update({
      where: { id: job.id },
      data: { status: "DONE", zeilenGesamt: zeilen.length, finishedAt: new Date() },
    });
  } catch (err) {
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        fehlerLog: err instanceof Error ? err.message : String(err),
        finishedAt: new Date(),
      },
    });
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main();
