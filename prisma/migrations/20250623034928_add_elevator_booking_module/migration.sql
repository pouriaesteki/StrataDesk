-- CreateEnum
CREATE TYPE "ElevatorBookingReason" AS ENUM ('MOVING', 'RENO', 'DELIVERY');

-- CreateTable
CREATE TABLE "ElevatorBooking" (
    "id" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "reason" "ElevatorBookingReason" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElevatorBooking_pkey" PRIMARY KEY ("id")
);
