/*
  Warnings:

  - Added the required column `roomId` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "roomId" TEXT NOT NULL;
