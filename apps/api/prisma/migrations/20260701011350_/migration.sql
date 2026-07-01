/*
  Warnings:

  - Added the required column `scheduledEndAt` to the `LiveSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LiveSession" ADD COLUMN     "scheduledEndAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "isSticky" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Note_isSticky_idx" ON "Note"("isSticky");
