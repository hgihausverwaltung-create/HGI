-- CreateEnum
CREATE TYPE "WirtschaftsplanStatus" AS ENUM ('ENTWURF', 'BESCHLOSSEN');

-- CreateTable
CREATE TABLE "Wirtschaftsplan" (
    "id" TEXT NOT NULL,
    "wirtschaftsjahr" INTEGER NOT NULL,
    "status" "WirtschaftsplanStatus" NOT NULL DEFAULT 'ENTWURF',
    "objektId" TEXT NOT NULL,
    "versammlungId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wirtschaftsplan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HausgeldSoll" (
    "id" TEXT NOT NULL,
    "wirtschaftsplanId" TEXT NOT NULL,
    "einheitId" TEXT NOT NULL,
    "betragMonatlich" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HausgeldSoll_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Wirtschaftsplan_objektId_idx" ON "Wirtschaftsplan"("objektId");

-- CreateIndex
CREATE INDEX "Wirtschaftsplan_status_idx" ON "Wirtschaftsplan"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Wirtschaftsplan_objektId_wirtschaftsjahr_key" ON "Wirtschaftsplan"("objektId", "wirtschaftsjahr");

-- CreateIndex
CREATE INDEX "HausgeldSoll_wirtschaftsplanId_idx" ON "HausgeldSoll"("wirtschaftsplanId");

-- CreateIndex
CREATE INDEX "HausgeldSoll_einheitId_idx" ON "HausgeldSoll"("einheitId");

-- CreateIndex
CREATE UNIQUE INDEX "HausgeldSoll_wirtschaftsplanId_einheitId_key" ON "HausgeldSoll"("wirtschaftsplanId", "einheitId");

-- AddForeignKey
ALTER TABLE "Wirtschaftsplan" ADD CONSTRAINT "Wirtschaftsplan_objektId_fkey" FOREIGN KEY ("objektId") REFERENCES "Objekt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wirtschaftsplan" ADD CONSTRAINT "Wirtschaftsplan_versammlungId_fkey" FOREIGN KEY ("versammlungId") REFERENCES "Versammlung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HausgeldSoll" ADD CONSTRAINT "HausgeldSoll_wirtschaftsplanId_fkey" FOREIGN KEY ("wirtschaftsplanId") REFERENCES "Wirtschaftsplan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HausgeldSoll" ADD CONSTRAINT "HausgeldSoll_einheitId_fkey" FOREIGN KEY ("einheitId") REFERENCES "Einheit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
