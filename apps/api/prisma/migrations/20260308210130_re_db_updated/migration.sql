/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `platformRole` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
DROP COLUMN "platformRole",
ADD COLUMN     "avatar" TEXT;

-- DropEnum
DROP TYPE "PlatformRole";
