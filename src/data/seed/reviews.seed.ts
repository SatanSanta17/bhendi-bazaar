/**
 * Seed data for Reviews
 * Reviews should be created after orders are delivered (for verified reviews)
 */

import type { SeedReview } from "./types";

// Helper to create dates in the past
const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

export const seedReviews: SeedReview[] = [
  // Reviews for prod-1: Emerald Satin Abaya (5 reviews, avg ~4.5)
  {
    id: "review-1",
    productId: "prod-1",
    userId: "user-1",
    rating: 5,
    title: "Absolutely stunning abaya!",
    comment:
      "The quality of the satin is exceptional and the emerald color is even more beautiful in person. Received many compliments at my cousin's wedding. The fit is perfect and it drapes elegantly. Highly recommend!",
    userName: "Fatima Khan",
    isVerified: true, // From order-1
    isApproved: true,
    createdAt: daysAgo(50),
  },
  {
    id: "review-2",
    productId: "prod-1",
    userId: "user-2",
    rating: 5,
    title: "Best purchase ever",
    comment:
      "Worth every penny! The fabric is so soft and comfortable. I wore it for an entire evening event and didn't feel uncomfortable at all. The Kutchhi belt detailing is authentic and adds a nice touch.",
    userName: "Ayesha Patel",
    isVerified: true, // From order-10
    isApproved: true,
    createdAt: daysAgo(8),
  },
  {
    id: "review-3",
    productId: "prod-1",
    userId: null,
    rating: 4,
    title: "Beautiful but runs slightly small",
    comment:
      "Gorgeous abaya with amazing color. However, I found it runs a bit small. I ordered M but should have gone for L. Otherwise, quality is excellent!",
    userName: "Zainab S.",
    isVerified: false,
    isApproved: true,
    createdAt: daysAgo(42),
  },
  {
    id: "review-4",
    productId: "prod-1",
    userId: null,
    rating: 5,
    title: "Premium quality",
    comment: "The satin feels luxurious and the stitching is perfect. Very happy with my purchase.",
    userName: "Noor Ahmed",
    isVerified: false,
    isApproved: true,
    createdAt: daysAgo(35),
  },
  {
    id: "review-5",
    productId: "prod-1",
    userId: null,
    rating: 4,
    title: "Good value for money",
    comment: "Nice abaya for the price, especially with the discount. Color is vibrant and fabric quality is good.",
    userName: "Amina K.",
    isVerified: false,
    isApproved: true,
    createdAt: daysAgo(28),
  },

  // Reviews for prod-2: Classic Black Jilbab (3 reviews, avg ~4.3)
  {
    id: "review-6",
    productId: "prod-2",
    userId: "user-2",
    rating: 5,
    title: "Perfect everyday jilbab",
    comment:
      "This has become my go-to daily wear. The fabric is breathable even in Mumbai heat. Washes well and doesn't lose shape. Bought 2 pieces!",
    userName: "Ayesha Patel",
    isVerified: true, // From order-6
    isApproved: true,
    createdAt: daysAgo(20),
  },
  {
    id: "review-7",
    productId: "prod-2",
    userId: "user-1",
    rating: 4,
    title: "Great quality, simple design",
    comment: "Comfortable and well-made. Perfect for daily prayers and errands. Classic design that never goes out of style.",
    userName: "Fatima Khan",
    isVerified: true, // From order-13
    isApproved: true,
    createdAt: daysAgo(1),
  },
  {
    id: "review-8",
    productId: "prod-2",
    userId: null,
    rating: 4,
    title: "Good basic jilbab",
    comment: "Simple and functional. Fabric is nice but wish it came in more sizes.",
    userName: "Rabia M.",
    isVerified: false,
    isApproved: true,
    createdAt: daysAgo(32),
  },

  // Reviews for prod-3: Embroidered Maroon Abaya (2 reviews, avg ~4.5)
  {
    id: "review-9",
    productId: "prod-3",
    userId: "user-3",
    rating: 5,
    title: "Exquisite embroidery work!",
    comment:
      "The gold embroidery is stunning! Perfect for my sister's wedding. The quality is outstanding and it photographs beautifully. Worth the investment for special occasions.",
    userName: "Mariam Syed",
    isVerified: true, // From order-4
    isApproved: true,
    createdAt: daysAgo(25),
  },
  {
    id: "review-10",
    productId: "prod-3",
    userId: null,
    rating: 4,
    title: "Beautiful piece",
    comment: "Love the embroidery! Very elegant. Only giving 4 stars because it's quite heavy to wear for long hours.",
    userName: "Laila Khan",
    isVerified: false,
    isApproved: true,
    createdAt: daysAgo(38),
  },

  // Reviews for prod-4: Royal Oud Attar (4 reviews, avg ~4.75)
  {
    id: "review-11",
    productId: "prod-4",
    userId: "user-2",
    rating: 5,
    title: "Best oud I've ever used",
    comment:
      "This attar is absolutely divine! The scent is rich, authentic, and lasts all day. Much better than synthetic perfumes. Will definitely repurchase.",
    userName: "Ayesha Patel",
    isVerified: true, // From order-2
    isApproved: true,
    createdAt: daysAgo(43),
  },
  {
    id: "review-12",
    productId: "prod-4",
    userId: "user-1",
    rating: 5,
    title: "Amazing fragrance",
    comment: "Perfect blend! Not too strong but definitely noticeable. My husband loves it. Great for special occasions.",
    userName: "Fatima Khan",
    isVerified: true, // From order-9
    isApproved: true,
    createdAt: daysAgo(10),
  },
  {
    id: "review-13",
    productId: "prod-4",
    userId: null,
    rating: 5,
    title: "Authentic quality",
    comment: "Real deal! You can tell this is quality oud. Long-lasting and sophisticated scent.",
    userName: "Ibrahim A.",
    isVerified: false,
    isApproved: true,
    createdAt: daysAgo(36),
  },
  {
    id: "review-14",
    productId: "prod-4",
    userId: null,
    rating: 4,
    title: "Good but pricey",
    comment: "Great attar but a bit expensive. Quality is there though, so I guess it's worth it.",
    userName: "Tariq S.",
    isVerified: false,
    isApproved: true,
    createdAt: daysAgo(29),
  },

  // Reviews for prod-6: Sandalwood Amber Attar (2 reviews, avg ~4.5)
  {
    id: "review-15",
    productId: "prod-6",
    userId: null,
    rating: 5,
    title: "Warm and inviting",
    comment: "Love the sandalwood base! Perfect for evening wear. Not overpowering but leaves a lasting impression.",
    userName: "Hassan Q.",
    isVerified: true, // Guest from order-7
    isApproved: true,
    createdAt: daysAgo(21),
  },
  {
    id: "review-16",
    productId: "prod-6",
    userId: "user-1",
    rating: 4,
    title: "Nice blend",
    comment: "Good combination of sandalwood and amber. Wished the scent lasted a bit longer though.",
    userName: "Fatima Khan",
    isVerified: true, // From order-9
    isApproved: true,
    createdAt: daysAgo(11),
  },

  // Reviews for prod-7: Gold Filigree Earrings (3 reviews, avg ~4.7)
  {
    id: "review-17",
    productId: "prod-7",
    userId: "user-1",
    rating: 5,
    title: "Gorgeous earrings!",
    comment:
      "These are so beautiful! The filigree work is intricate and they're surprisingly lightweight. Perfect for my friend's wedding reception. Got so many compliments!",
    userName: "Fatima Khan",
    isVerified: true, // From order-1
    isApproved: true,
    createdAt: daysAgo(51),
  },
  {
    id: "review-18",
    productId: "prod-7",
    userId: "user-3",
    rating: 5,
    title: "Beautiful craftsmanship",
    comment: "Bought these for Eid and they're perfect! Lightweight despite the detailed design. Will buy more colors.",
    userName: "Mariam Syed",
    isVerified: true, // From order-11
    isApproved: true,
    createdAt: daysAgo(6),
  },
  {
    id: "review-19",
    productId: "prod-7",
    userId: null,
    rating: 4,
    title: "Pretty earrings",
    comment: "Nice design and lightweight. Gold plating seems good quality. Happy with purchase.",
    userName: "Safiya R.",
    isVerified: false,
    isApproved: true,
    createdAt: daysAgo(40),
  },

  // Reviews for prod-10: Velvet Prayer Mat (3 reviews, avg ~4.7)
  {
    id: "review-20",
    productId: "prod-10",
    userId: null,
    rating: 5,
    title: "Excellent prayer mat",
    comment:
      "Very comfortable cushioning! Makes long prayers much easier on the knees. The velvet is soft and the carry bag is handy for travel. Highly recommend!",
    userName: "Zara Ibrahim",
    isVerified: true, // Guest from order-3
    isApproved: true,
    createdAt: daysAgo(40),
  },
  {
    id: "review-21",
    productId: "prod-10",
    userId: "user-3",
    rating: 5,
    title: "Perfect for daily prayers",
    comment: "Great quality and very comfortable. The Kaaba design is beautiful. Worth the price!",
    userName: "Mariam Syed",
    isVerified: true, // From order-8
    isApproved: true,
    createdAt: daysAgo(23),
  },
  {
    id: "review-22",
    productId: "prod-10",
    userId: "user-1",
    rating: 4,
    title: "Good mat",
    comment: "Comfortable and well-made. Would prefer if it came in more colors though.",
    userName: "Fatima Khan",
    isVerified: true, // From order-13
    isApproved: true,
    createdAt: daysAgo(2),
  },
];

