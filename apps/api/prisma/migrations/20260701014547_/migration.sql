/*
  Warnings:

  - Added the required column `title` to the `LiveSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LiveSession" ADD COLUMN     "title" TEXT NOT NULL;
