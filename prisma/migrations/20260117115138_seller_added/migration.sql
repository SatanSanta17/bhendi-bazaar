/*
  Warnings:

  - You are about to drop the column `bankAccountName` on the `Seller` table. All the data in the column will be lost.
  - You are about to drop the column `bankAccountNumber` on the `Seller` table. All the data in the column will be lost.
  - You are about to drop the column `bankIfscCode` on the `Seller` table. All the data in the column will be lost.
  - You are about to drop the column `commissionRate` on the `Seller` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Seller" DROP COLUMN "bankAccountName",
DROP COLUMN "bankAccountNumber",
DROP COLUMN "bankIfscCode",
DROP COLUMN "commissionRate";
