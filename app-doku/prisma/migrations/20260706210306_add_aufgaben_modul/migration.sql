-- CreateEnum
CREATE TYPE "AufgabeStatus" AS ENUM ('OFFEN', 'IN_BEARBEITUNG', 'ERLEDIGT');

-- CreateEnum
CREATE TYPE "AufgabePrioritaet" AS ENUM ('NIEDRIG', 'MITTEL', 'HOCH', 'DRINGEND');

-- CreateTable
CREATE TABLE "Aufgabe" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "status" "AufgabeStatus" NOT NULL DEFAULT 'OFFEN',
    "prioritaet" "AufgabePrioritaet" NOT NULL DEFAULT 'MITTEL',
    "faelligkeitsdatum" TIMESTAMP(3),
    "objektId" TEXT,
    "dokumentId" TEXT,
    "erstelltVonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aufgabe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aufgabe_objektId_idx" ON "Aufgabe"("objektId");

-- CreateIndex
CREATE INDEX "Aufgabe_status_idx" ON "Aufgabe"("status");

-- CreateIndex
CREATE INDEX "Aufgabe_faelligkeitsdatum_idx" ON "Aufgabe"("faelligkeitsdatum");

-- AddForeignKey
ALTER TABLE "Aufgabe" ADD CONSTRAINT "Aufgabe_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aufgabe" ADD CONSTRAINT "Aufgabe_dokumentId_fkey" FOREIGN KEY ("dokumentId") REFERENCES "Dokument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aufgabe" ADD CONSTRAINT "Aufgabe_erstelltVonId_fkey" FOREIGN KEY ("erstelltVonId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
