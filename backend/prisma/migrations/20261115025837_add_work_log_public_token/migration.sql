/*
  Warnings:

  - A unique constraint covering the columns `[publicToken]` on the table `WorkLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WorkLog" ADD COLUMN     "publicToken" TEXT NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "WorkLog_publicToken_key" ON "WorkLog"("publicToken");
