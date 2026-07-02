-- AlterTable: batchId is now nullable for mentorship sessions
ALTER TABLE "LiveSession" ALTER COLUMN "batchId" DROP NOT NULL;

-- AlterTable: add mentorshipTicketId column
ALTER TABLE "LiveSession" ADD COLUMN "mentorshipTicketId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LiveSession_mentorshipTicketId_key" ON "LiveSession"("mentorshipTicketId");

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_mentorshipTicketId_fkey" FOREIGN KEY ("mentorshipTicketId") REFERENCES "MentorshipTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
