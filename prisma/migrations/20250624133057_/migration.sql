-- CreateTable
CREATE TABLE "RenovationWork" (
    "id" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "damageDepositCheckNumber" TEXT,
    "isExempted" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenovationWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenovationWorkFile" (
    "id" TEXT NOT NULL,
    "renovationWorkId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenovationWorkFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RenovationWorkFile" ADD CONSTRAINT "RenovationWorkFile_renovationWorkId_fkey" FOREIGN KEY ("renovationWorkId") REFERENCES "RenovationWork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
