-- CreateEnum
CREATE TYPE "public"."SupplyRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "public"."supply_requests" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "requesterName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "notes" TEXT,
    "status" "public"."SupplyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."supply_requests" ADD CONSTRAINT "supply_requests_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "public"."supplies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supply_requests" ADD CONSTRAINT "supply_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
