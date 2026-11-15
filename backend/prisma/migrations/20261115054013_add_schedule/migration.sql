-- CreateEnum
CREATE TYPE "ScheduleCategory" AS ENUM ('RAPAT_KOORDINASI', 'PEKERJAAN_TUGAS', 'PELATIHAN_PENGEMBANGAN', 'PERJALANAN_DINAS', 'KEGIATAN_PRIBADI', 'TENGGAT_WAKTU', 'LAINNYA');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('NOT_STARTED', 'DONE', 'CANCELLED');

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "category" "ScheduleCategory" NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Schedule_userId_startAt_idx" ON "Schedule"("userId", "startAt");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
