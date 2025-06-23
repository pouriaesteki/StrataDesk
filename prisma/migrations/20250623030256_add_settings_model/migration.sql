-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "maxDurationHours" INTEGER NOT NULL DEFAULT 12,
    "consecutiveDaysLimit" INTEGER NOT NULL DEFAULT 2,
    "monthlyVisitLimit" INTEGER NOT NULL DEFAULT 7,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
