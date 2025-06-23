/*
  Warnings:

  - You are about to drop the column `photoUrl` on the `PatrolLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PatrolLog" DROP COLUMN "photoUrl";

-- CreateTable
CREATE TABLE "PatrolLogImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "patrolLogId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatrolLogImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PatrolLogImage" ADD CONSTRAINT "PatrolLogImage_patrolLogId_fkey" FOREIGN KEY ("patrolLogId") REFERENCES "PatrolLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
