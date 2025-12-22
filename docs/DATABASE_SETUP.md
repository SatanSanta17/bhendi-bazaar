# Database Setup Guide

## Overview

This guide walks you through setting up the PostgreSQL database for Bhendi Bazaar, including running migrations and seeding initial data.

## Database Schema

The Bhendi Bazaar database includes the following models:

### Core E-commerce Models
- **Category** - Product categories with hero images and styling
- **Product** - Products with pricing, inventory, and media
- **Review** - Product reviews and ratings
- **Order** - Customer orders with items and payment info
- **Cart** - User shopping carts

### User & Auth Models
- **User** - User accounts (supports both OAuth and credentials)
- **Profile** - User profile data and addresses
- **Account** - OAuth provider accounts (NextAuth.js)
- **Session** - User sessions (NextAuth.js)
- **VerificationToken** - Email verification tokens (NextAuth.js)

## Prerequisites

1. **PostgreSQL Database**
   - Local: Install PostgreSQL 14+ or use Docker
   - Cloud: Use services like Neon, Supabase, or Railway

2. **Database URL**
   - Set `DATABASE_URL` in your `.env` file

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bhendi_bazaar"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Razorpay Payment Gateway
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
```

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This will automatically run `prisma generate` via the `postinstall` script.

### 2. Create Migration

Create a new migration from your schema:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the migration files in `prisma/migrations/`
- Apply the migration to your database
- Generate the Prisma Client

### 3. Seed the Database

Populate the database with initial categories and products:

```bash
npx prisma db seed
```

This will:
- Clear existing data (if any)
- Create all categories from `src/data/categories.ts`
- Create all products from `src/data/products.ts`
- Add sample reviews

Expected output:
```
🌱 Starting database seed...

🗑️  Clearing existing data...
✅ Existing data cleared

📦 Seeding categories...
  ✓ Women's Clothing
  ✓ Men's Clothing
  ✓ Accessories
  ✓ Home & Lifestyle
✅ 4 categories seeded

🛍️  Seeding products...
  ✓ Velvet Embroidered Kurta
  ✓ Silk Palazzo Pants
  ... (more products)
✅ 20 products seeded

⭐ Seeding sample reviews...
✅ 4 reviews seeded

🎉 Database seed completed successfully!
```

### 4. Verify Setup

Open Prisma Studio to browse your data:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit your data.

## Database Schema Details

### Category Model

```prisma
model Category {
  id               String    @id @default(cuid())
  slug             String    @unique
  name             String
  description      String    @db.Text
  heroImage        String
  accentColorClass String
  order            Int       @default(0)
  products         Product[]
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

**Indexes:**
- `slug` (unique) - Fast category lookup by URL
- `order` - Sorting categories

### Product Model

```prisma
model Product {
  id           String   @id @default(cuid())
  slug         String   @unique
  name         String
  description  String   @db.Text
  price        Float
  salePrice    Float?
  currency     String   @default("INR")
  categoryId   String
  category     Category @relation(...)
  tags         String[]
  isFeatured   Boolean  @default(false)
  isHero       Boolean  @default(false)
  isOnOffer    Boolean  @default(false)
  rating       Float    @default(0)
  reviewsCount Int      @default(0)
  images       String[]
  thumbnail    String
  sizes        String[]
  colors       String[]
  stock        Int      @default(0)
  reviews      Review[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Indexes:**
- `slug` (unique) - Fast product lookup by URL
- `categoryId` - Products by category
- `isFeatured`, `isHero`, `isOnOffer` - Featured product queries
- `createdAt` - Newest products

**Features:**
- Multiple images per product
- Optional sale pricing
- Tagging system
- Stock management
- Featured/hero product flags

### Review Model

```prisma
model Review {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(...)
  userId     String?
  user       User?    @relation(...)
  rating     Int      // 1-5
  title      String?
  comment    String?  @db.Text
  userName   String
  isVerified Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

**Indexes:**
- `productId` - Reviews by product
- `userId` - Reviews by user
- `rating` - Filter by rating
- `createdAt` - Newest reviews

**Features:**
- Verified purchase indicator
- Stores userName to preserve history if user deleted
- Optional userId (supports guest reviews)

### Order Model

```prisma
model Order {
  id                String    @id @default(cuid())
  code              String    @unique // BB-1001
  userId            String?   // null for guest orders
  user              User?     @relation(...)
  items             Json      // CartItem[]
  totals            Json      // CartTotals
  status            String    @default("processing")
  address           Json      // OrderAddress
  notes             String?   @db.Text
  paymentMethod     String?
  paymentStatus     String?   @default("pending")
  paymentId         String?
  estimatedDelivery DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

**Indexes:**
- `code` (unique) - Guest order lookup
- `userId` - User orders
- `createdAt` - Recent orders

**Features:**
- Guest order support (userId can be null)
- Unique order codes (BB-XXXX)
- JSON storage for flexibility (items, totals, address)
- Payment integration (Razorpay)
- Order status tracking

### Cart Model

```prisma
model Cart {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(...)
  items     Json     // CartItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Features:**
- One cart per user
- JSON storage for cart items
- Auto-sync with client-side store

## Common Commands

### Development

```bash
# Start development server
npm run dev

# Open Prisma Studio
npx prisma studio

# Format schema
npx prisma format
```

### Migrations

```bash
# Create and apply migration
npx prisma migrate dev --name description

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Database Operations

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes without migration (dev only)
npx prisma db push

# Seed database
npx prisma db seed

# Pull schema from existing database
npx prisma db pull
```

### Production Deployment

```bash
# 1. Build the application
npm run build

# 2. Apply migrations
npx prisma migrate deploy

# 3. Seed if needed (optional)
npx prisma db seed

# 4. Start production server
npm start
```

## Updating the Schema

When you need to modify the database schema:

1. **Edit `prisma/schema.prisma`**
   ```prisma
   model Product {
     // Add new field
     sku String?
   }
   ```

2. **Create migration**
   ```bash
   npx prisma migrate dev --name add_product_sku
   ```

3. **Update TypeScript types** (if needed)
   - The Prisma Client is auto-generated
   - Update domain types in `src/domain/` and `src/server/domain/`

4. **Update repositories** (if needed)
   - Update queries in `src/server/repositories/`

## Troubleshooting

### Migration Failed

```bash
# Reset and try again
npx prisma migrate reset
npx prisma migrate dev
npx prisma db seed
```

### Connection Issues

- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### Seed Issues

- Check data files exist: `src/data/categories.ts`, `src/data/products.ts`
- Run with verbose logging: `DEBUG=* npx prisma db seed`

### Type Errors After Schema Changes

```bash
# Regenerate Prisma Client
npx prisma generate

# Restart development server
npm run dev
```

## Database Hosting Options

### Local Development (Docker)

```bash
docker run --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bhendi_bazaar \
  -p 5432:5432 \
  -d postgres:14
```

### Cloud Options

1. **Neon** (Recommended for serverless)
   - Free tier available
   - Serverless Postgres
   - Auto-scaling
   - https://neon.tech

2. **Supabase**
   - Free tier with 500MB
   - Includes auth and storage
   - https://supabase.com

3. **Railway**
   - Easy deployment
   - $5/month starter
   - https://railway.app

4. **Vercel Postgres**
   - Integrated with Vercel
   - Serverless
   - https://vercel.com/storage/postgres

## Next Steps

After setting up the database:

1. ✅ Configure environment variables
2. ✅ Run migrations
3. ✅ Seed initial data
4. ✅ Start development server
5. 🔄 Switch repositories from mock to Prisma
6. 🔄 Test all flows (products, cart, checkout, orders)
7. 🔄 Deploy to production

## Switching from Mock to Prisma

Once the database is seeded, update the repositories:

**`src/server/repositories/productRepository.ts`:**
```typescript
// TODO: Implement Prisma queries
async list(filter?: ProductFilter): Promise<ServerProduct[]> {
  const where: any = {};
  
  if (filter?.categorySlug) {
    where.category = { slug: filter.categorySlug };
  }
  
  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
    ];
  }
  
  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    take: filter?.limit,
    skip: filter?.offset,
    orderBy: { createdAt: 'desc' },
  });
  
  return products.map(toServerProduct);
}
```

Repeat for `categoryRepository.ts` and other repositories as needed.

