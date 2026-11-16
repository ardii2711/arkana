/*
  Warnings:

  - A unique constraint covering the columns `[nip]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AccountTokenType" ADD VALUE 'EMAIL_CHANGE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarKey" TEXT,
ADD COLUMN     "employeeStatus" TEXT,
ADD COLUMN     "golongan" TEXT,
ADD COLUMN     "nip" TEXT,
ADD COLUMN     "pendingEmail" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "titleAfter" TEXT,
ADD COLUMN     "titleBefore" TEXT,
ADD COLUMN     "unit" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_nip_key" ON "User"("nip");
