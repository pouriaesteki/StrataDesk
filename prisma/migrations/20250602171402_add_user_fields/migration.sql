-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Owner', 'Concierge', 'Council', 'PropertyManager');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "unit" TEXT,
ALTER COLUMN "role" SET DEFAULT 'Concierge';
