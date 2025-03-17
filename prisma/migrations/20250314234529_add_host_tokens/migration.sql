/*
  Warnings:

  - Added the required column `hostAccessToken` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostRefreshToken` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "hostAccessToken" TEXT NOT NULL,
ADD COLUMN     "hostRefreshToken" TEXT NOT NULL;
