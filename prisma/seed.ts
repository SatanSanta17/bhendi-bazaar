/**
 * Prisma Database Seed Script
 *
 * This script populates the database with initial data for:
 * - Categories
 * - Products
 * - Sample Reviews
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import { categories } from "../src/data/categories";
import { products } from "../src/data/products";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data (in correct order to respect foreign keys)
  console.log("🗑️  Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  console.log("✅ Existing data cleared\n");

  // Seed Categories
  console.log("📦 Seeding categories...");
  const categoryMap = new Map<string, string>(); // slug -> id mapping

  for (const category of categories) {
    const created = await prisma.category.create({
      data: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        heroImage: category.heroImage,
        accentColorClass: category.accentColorClass,
        order: category.order,
      },
    });
    categoryMap.set(category.slug, created.id);
    console.log(`  ✓ ${category.name}`);
  }
  console.log(`✅ ${categories.length} categories seeded\n`);

  // Seed Products
  console.log("🛍️  Seeding products...");
  let productCount = 0;

  for (const product of products) {
    const categoryId = categoryMap.get(product.categorySlug);
    if (!categoryId) {
      console.warn(`  ⚠️  Category not found for product: ${product.name}`);
      continue;
    }

    await prisma.product.create({
      data: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice || null,
        currency: product.currency,
        categoryId: categoryId,
        tags: product.tags,
        isFeatured: product.isFeatured || false,
        isHero: product.isHero || false,
        isOnOffer: product.isOnOffer || false,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
        images: product.images,
        thumbnail: product.thumbnail,
        sizes: product.options?.sizes || [],
        colors: product.options?.colors || [],
        stock: 100, // Default stock
      },
    });
    productCount++;
    console.log(`  ✓ ${product.name}`);
  }
  console.log(`✅ ${productCount} products seeded\n`);

  // Seed Sample Reviews (optional)
  console.log("⭐ Seeding sample reviews...");
  const sampleReviews = [
    {
      productSlug: "velvet-embroidered-kurta",
      rating: 5,
      title: "Absolutely stunning!",
      comment:
        "The embroidery work is exquisite. Perfect for special occasions.",
      userName: "Aisha Khan",
      isVerified: true,
    },
    {
      productSlug: "velvet-embroidered-kurta",
      rating: 4,
      title: "Beautiful but runs small",
      comment: "Gorgeous piece but I'd recommend sizing up.",
      userName: "Fatima Ahmed",
      isVerified: true,
    },
    {
      productSlug: "silk-palazzo-pants",
      rating: 5,
      title: "Super comfortable",
      comment: "Perfect fit and the silk quality is top-notch!",
      userName: "Zainab Ali",
      isVerified: true,
    },
    {
      productSlug: "cotton-printed-dupatta",
      rating: 4,
      title: "Nice colors",
      comment: "The print is vibrant and it's soft to touch.",
      userName: "Mariam Hassan",
      isVerified: false,
    },
  ];

  let reviewCount = 0;
  for (const review of sampleReviews) {
    const product = await prisma.product.findUnique({
      where: { slug: review.productSlug },
    });

    if (product) {
      await prisma.review.create({
        data: {
          productId: product.id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          userName: review.userName,
          isVerified: review.isVerified,
        },
      });
      reviewCount++;
    }
  }
  console.log(`✅ ${reviewCount} reviews seeded\n`);

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

