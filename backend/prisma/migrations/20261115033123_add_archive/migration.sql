-- CreateTable
CREATE TABLE "ArchiveFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentDate" DATE,
    "key" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArchiveFolder_userId_parentId_idx" ON "ArchiveFolder"("userId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveFolder_userId_parentId_name_key" ON "ArchiveFolder"("userId", "parentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveFile_key_key" ON "ArchiveFile"("key");

-- CreateIndex
CREATE INDEX "ArchiveFile_userId_folderId_idx" ON "ArchiveFile"("userId", "folderId");

-- AddForeignKey
ALTER TABLE "ArchiveFolder" ADD CONSTRAINT "ArchiveFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveFolder" ADD CONSTRAINT "ArchiveFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ArchiveFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveFile" ADD CONSTRAINT "ArchiveFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveFile" ADD CONSTRAINT "ArchiveFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ArchiveFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
