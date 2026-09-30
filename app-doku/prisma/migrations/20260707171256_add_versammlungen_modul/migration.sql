-- CreateEnum
CREATE TYPE "VersammlungStatus" AS ENUM ('GEPLANT', 'DURCHGEFUEHRT');

-- CreateEnum
CREATE TYPE "TagesordnungsErgebnis" AS ENUM ('ANGENOMMEN', 'ABGELEHNT', 'VERTAGT');

-- CreateTable
CREATE TABLE "Versammlung" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "einladungsdatum" TIMESTAMP(3),
    "status" "VersammlungStatus" NOT NULL DEFAULT 'GEPLANT',
    "objektId" TEXT NOT NULL,
    "dokumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Versammlung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tagesordnungspunkt" (
    "id" TEXT NOT NULL,
    "versammlungId" TEXT NOT NULL,
    "reihenfolge" INTEGER NOT NULL,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "beschlussvorschlag" TEXT,
    "ergebnis" "TagesordnungsErgebnis",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tagesordnungspunkt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Versammlung_objektId_idx" ON "Versammlung"("objektId");

-- CreateIndex
CREATE INDEX "Versammlung_status_idx" ON "Versammlung"("status");

-- CreateIndex
CREATE INDEX "Versammlung_datum_idx" ON "Versammlung"("datum");

-- CreateIndex
CREATE INDEX "Tagesordnungspunkt_versammlungId_idx" ON "Tagesordnungspunkt"("versammlungId");

-- CreateIndex
CREATE UNIQUE INDEX "Tagesordnungspunkt_versammlungId_reihenfolge_key" ON "Tagesordnungspunkt"("versammlungId", "reihenfolge");

-- AddForeignKey
ALTER TABLE "Versammlung" ADD CONSTRAINT "Versammlung_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Versammlung" ADD CONSTRAINT "Versammlung_dokumentId_fkey" FOREIGN KEY ("dokumentId") REFERENCES "Dokument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tagesordnungspunkt" ADD CONSTRAINT "Tagesordnungspunkt_versammlungId_fkey" FOREIGN KEY ("versammlungId") REFERENCES "Versammlung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
