-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MITARBEITER');

-- CreateEnum
CREATE TYPE "EinheitTyp" AS ENUM ('WOHNUNG', 'GEWERBE', 'STELLPLATZ', 'SONSTIGES');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MITARBEITER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objekt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strasse" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    "ort" TEXT NOT NULL,
    "externeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Objekt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Einheit" (
    "id" TEXT NOT NULL,
    "objektId" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "typ" "EinheitTyp",
    "externeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Einheit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eigentuemer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "telefon" TEXT,
    "externeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Eigentuemer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EinheitEigentuemer" (
    "einheitId" TEXT NOT NULL,
    "eigentuemerId" TEXT NOT NULL,
    "anteil" TEXT,

    CONSTRAINT "EinheitEigentuemer_pkey" PRIMARY KEY ("einheitId","eigentuemerId")
);

-- CreateTable
CREATE TABLE "Mieter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "telefon" TEXT,
    "einheitId" TEXT NOT NULL,
    "externeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mieter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DokumentKategorie" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DokumentKategorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dokument" (
    "id" TEXT NOT NULL,
    "dateiname" TEXT NOT NULL,
    "speicherPfad" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "dateigroesse" INTEGER NOT NULL,
    "beschreibung" TEXT,
    "kategorieId" TEXT NOT NULL,
    "objektId" TEXT NOT NULL,
    "einheitId" TEXT,
    "eigentuemerId" TEXT,
    "mieterId" TEXT,
    "hochgeladenVonId" TEXT NOT NULL,
    "hochgeladenAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dokument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "quelle" TEXT NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "zeilenGesamt" INTEGER NOT NULL DEFAULT 0,
    "zeilenErfolgreich" INTEGER NOT NULL DEFAULT 0,
    "zeilenFehler" INTEGER NOT NULL DEFAULT 0,
    "fehlerLog" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Objekt_externeId_key" ON "Objekt"("externeId");

-- CreateIndex
CREATE UNIQUE INDEX "Einheit_externeId_key" ON "Einheit"("externeId");

-- CreateIndex
CREATE INDEX "Einheit_objektId_idx" ON "Einheit"("objektId");

-- CreateIndex
CREATE UNIQUE INDEX "Eigentuemer_externeId_key" ON "Eigentuemer"("externeId");

-- CreateIndex
CREATE UNIQUE INDEX "Mieter_externeId_key" ON "Mieter"("externeId");

-- CreateIndex
CREATE INDEX "Mieter_einheitId_idx" ON "Mieter"("einheitId");

-- CreateIndex
CREATE UNIQUE INDEX "DokumentKategorie_name_key" ON "DokumentKategorie"("name");

-- CreateIndex
CREATE INDEX "Dokument_kategorieId_idx" ON "Dokument"("kategorieId");

-- CreateIndex
CREATE INDEX "Dokument_objektId_idx" ON "Dokument"("objektId");

-- CreateIndex
CREATE INDEX "Dokument_dateiname_idx" ON "Dokument"("dateiname");

-- CreateIndex
CREATE INDEX "Dokument_hochgeladenAm_idx" ON "Dokument"("hochgeladenAm");

-- AddForeignKey
ALTER TABLE "Einheit" ADD CONSTRAINT "Einheit_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EinheitEigentuemer" ADD CONSTRAINT "EinheitEigentuemer_einheitId_fkey" FOREIGN KEY ("einheitId") REFERENCES "Einheit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EinheitEigentuemer" ADD CONSTRAINT "EinheitEigentuemer_eigentuemerId_fkey" FOREIGN KEY ("eigentuemerId") REFERENCES "Eigentuemer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mieter" ADD CONSTRAINT "Mieter_einheitId_fkey" FOREIGN KEY ("einheitId") REFERENCES "Einheit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dokument" ADD CONSTRAINT "Dokument_kategorieId_fkey" FOREIGN KEY ("kategorieId") REFERENCES "DokumentKategorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dokument" ADD CONSTRAINT "Dokument_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dokument" ADD CONSTRAINT "Dokument_einheitId_fkey" FOREIGN KEY ("einheitId") REFERENCES "Einheit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dokument" ADD CONSTRAINT "Dokument_eigentuemerId_fkey" FOREIGN KEY ("eigentuemerId") REFERENCES "Eigentuemer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dokument" ADD CONSTRAINT "Dokument_mieterId_fkey" FOREIGN KEY ("mieterId") REFERENCES "Mieter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dokument" ADD CONSTRAINT "Dokument_hochgeladenVonId_fkey" FOREIGN KEY ("hochgeladenVonId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
