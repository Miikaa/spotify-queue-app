/*
  Warnings:

  - A unique constraint covering the columns `[roomId,userId]` on the table `ConnectedUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ConnectedUser_roomId_userId_key" ON "ConnectedUser"("roomId", "userId");
