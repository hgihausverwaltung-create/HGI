-- CreateEnum
CREATE TYPE "Verwaltungsart" AS ENUM ('WEG', 'MIETVERWALTUNG');

-- CreateEnum
CREATE TYPE "Kontoart" AS ENUM ('GEBAEUDE', 'SAMMELKONTO', 'TS_WS_KONTO');

-- CreateEnum
CREATE TYPE "ObjektStatus" AS ENUM ('AKTIV', 'IN_PLANUNG', 'ARCHIVIERT');

-- AlterTable
ALTER TABLE "Objekt" ADD COLUMN     "gesellschaft" TEXT,
ADD COLUMN     "kontoart" "Kontoart",
ADD COLUMN     "stammdatenQuelle" TEXT,
ADD COLUMN     "status" "ObjektStatus" NOT NULL DEFAULT 'AKTIV',
ADD COLUMN     "verwaltungsart" "Verwaltungsart";
