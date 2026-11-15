-- CreateTable
CREATE TABLE "WorkLogFile" (
    "id" TEXT NOT NULL,
    "workLogId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkLogFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkLogFile_key_key" ON "WorkLogFile"("key");

-- CreateIndex
CREATE INDEX "WorkLogFile_workLogId_idx" ON "WorkLogFile"("workLogId");

-- AddForeignKey
ALTER TABLE "WorkLogFile" ADD CONSTRAINT "WorkLogFile_workLogId_fkey" FOREIGN KEY ("workLogId") REFERENCES "WorkLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
