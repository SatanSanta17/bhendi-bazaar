/**
 * Mock Data Factories
 * 
 * Factory functions to create mock data for testing
 */

import type { Product } from '@/domain/product';
import type { CartItem } from '@/domain/cart';
import type { ServerOrder, OrderAddress, OrderItem } from '@/server/domain/order';
import type { AuthUser } from '@/lib/auth';

/**
 * Create a mock product with default values
 */
export const createMockProduct = (overrides?: Partial<Product>): Product => ({
  id: 'product-1',
  slug: 'test-product',
  name: 'Test Product',
  description: 'Test product description',
  price: 100,
  salePrice: 80,
  currency: 'INR',
  categorySlug: 'test-category',
  tags: ['test'],
  isFeatured: false,
  isHero: false,
  isOnOffer: false,
  rating: 4.5,
  reviewsCount: 10,
  images: ['https://example.com/image.jpg'],
  thumbnail: 'https://example.com/thumb.jpg',
  options: {
    sizes: ['M', 'L', 'XL'],
    colors: ['Red', 'Blue'],
  },
  stock: 10,
  lowStockThreshold: 5,
  ...overrides,
});

/**
 * Create a mock cart item
 */
export const createMockCartItem = (overrides?: Partial<CartItem>): CartItem => ({
  id: `cart-item-${Date.now()}-${Math.random()}`,
  productId: 'product-1',
  name: 'Test Product',
  thumbnail: 'https://example.com/thumb.jpg',
  price: 100,
  salePrice: 80,
  quantity: 1,
  size: 'M',
  color: 'Red',
  ...overrides,
});

/**
 * Create mock order address
 */
export const createMockOrderAddress = (overrides?: Partial<OrderAddress>): OrderAddress => ({
  fullName: 'John Doe',
  phone: '9876543210',
  email: 'john@example.com',
  line1: '123 Test Street',
  line2: 'Apt 4B',
  city: 'Mumbai',
  state: 'Maharashtra',
  postalCode: '400001',
  country: 'India',
  ...overrides,
});

/**
 * Create mock order item
 */
export const createMockOrderItem = (overrides?: Partial<OrderItem>): OrderItem => ({
  productId: 'product-1',
  name: 'Test Product',
  thumbnail: 'https://example.com/thumb.jpg',
  price: 100,
  salePrice: 80,
  quantity: 1,
  ...overrides,
});

/**
 * Create mock order
 */
export const createMockOrder = (overrides?: Partial<ServerOrder>): ServerOrder => ({
  id: 'order-1',
  code: 'BB-1001',
  userId: 'user-1',
  items: [createMockOrderItem()],
  totals: {
    subtotal: 100,
    discount: 20,
    total: 80,
  },
  status: 'processing',
  address: createMockOrderAddress(),
  notes: 'Test note',
  placedAt: '2024-01-01T00:00:00.000Z',
  estimatedDelivery: '2024-01-05T00:00:00.000Z',
  paymentMethod: 'razorpay',
  paymentStatus: 'pending',
  ...overrides,
});

/**
 * Create mock authenticated user
 */
export const createMockUser = (overrides?: Partial<AuthUser>): AuthUser => ({
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  ...overrides,
});

/**
 * Create mock session
 */
export const createMockSession = (user?: Partial<AuthUser>) => ({
  user: createMockUser(user),
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

/**
 * Create multiple mock products
 */
export const createMockProducts = (count: number, overridesFn?: (index: number) => Partial<Product>): Product[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockProduct(overridesFn ? overridesFn(i) : { id: `product-${i + 1}` })
  );
};

/**
 * Create multiple mock cart items
 */
export const createMockCartItems = (count: number, overridesFn?: (index: number) => Partial<CartItem>): CartItem[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockCartItem(overridesFn ? overridesFn(i) : { id: `item-${i + 1}`, productId: `product-${i + 1}` })
  );
};

