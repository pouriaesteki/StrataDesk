-- CreateTable
CREATE TABLE "PatrolLog" (
    "id" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "photoUrl" TEXT,
    "isNothingToReport" BOOLEAN NOT NULL DEFAULT false,
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatrolLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PatrolLog" ADD CONSTRAINT "PatrolLog_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
