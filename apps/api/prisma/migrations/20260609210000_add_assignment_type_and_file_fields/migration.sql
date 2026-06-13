-- AlterTable: Add type and questionPdfUrl to Assignment
ALTER TABLE "Assignment" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'QUIZ';
ALTER TABLE "Assignment" ADD COLUMN "questionPdfUrl" TEXT;

-- AlterTable: Add answerFileUrl to AssignmentSubmission
ALTER TABLE "AssignmentSubmission" ADD COLUMN "answerFileUrl" TEXT;
