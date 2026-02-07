/*
  Warnings:

  - Added the required column `sellerId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Seller" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "contactPerson" TEXT,
  "defaultPincode" TEXT NOT NULL,
  "defaultCity" TEXT NOT NULL,
  "defaultState" TEXT NOT NULL,
  "defaultAddress" TEXT,
  "businessName" TEXT,
  "gstNumber" TEXT,
  "panNumber" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "bankAccountNumber" TEXT,
  "bankIfscCode" TEXT,
  "bankAccountName" TEXT,
  "commissionRate" DOUBLE PRECISION,
  "description" TEXT,
  "logoUrl" TEXT,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seller_code_key" ON "Seller"("code");
CREATE UNIQUE INDEX "Seller_email_key" ON "Seller"("email");
CREATE UNIQUE INDEX "Seller_gstNumber_key" ON "Seller"("gstNumber");
CREATE INDEX "Seller_email_idx" ON "Seller"("email");
CREATE INDEX "Seller_isActive_idx" ON "Seller"("isActive");
CREATE INDEX "Seller_code_idx" ON "Seller"("code");
CREATE INDEX "Seller_defaultPincode_idx" ON "Seller"("defaultPincode");

-- ⭐ Create a default seller FIRST
INSERT INTO "Seller" ("id", "code", "name", "email", "defaultPincode", "defaultCity", "defaultState", "isActive", "isVerified", "createdAt", "updatedAt", "joinedAt")
VALUES (
  gen_random_uuid(), 
  'SEL-001', 
  'Bhendi-Bazaar.com', 
  'burhanuddinchital25151@gmail.com', 
  '560083',
  'Bangalore', 
  'Karnataka', 
  true, 
  true, 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ⭐ Add sellerId column as NULLABLE first
ALTER TABLE "Product" ADD COLUMN "sellerId" TEXT;

-- ⭐ Update all existing products to use the default seller
UPDATE "Product" 
SET "sellerId" = (SELECT "id" FROM "Seller" WHERE "code" = 'SEL-001' LIMIT 1)
WHERE "sellerId" IS NULL;

-- ⭐ NOW make it required (NOT NULL)
ALTER TABLE "Product" ALTER COLUMN "sellerId" SET NOT NULL;

-- Add shipping override fields (these are optional, so no issue)
ALTER TABLE "Product" ADD COLUMN "shippingFromPincode" TEXT;
ALTER TABLE "Product" ADD COLUMN "shippingFromCity" TEXT;
ALTER TABLE "Product" ADD COLUMN "shippingFromLocation" TEXT;

-- Add foreign key constraint
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" 
  FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");
CREATE INDEX "Product_shippingFromPincode_idx" ON "Product"("shippingFromPincode");