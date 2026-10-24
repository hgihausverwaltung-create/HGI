-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OFFEN', 'IN_BEARBEITUNG', 'ERLEDIGT', 'STORNIERT');

-- CreateEnum
CREATE TYPE "TicketPrioritaet" AS ENUM ('NIEDRIG', 'NORMAL', 'HOCH');

-- CreateEnum
CREATE TYPE "TicketKategorie" AS ENUM ('SCHADENSMELDUNG', 'ANFRAGE', 'BESCHWERDE', 'SONSTIGES');

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "kategorie" "TicketKategorie" NOT NULL DEFAULT 'SONSTIGES',
    "prioritaet" "TicketPrioritaet" NOT NULL DEFAULT 'NORMAL',
    "status" "TicketStatus" NOT NULL DEFAULT 'OFFEN',
    "objektId" TEXT NOT NULL,
    "einheitId" TEXT,
    "mieterId" TEXT,
    "eigentuemerId" TEXT,
    "zugewiesenAnId" TEXT,
    "externeId" TEXT,
    "gemeldetAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "erledigtAm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketKommentar" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "erstelltVonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketKommentar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_externeId_key" ON "Ticket"("externeId");

-- CreateIndex
CREATE INDEX "Ticket_objektId_idx" ON "Ticket"("objektId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_prioritaet_idx" ON "Ticket"("prioritaet");

-- CreateIndex
CREATE INDEX "Ticket_zugewiesenAnId_idx" ON "Ticket"("zugewiesenAnId");

-- CreateIndex
CREATE INDEX "TicketKommentar_ticketId_idx" ON "TicketKommentar"("ticketId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_einheitId_fkey" FOREIGN KEY ("einheitId") REFERENCES "Einheit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_mieterId_fkey" FOREIGN KEY ("mieterId") REFERENCES "Mieter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eigentuemerId_fkey" FOREIGN KEY ("eigentuemerId") REFERENCES "Eigentuemer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_zugewiesenAnId_fkey" FOREIGN KEY ("zugewiesenAnId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketKommentar" ADD CONSTRAINT "TicketKommentar_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketKommentar" ADD CONSTRAINT "TicketKommentar_erstelltVonId_fkey" FOREIGN KEY ("erstelltVonId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
