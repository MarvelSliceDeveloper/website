/*
  Warnings:

  - You are about to drop the column `subModuleId` on the `LiveSession` table. All the data in the column will be lost.
  - You are about to drop the `SubModule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LiveSession" DROP CONSTRAINT "LiveSession_subModuleId_fkey";

-- DropForeignKey
ALTER TABLE "SubModule" DROP CONSTRAINT "SubModule_moduleId_fkey";

-- AlterTable
ALTER TABLE "LiveSession" DROP COLUMN "subModuleId";

-- DropTable
DROP TABLE "SubModule";
