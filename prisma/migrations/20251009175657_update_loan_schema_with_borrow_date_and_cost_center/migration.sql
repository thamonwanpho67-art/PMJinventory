/*
  Warnings:

  - You are about to drop the column `notes` on the `loans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."loans" DROP COLUMN "notes",
ADD COLUMN     "borrowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "costCenter" TEXT,
ADD COLUMN     "note" TEXT,
ALTER COLUMN "dueAt" DROP NOT NULL;
