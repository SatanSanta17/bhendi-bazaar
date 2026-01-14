/**
 * Prisma Database Seed Script
 *
 * This script populates the database with realistic seed data for:
 * - Users (with profiles and addresses)
 * - Categories
 * - Products
 * - Orders
 * - Reviews
 * - Abandoned Carts
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import {
  seedUsers,
  seedCategories,
  seedProducts,
  seedOrders,
  seedReviews,
  seedCarts,
  seedShippingProviders,
} from "./seed/index";

// Use the same adapter configuration as the main app
const pool = new Pool({
  connectionString: process.env.BHENDI_BAZAAR_DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data (in correct order to respect foreign keys)
  console.log("🗑️  Clearing existing data...");
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Existing data cleared\n");

  // ====================
  // SEED USERS
  // ====================
  console.log("👥 Seeding users and profiles...");
  for (const userData of seedUsers) {
    // Hash the password
    const hashedPassword = await hash(userData.passwordPlain, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        passwordHash: hashedPassword,
        role: userData.role,
        mobile: userData.mobile,
        isEmailVerified: userData.isEmailVerified,
        profile: {
          create: {
            addresses: userData.profile.addresses as any,
            profilePic: userData.profile.profilePic,
          },
        },
      },
    });

    console.log(`  ✓ ${user.name} (${user.role}) - ${user.email}`);
  }
  console.log(`✅ ${seedUsers.length} users seeded\n`);

  // ====================
  // SEED CATEGORIES
  // ====================
  console.log("📦 Seeding categories...");
  for (const categoryData of seedCategories) {
    const category = await prisma.category.create({
      data: {
        id: categoryData.id,
        slug: categoryData.slug,
        name: categoryData.name,
        description: categoryData.description,
        heroImage: categoryData.heroImage,
        accentColorClass: categoryData.accentColorClass,
        order: categoryData.order,
      },
    });
    console.log(`  ✓ ${category.name}`);
  }
  console.log(`✅ ${seedCategories.length} categories seeded\n`);

  // ====================
  // SEED PRODUCTS
  // ====================
  console.log("🛍️  Seeding products...");
  for (const productData of seedProducts) {
    const product = await prisma.product.create({
      data: {
        id: productData.id,
        slug: productData.slug,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        salePrice: productData.salePrice || null,
        currency: productData.currency,
        categoryId: productData.categoryId,
        tags: productData.tags,
        flags: productData.flags,
        rating: productData.rating,
        reviewsCount: productData.reviewsCount,
        images: productData.images,
        thumbnail: productData.thumbnail,
        sizes: productData.sizes,
        colors: productData.colors,
        stock: productData.stock,
        sku: productData.sku,
        lowStockThreshold: productData.lowStockThreshold,
      },
    });
    console.log(`  ✓ ${product.name} (Stock: ${product.stock})`);
  }
  console.log(`✅ ${seedProducts.length} products seeded\n`);

  // ====================
  // SEED ORDERS
  // ====================
  console.log("📦 Seeding orders...");
  for (const orderData of seedOrders) {
    const order = await prisma.order.create({
      data: {
        id: orderData.id,
        code: orderData.code,
        userId: orderData.userId,
        items: orderData.items as any,
        totals: orderData.totals,
        status: orderData.status,
        address: orderData.address as any,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
        paymentId: orderData.paymentId,
        estimatedDelivery: orderData.estimatedDelivery,
        createdAt: orderData.createdAt,
      },
    });
    console.log(
      `  ✓ ${order.code} - ${order.status} (${
        orderData.userId ? "User" : "Guest"
      })`
    );
  }
  console.log(`✅ ${seedOrders.length} orders seeded\n`);

  // ====================
  // SEED REVIEWS
  // ====================
  console.log("⭐ Seeding reviews...");
  for (const reviewData of seedReviews) {
    const review = await prisma.review.create({
      data: {
        id: reviewData.id,
        productId: reviewData.productId,
        userId: reviewData.userId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        userName: reviewData.userName,
        isVerified: reviewData.isVerified,
        isApproved: reviewData.isApproved,
        createdAt: reviewData.createdAt,
      },
    });
    console.log(
      `  ✓ ${review.userName} - ${review.rating}⭐ on product ${reviewData.productId}`
    );
  }
  console.log(`✅ ${seedReviews.length} reviews seeded\n`);

  // ====================
  // UPDATE PRODUCT RATINGS
  // ====================
  console.log("📊 Calculating product ratings...");
  for (const product of seedProducts) {
    const reviews = seedReviews.filter((r) => r.productId === product.id);
    if (reviews.length > 0) {
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await prisma.product.update({
        where: { id: product.id },
        data: {
          rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
          reviewsCount: reviews.length,
        },
      });
      console.log(
        `  ✓ ${product.name} - ${avgRating.toFixed(1)}⭐ (${
          reviews.length
        } reviews)`
      );
    }
  }
  console.log("✅ Product ratings updated\n");

  // ====================
  // SEED ABANDONED CARTS
  // ====================
  console.log("🛒 Seeding abandoned carts...");
  for (const cartData of seedCarts) {
    const cart = await prisma.cart.create({
      data: {
        id: cartData.id,
        userId: cartData.userId,
        items: cartData.items as any,
        updatedAt: cartData.updatedAt,
      },
    });
    console.log(
      `  ✓ Cart for user ${cartData.userId} - ${
        cartData.items.length
      } items (${Math.floor(
        (Date.now() - cartData.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      )} days old)`
    );
  }
  console.log(`✅ ${seedCarts.length} abandoned carts seeded\n`);

  // ====================
  // SEED SHIPPING PROVIDERS
  // ====================
  console.log("🚚 Seeding shipping providers...");
  for (const shippingProviderData of seedShippingProviders) {
    const shippingProvider = await prisma.shippingProvider.create({
      data: shippingProviderData as any,
    });
    console.log(`  ✓ ${shippingProvider.name}`);
  }
  console.log(`✅ ${seedShippingProviders.length} shipping providers seeded\n`);

  // ====================
  // SUMMARY
  // ====================
  console.log("🎉 Database seed completed successfully!\n");
  console.log("📊 Summary:");
  console.log(
    `   • ${seedUsers.length} users (${
      seedUsers.filter((u) => u.role === "ADMIN").length
    } admins, ${
      seedUsers.filter((u) => u.role === "USER").length
    } regular users)`
  );
  console.log(`   • ${seedCategories.length} categories`);
  console.log(`   • ${seedProducts.length} products`);
  console.log(
    `   • ${seedOrders.length} orders (${
      seedOrders.filter((o) => o.userId === null).length
    } guest orders)`
  );
  console.log(
    `   • ${seedReviews.length} reviews (${
      seedReviews.filter((r) => r.isVerified).length
    } verified)`
  );
  console.log(`   • ${seedCarts.length} abandoned carts`);
  console.log("\n💡 Next steps:");
  console.log("   1. Upload product/category images to Vercel Blob");
  console.log("   2. Update image URLs in seed data files");
  console.log("   3. Re-run seed to update with real image URLs");
  console.log("\n📝 Default credentials:");
  console.log("   Admin: admin@bhendibazaar.com / Admin@123");
  console.log("   Manager: manager@bhendibazaar.com / Admin@123");
  console.log("   Users: [email from seed] / Test@123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
