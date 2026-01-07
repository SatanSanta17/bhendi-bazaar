import { z } from 'zod';
import { uuidSchema, priceSchema, quantitySchema, nameSchema, emailSchema, phoneSchema, postalCodeSchema } from './common.schemas';

// Order-specific address schema (requires fullName and state)
const orderAddressSchema = z.object({
  fullName: nameSchema,
  mobile: phoneSchema,
  email: emailSchema.optional(),
  addressLine1: z
    .string()
    .min(5, "Address line 1 too short")
    .max(500, "Address line 1 too long"),
  addressLine2: z.string().max(500, "Address line 2 too long").optional(),
  city: z.string().min(2, "City too short").max(100, "City too long"),
  state: z.string().min(2, "State too short").max(100, "State too long"),
  pincode: postalCodeSchema,
  country: z.string().default("India"),
});

// Cart item schema - matches client-side CartItem type
const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string().min(1),
  productName: z.string().min(1).max(255),
  productSlug: z.string().min(1).max(255),
  thumbnail: z.string().url().max(2048),
  price: priceSchema,
  salePrice: priceSchema.optional(),
  quantity: quantitySchema,
  size: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
});

// Shipping method schema
const shippingMethodSchema = z.object({
  providerId: z.string(),
  courierName: z.string(),
  shippingCost: z.number().min(0),
  estimatedDays: z.number().int().min(0),
  mode: z.string(),
  packageWeight: z.number().min(0).optional(),
}).optional();

// Order totals schema
const orderTotalsSchema = z.object({
  subtotal: priceSchema,
  discount: z.number().min(0).max(1000000),
  shipping: z.number().min(0).optional(),
  total: priceSchema,
});

// Create order schema
export const createOrderSchema = z
  .object({
    items: z
      .array(cartItemSchema)
      .min(1, "Order must contain at least one item")
      .max(100, "Order cannot contain more than 100 items"),
    totals: orderTotalsSchema,
    address: orderAddressSchema,
    shipping: shippingMethodSchema,
    notes: z.string().max(1000, "Notes too long").optional(),
    paymentMethod: z.enum(["razorpay"]).optional(),
    paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
    userId: uuidSchema.optional(),
  })
  .refine(
    (data) => {
      // Validate totals match items + shipping
      const calculatedSubtotal = data.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const shippingCost = data.totals.shipping || 0;
      const expectedTotal =
        calculatedSubtotal - data.totals.discount + shippingCost;
      return Math.abs(expectedTotal - data.totals.total) < 0.01;
    },
    { message: "Order totals do not match items", path: ["totals"] }
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Order lookup schema
export const orderLookupSchema = z.object({
  code: z.string().regex(/^BB-\d+/, 'Invalid order code format'),
});

export type OrderLookupInput = z.infer<typeof orderLookupSchema>;

// Update order schema
export const updateOrderSchema = z.object({
  status: z.enum(['processing', 'packed', 'shipped', 'delivered']).optional(),
  paymentMethod: z.enum(['razorpay']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional(),
  paymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

