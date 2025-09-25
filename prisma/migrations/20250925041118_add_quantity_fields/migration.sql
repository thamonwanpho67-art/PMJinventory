-- AlterTable
ALTER TABLE "public"."Asset" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."loans" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;
