import { z } from 'zod';
import { uuidSchema, priceSchema, quantitySchema } from './common.schemas';

// Cart item schema - matches client-side CartItem type
const cartItemSchema = z.object({
  id: z.string(),
  productId: uuidSchema,
  name: z.string().min(1).max(255),
  thumbnail: z.string().url().max(2048),
  price: priceSchema,
  salePrice: priceSchema.optional(),
  quantity: quantitySchema,
  size: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
});

// Update cart schema
export const updateCartSchema = z.object({
  items: z
    .array(cartItemSchema)
    .max(100, 'Cart cannot contain more than 100 items'),
});

export type UpdateCartInput = z.infer<typeof updateCartSchema>;

// Stock check schema
export const stockCheckSchema = z.object({
  items: z.array(
    z.object({
      productId: uuidSchema,
      quantity: quantitySchema,
    })
  ).min(1, 'At least one item required').max(100),
});

export type StockCheckInput = z.infer<typeof stockCheckSchema>;

