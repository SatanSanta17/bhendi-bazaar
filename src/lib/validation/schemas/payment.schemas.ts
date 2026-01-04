import { z } from 'zod';
import { priceSchema, emailSchema } from './common.schemas';

// Create payment order schema
export const createPaymentOrderSchema = z.object({
  amount: z
    .number()
    .int("Amount must be in paise (smallest currency unit)")
    .positive("Amount must be positive")
    .max(100000000, "Amount exceeds maximum (10 lakh rupees)"),
  currency: z.enum(["INR"], { message: "Only INR currency is supported" }),
  localOrderId: z.string().min(1),
  customer: z
    .object({
      name: z.string().min(1).max(255).optional(),
      email: emailSchema.optional(),
      contact: z
        .string()
        .regex(/^\d{10}$/)
        .optional(),
    })
    .optional(),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

// Verify payment schema
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID required'),
  razorpay_signature: z.string().min(1, 'Signature required'),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

