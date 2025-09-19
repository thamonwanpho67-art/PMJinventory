-- CreateEnum
CREATE TYPE "public"."SupplyStatus" AS ENUM ('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "public"."SupplyTransactionType" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "public"."supplies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION,
    "supplier" TEXT,
    "location" TEXT,
    "status" "public"."SupplyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supply_transactions" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionType" "public"."SupplyTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remainingStock" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "department" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supply_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."supply_transactions" ADD CONSTRAINT "supply_transactions_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "public"."supplies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supply_transactions" ADD CONSTRAINT "supply_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
