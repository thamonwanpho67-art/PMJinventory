/*
  Warnings:

  - You are about to drop the column `note` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `loans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."loans" DROP COLUMN "note",
DROP COLUMN "quantity",
ADD COLUMN     "notes" TEXT;
