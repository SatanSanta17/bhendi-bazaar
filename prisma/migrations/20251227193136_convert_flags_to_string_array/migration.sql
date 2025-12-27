/*
  Warnings:

  - You are about to drop the column `isFeatured` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isHero` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isOnOffer` on the `Product` table. All the data in the column will be lost.
  - The `flags` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isFeatured",
DROP COLUMN "isHero",
DROP COLUMN "isOnOffer",
DROP COLUMN "flags",
ADD COLUMN     "flags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropEnum
DROP TYPE "ProductFlag";
