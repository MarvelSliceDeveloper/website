/*
  Warnings:

  - You are about to drop the column `pinned` on the `Note` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LiveSession" DROP CONSTRAINT "LiveSession_batchId_fkey";

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "pinned";

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
