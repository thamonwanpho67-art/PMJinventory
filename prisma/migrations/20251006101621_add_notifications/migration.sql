-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('LOAN_REQUEST', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_RETURNED', 'LOW_STOCK', 'SYSTEM');

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "targetRole" "public"."Role" NOT NULL DEFAULT 'ADMIN',
    "relatedId" TEXT,
    "relatedType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
