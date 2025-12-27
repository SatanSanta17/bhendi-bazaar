-- CreateEnum
CREATE TYPE "ProductFlag" AS ENUM ('FEATURED', 'HERO', 'ON_OFFER', 'NEW_ARRIVAL', 'CLEARANCE_SALE');

-- DropIndex
DROP INDEX "Product_isFeatured_idx";

-- DropIndex
DROP INDEX "Product_isHero_idx";

-- DropIndex
DROP INDEX "Product_isOnOffer_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "flags" "ProductFlag"[] DEFAULT ARRAY[]::"ProductFlag"[];
