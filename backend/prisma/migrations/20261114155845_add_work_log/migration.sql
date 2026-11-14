-- CreateEnum
CREATE TYPE "WorkCategory" AS ENUM ('PELAKSANAAN_TUGAS', 'PENGEMBANGAN_PERBAIKAN', 'KOORDINASI_RAPAT', 'PELAYANAN_PENDAMPINGAN', 'ADMINISTRASI_PELAPORAN', 'PENGEMBANGAN_KOMPETENSI', 'PERJALANAN_DINAS');

-- CreateTable
CREATE TABLE "WorkLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityDate" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "category" "WorkCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkLog_userId_activityDate_idx" ON "WorkLog"("userId", "activityDate");

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
