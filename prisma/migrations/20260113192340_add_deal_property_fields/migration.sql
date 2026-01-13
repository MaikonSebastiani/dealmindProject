/*
  Warnings:

  - Added the required column `updatedAt` to the `Deal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "address" TEXT,
ADD COLUMN     "propertyName" TEXT,
ADD COLUMN     "propertyType" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Em análise',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
