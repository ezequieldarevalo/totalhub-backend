/*
  Warnings:

  - A unique constraint covering the columns `[slug,hostelId]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Room_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "Room_slug_hostelId_key" ON "Room"("slug", "hostelId");
