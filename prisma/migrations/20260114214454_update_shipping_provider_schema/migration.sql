/*
  Warnings:

  - You are about to drop the column `isEnabled` on the `ShippingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `serviceablePincodes` on the `ShippingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `supportedModes` on the `ShippingProvider` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ShippingProvider_isEnabled_priority_idx";

-- AlterTable
ALTER TABLE "ShippingProvider" DROP COLUMN "isEnabled",
DROP COLUMN "serviceablePincodes",
DROP COLUMN "supportedModes",
ADD COLUMN     "connectionType" TEXT NOT NULL DEFAULT 'email_password',
ADD COLUMN     "deliveryModes" TEXT[],
ADD COLUMN     "paymentOptions" TEXT[];
