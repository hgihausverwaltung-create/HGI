-- CreateEnum
CREATE TYPE "KontaktTyp" AS ENUM ('HANDWERKER', 'DIENSTLEISTER', 'BEIRAT');

-- CreateEnum
CREATE TYPE "AnredeTyp" AS ENUM ('HERR', 'FRAU', 'FIRMA');

-- AlterTable
ALTER TABLE "Eigentuemer" ADD COLUMN     "anrede" "AnredeTyp",
ADD COLUMN     "bankname" TEXT,
ADD COLUMN     "iban" TEXT;

-- AlterTable
ALTER TABLE "Mieter" ADD COLUMN     "anrede" "AnredeTyp";

-- CreateTable
CREATE TABLE "Kontakt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typ" "KontaktTyp" NOT NULL,
    "email" TEXT,
    "telefon" TEXT,
    "objektId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kontakt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Kontakt_objektId_idx" ON "Kontakt"("objektId");

-- CreateIndex
CREATE INDEX "Kontakt_typ_idx" ON "Kontakt"("typ");

-- AddForeignKey
ALTER TABLE "Kontakt" ADD CONSTRAINT "Kontakt_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
