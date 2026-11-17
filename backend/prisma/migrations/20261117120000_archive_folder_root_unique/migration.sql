-- PostgreSQL menganggap NULL berbeda satu sama lain, sehingga unique index
-- [userId, parentId, name] tidak mencegah nama folder root (parentId IS NULL)
-- duplikat. NULLS NOT DISTINCT (PostgreSQL 15+) membuat nama folder root unik
-- per pengguna. Ditulis manual karena Prisma belum mendukung opsi ini di @@unique.
DROP INDEX "ArchiveFolder_userId_parentId_name_key";

CREATE UNIQUE INDEX "ArchiveFolder_userId_parentId_name_key" ON "ArchiveFolder"(
    "userId",
    "parentId",
    "name"
) NULLS NOT DISTINCT;
