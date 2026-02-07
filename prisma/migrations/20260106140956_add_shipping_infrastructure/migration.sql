-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "lastStatusUpdate" TIMESTAMP(3),
ADD COLUMN     "packageDimensions" JSONB,
ADD COLUMN     "packageWeight" DOUBLE PRECISION,
ADD COLUMN     "shipmentStatus" TEXT,
ADD COLUMN     "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shippingMeta" JSONB,
ADD COLUMN     "shippingProviderId" TEXT,
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingUrl" TEXT;

-- CreateTable
CREATE TABLE "ShippingProvider" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "supportedModes" TEXT[],
    "features" JSONB,
    "serviceablePincodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingRateCache" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "fromPincode" TEXT NOT NULL,
    "toPincode" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "mode" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "courierName" TEXT NOT NULL,
    "estimatedDays" INTEGER NOT NULL,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingRateCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "request" JSONB,
    "response" JSONB,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingProvider_code_key" ON "ShippingProvider"("code");

-- CreateIndex
CREATE INDEX "ShippingProvider_isEnabled_priority_idx" ON "ShippingProvider"("isEnabled", "priority");

-- CreateIndex
CREATE INDEX "ShippingProvider_code_idx" ON "ShippingProvider"("code");

-- CreateIndex
CREATE INDEX "ShippingRateCache_expiresAt_idx" ON "ShippingRateCache"("expiresAt");

-- CreateIndex
CREATE INDEX "ShippingRateCache_fromPincode_idx" ON "ShippingRateCache"("fromPincode");

-- CreateIndex
CREATE INDEX "ShippingRateCache_toPincode_idx" ON "ShippingRateCache"("toPincode");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingRateCache_providerId_fromPincode_toPincode_weight_m_key" ON "ShippingRateCache"("providerId", "fromPincode", "toPincode", "weight", "mode");

-- CreateIndex
CREATE INDEX "ShippingEvent_orderId_idx" ON "ShippingEvent"("orderId");

-- CreateIndex
CREATE INDEX "ShippingEvent_providerId_idx" ON "ShippingEvent"("providerId");

-- CreateIndex
CREATE INDEX "ShippingEvent_eventType_idx" ON "ShippingEvent"("eventType");

-- CreateIndex
CREATE INDEX "ShippingEvent_status_idx" ON "ShippingEvent"("status");

-- CreateIndex
CREATE INDEX "ShippingEvent_createdAt_idx" ON "ShippingEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Order_shippingProviderId_idx" ON "Order"("shippingProviderId");

-- CreateIndex
CREATE INDEX "Order_trackingNumber_idx" ON "Order"("trackingNumber");

-- CreateIndex
CREATE INDEX "Order_shipmentStatus_idx" ON "Order"("shipmentStatus");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingProviderId_fkey" FOREIGN KEY ("shippingProviderId") REFERENCES "ShippingProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRateCache" ADD CONSTRAINT "ShippingRateCache_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ShippingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingEvent" ADD CONSTRAINT "ShippingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingEvent" ADD CONSTRAINT "ShippingEvent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ShippingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
