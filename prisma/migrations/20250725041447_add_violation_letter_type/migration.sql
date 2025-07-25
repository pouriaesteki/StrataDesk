/*
  Warnings:

  - Added the required column `type` to the `ViolationLetter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ViolationLetter" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'First Violation';
