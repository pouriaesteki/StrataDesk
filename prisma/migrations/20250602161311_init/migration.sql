-- CreateEnum
CREATE TYPE "ViolationStatus" AS ENUM ('NONE', 'WARNING', 'VIOLATION');

-- CreateTable
CREATE TABLE "VisitorParkingRequest" (
    "id" TEXT NOT NULL,
    "vehicleMake" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "durationInHours" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "violationStatus" "ViolationStatus" NOT NULL DEFAULT 'NONE',
    "isExpired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VisitorParkingRequest_pkey" PRIMARY KEY ("id")
);
