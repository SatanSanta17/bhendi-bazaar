/*
  Warnings:

  - You are about to drop the column `courierName` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `deliveredAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDelivery` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `items` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `lastStatusUpdate` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `packageDimensions` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `packageWeight` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shipmentStatus` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCost` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingMeta` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingProviderId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totals` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `trackingNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `trackingUrl` on the `Order` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_shippingProviderId_fkey";

-- DropIndex
DROP INDEX "Order_createdAt_idx";

-- DropIndex
DROP INDEX "Order_shipmentStatus_idx";

-- DropIndex
DROP INDEX "Order_shippingProviderId_idx";

-- DropIndex
DROP INDEX "Order_trackingNumber_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "courierName",
DROP COLUMN "deliveredAt",
DROP COLUMN "estimatedDelivery",
DROP COLUMN "items",
DROP COLUMN "lastStatusUpdate",
DROP COLUMN "packageDimensions",
DROP COLUMN "packageWeight",
DROP COLUMN "shipmentStatus",
DROP COLUMN "shippingCost",
DROP COLUMN "shippingMeta",
DROP COLUMN "shippingProviderId",
DROP COLUMN "totals",
DROP COLUMN "trackingNumber",
DROP COLUMN "trackingUrl",
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "itemsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shippingTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ShippingEvent" ADD COLUMN     "shipmentId" TEXT;

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "sellerId" TEXT NOT NULL,
    "fromPincode" TEXT NOT NULL,
    "fromCity" TEXT NOT NULL,
    "fromState" TEXT NOT NULL,
    "shippingCost" DOUBLE PRECISION NOT NULL,
    "shippingProviderId" TEXT,
    "trackingNumber" TEXT,
    "courierName" TEXT,
    "trackingUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "shipmentStatus" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "packageWeight" DOUBLE PRECISION,
    "packageDimensions" JSONB,
    "shippingMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_code_key" ON "Shipment"("code");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "Shipment_sellerId_idx" ON "Shipment"("sellerId");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "ShippingEvent_shipmentId_idx" ON "ShippingEvent"("shipmentId");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_shippingProviderId_fkey" FOREIGN KEY ("shippingProviderId") REFERENCES "ShippingProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingEvent" ADD CONSTRAINT "ShippingEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
