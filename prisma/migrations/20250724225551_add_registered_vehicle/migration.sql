-- CreateEnum
CREATE TYPE "ResidentType" AS ENUM ('OWNER', 'RENTER');

-- CreateTable
CREATE TABLE "RegisteredVehicle" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "parkingStall" TEXT,
    "unitNumber" TEXT NOT NULL,
    "residentType" "ResidentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegisteredVehicle_pkey" PRIMARY KEY ("id")
);
