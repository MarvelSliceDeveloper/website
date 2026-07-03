/*
  Warnings:

  - You are about to drop the column `durationSeconds` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `resources` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `videoEmbedId` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `videoType` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Module` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Module" DROP COLUMN "durationSeconds",
DROP COLUMN "resources",
DROP COLUMN "videoEmbedId",
DROP COLUMN "videoType",
DROP COLUMN "videoUrl";

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "videoType" TEXT,
    "videoUrl" TEXT,
    "videoEmbedId" TEXT,
    "durationSeconds" INTEGER,
    "isFreePreview" BOOLEAN NOT NULL DEFAULT false,
    "resources" JSONB,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
