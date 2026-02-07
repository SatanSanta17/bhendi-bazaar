/*
  Warnings:

  - Made the column `shipmentId` on table `ShippingEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "weight" DOUBLE PRECISION DEFAULT 0.5;

-- AlterTable
ALTER TABLE "ShippingEvent" ALTER COLUMN "shipmentId" SET NOT NULL;
