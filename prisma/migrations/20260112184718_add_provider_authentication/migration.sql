-- AlterTable
ALTER TABLE "ShippingProvider" ADD COLUMN     "accountInfo" JSONB,
ADD COLUMN     "authError" TEXT,
ADD COLUMN     "authToken" TEXT,
ADD COLUMN     "connectedAt" TIMESTAMP(3),
ADD COLUMN     "connectedBy" TEXT,
ADD COLUMN     "isConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastAuthAt" TIMESTAMP(3),
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3),
ALTER COLUMN "config" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ShippingProvider_isConnected_idx" ON "ShippingProvider"("isConnected");
