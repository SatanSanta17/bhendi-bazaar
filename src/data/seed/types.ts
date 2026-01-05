/**
 * Type definitions for seed data
 */

export interface SeedUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Will be hashed in seed script
  passwordPlain: string; // For reference only
  role: "USER" | "ADMIN";
  mobile: string;
  isEmailVerified: boolean;
  profile: {
    addresses: SeedAddress[];
    profilePic: string | null;
  };
}

export interface SeedAddress {
  id: string;
  label: string;
  fullName: string;
  mobile: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface SeedCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  heroImage: string;
  accentColorClass: string;
  order: number;
}

export interface SeedProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  currency: "INR";
  categoryId: string;
  tags: string[];
  flags: string[];
  rating: number;
  reviewsCount: number;
  images: string[];
  thumbnail: string;
  sizes: string[];
  colors: string[];
  stock: number;
  sku?: string;
  lowStockThreshold: number;
}

export interface SeedOrder {
  id: string;
  code: string;
  userId: string | null;
  items: OrderItem[];
  totals: {
    subtotal: number;
    discount: number;
    total: number;
  };
  status: "processing" | "packed" | "shipped" | "delivered";
  address: SeedAddress;
  notes?: string;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed";
  paymentId?: string;
  estimatedDelivery?: Date;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  price: number;
  thumbnail: string;
}

export interface SeedReview {
  id: string;
  productId: string;
  userId: string | null;
  rating: number;
  title: string;
  comment: string;
  userName: string;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: Date;
}

export interface SeedCart {
  id: string;
  userId: string;
  items: OrderItem[];
  updatedAt: Date;
}

