import { describe, it, expect } from 'vitest';
import {
  signupSchema,
  loginSchema,
  createOrderSchema,
  orderLookupSchema,
  updateOrderSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema,
  updateProfileSchema,
  updateCartSchema,
  stockCheckSchema,
  emailSchema,
  phoneSchema,
  nameSchema,
  priceSchema,
  quantitySchema,
  safeTextSchema,
  urlSchema,
  postalCodeSchema,
} from '../src/lib/validation';

describe('Common Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid email addresses', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject invalid emails', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });

    it('should trim and lowercase emails', () => {
      const result = emailSchema.safeParse('  TEST@EXAMPLE.COM  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should reject emails that are too short', () => {
      const result = emailSchema.safeParse('a@b');
      expect(result.success).toBe(false);
    });
  });

  describe('phoneSchema', () => {
    it('should accept valid Indian phone numbers', () => {
      const result = phoneSchema.safeParse('9876543210');
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      const result = phoneSchema.safeParse('1234567890');
      expect(result.success).toBe(false);
    });

    it('should reject phone numbers with wrong length', () => {
      const result = phoneSchema.safeParse('987654321');
      expect(result.success).toBe(false);
    });
  });

  describe('nameSchema', () => {
    it('should accept valid names', () => {
      const result = nameSchema.safeParse('John Doe');
      expect(result.success).toBe(true);
    });

    it('should reject names with < or >', () => {
      const result = nameSchema.safeParse('John<script>');
      expect(result.success).toBe(false);
    });

    it('should trim whitespace', () => {
      const result = nameSchema.safeParse('  John Doe  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('John Doe');
      }
    });
  });

  describe('priceSchema', () => {
    it('should accept positive numbers', () => {
      const result = priceSchema.safeParse(100.50);
      expect(result.success).toBe(true);
    });

    it('should reject negative numbers', () => {
      const result = priceSchema.safeParse(-10);
      expect(result.success).toBe(false);
    });

    it('should reject infinity', () => {
      const result = priceSchema.safeParse(Infinity);
      expect(result.success).toBe(false);
    });
  });

  describe('quantitySchema', () => {
    it('should accept positive integers', () => {
      const result = quantitySchema.safeParse(5);
      expect(result.success).toBe(true);
    });

    it('should reject decimals', () => {
      const result = quantitySchema.safeParse(5.5);
      expect(result.success).toBe(false);
    });

    it('should reject quantities over 1000', () => {
      const result = quantitySchema.safeParse(1001);
      expect(result.success).toBe(false);
    });
  });

  describe('safeTextSchema', () => {
    it('should accept safe text', () => {
      const result = safeTextSchema.safeParse('This is safe text');
      expect(result.success).toBe(true);
    });

    it('should reject script tags', () => {
      const result = safeTextSchema.safeParse('<script>alert("xss")</script>');
      expect(result.success).toBe(false);
    });

    it('should reject javascript: protocol', () => {
      const result = safeTextSchema.safeParse('javascript:alert("xss")');
      expect(result.success).toBe(false);
    });
  });

  describe('postalCodeSchema', () => {
    it('should accept valid Indian postal codes', () => {
      const result = postalCodeSchema.safeParse('400001');
      expect(result.success).toBe(true);
    });

    it('should reject invalid postal codes', () => {
      const result = postalCodeSchema.safeParse('1234');
      expect(result.success).toBe(false);
    });
  });
});

describe('Auth Validation Schemas', () => {
  describe('signupSchema', () => {
    it('should accept valid signup data', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'John Doe',
        mobile: '9876543210',
      });
      expect(result.success).toBe(true);
    });

    it('should reject weak passwords', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });

    it('should require uppercase letter in password', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'test123!@#',
      });
      expect(result.success).toBe(false);
    });

    it('should require lowercase letter in password', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'TEST123!@#',
      });
      expect(result.success).toBe(false);
    });

    it('should require number in password', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'TestTest!@#',
      });
      expect(result.success).toBe(false);
    });

    it('should require special character in password', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'TestTest123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Order Validation Schemas', () => {
  describe('createOrderSchema', () => {
    it('should accept valid order data', () => {
      const result = createOrderSchema.safeParse({
        items: [
          {
            id: 'item-1',
            productId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test Product',
            thumbnail: 'https://example.com/image.jpg',
            price: 100,
            quantity: 2,
          },
        ],
        totals: {
          subtotal: 200,
          discount: 0,
          total: 200,
        },
        address: {
          fullName: 'John Doe',
          phone: '9876543210',
          line1: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject order with mismatched totals', () => {
      const result = createOrderSchema.safeParse({
        items: [
          {
            id: 'item-1',
            productId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test Product',
            thumbnail: 'https://example.com/image.jpg',
            price: 100,
            quantity: 2,
          },
        ],
        totals: {
          subtotal: 300, // Wrong!
          discount: 0,
          total: 300,
        },
        address: {
          name: 'John Doe',
          phone: '9876543210',
          line1: '123 Main Street',
          city: 'Mumbai',
          postalCode: '400001',
          country: 'India',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty order', () => {
      const result = createOrderSchema.safeParse({
        items: [],
        totals: { subtotal: 0, discount: 0, total: 0 },
        address: {
          fullName: 'John Doe',
          phone: '9876543210',
          line1: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('orderLookupSchema', () => {
    it('should accept valid order codes', () => {
      const result = orderLookupSchema.safeParse({ code: 'BB-1001' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid order codes', () => {
      const result = orderLookupSchema.safeParse({ code: 'INVALID-123' });
      expect(result.success).toBe(false);
    });
  });
});

describe('Payment Validation Schemas', () => {
  describe('createPaymentOrderSchema', () => {
    it('should accept valid payment order data', () => {
      const result = createPaymentOrderSchema.safeParse({
        amount: 10000,
        currency: 'INR',
        localOrderId: '550e8400-e29b-41d4-a716-446655440000',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          contact: '9876543210',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-INR currency', () => {
      const result = createPaymentOrderSchema.safeParse({
        amount: 10000,
        currency: 'USD',
        localOrderId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });

    it('should reject decimal amounts', () => {
      const result = createPaymentOrderSchema.safeParse({
        amount: 100.50,
        currency: 'INR',
        localOrderId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('verifyPaymentSchema', () => {
    it('should accept valid payment verification data', () => {
      const result = verifyPaymentSchema.safeParse({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig_123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing fields', () => {
      const result = verifyPaymentSchema.safeParse({
        razorpay_order_id: 'order_123',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Profile Validation Schemas', () => {
  describe('updateProfileSchema', () => {
    it('should accept valid profile data', () => {
      const result = updateProfileSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        mobile: '9876543210',
        addresses: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            label: 'Home',
            name: 'John Doe',
            phone: '9876543210',
            line1: '123 Main St',
            city: 'Mumbai',
            postalCode: '400001',
            country: 'India',
            isDefault: true,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject multiple default addresses', () => {
      const result = updateProfileSchema.safeParse({
        addresses: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            label: 'Home',
            name: 'John Doe',
            phone: '9876543210',
            line1: '123 Main St',
            city: 'Mumbai',
            postalCode: '400001',
            country: 'India',
            isDefault: true,
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            label: 'Work',
            name: 'John Doe',
            phone: '9876543210',
            line1: '456 Office Ave',
            city: 'Mumbai',
            postalCode: '400002',
            country: 'India',
            isDefault: true,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 10 addresses', () => {
      const addresses = Array.from({ length: 11 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-44665544000${i}`,
        label: `Address ${i}`,
        name: 'John Doe',
        phone: '9876543210',
        line1: '123 Main St',
        city: 'Mumbai',
        postalCode: '400001',
        country: 'India',
        isDefault: i === 0,
      }));

      const result = updateProfileSchema.safeParse({ addresses });
      expect(result.success).toBe(false);
    });
  });
});

describe('Cart Validation Schemas', () => {
  describe('updateCartSchema', () => {
    it('should accept valid cart data', () => {
      const result = updateCartSchema.safeParse({
        items: [
          {
            id: 'item-1',
            productId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test Product',
            thumbnail: 'https://example.com/image.jpg',
            price: 100,
            quantity: 2,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject cart with over 100 items', () => {
      const items = Array.from({ length: 101 }, (_, i) => ({
        id: `item-${i}`,
        productId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Product',
        thumbnail: 'https://example.com/image.jpg',
        price: 100,
        quantity: 1,
      }));

      const result = updateCartSchema.safeParse({ items });
      expect(result.success).toBe(false);
    });
  });

  describe('stockCheckSchema', () => {
    it('should accept valid stock check data', () => {
      const result = stockCheckSchema.safeParse({
        items: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440000',
            quantity: 2,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty items array', () => {
      const result = stockCheckSchema.safeParse({ items: [] });
      expect(result.success).toBe(false);
    });
  });
});

