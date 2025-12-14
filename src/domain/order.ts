import type { CartItem, CartTotals } from "./cart";

export type OrderStatus = "processing" | "packed" | "shipped" | "delivered";

export type PaymentMethod = "razorpay";

export type PaymentStatus = "pending" | "paid" | "failed";

export interface OrderAddress {
  fullName: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  code: string;
  items: CartItem[];
  totals: CartTotals;
  status: OrderStatus;
  address: OrderAddress;
  notes?: string;
  placedAt: string;
  estimatedDelivery?: string;
  /**
   * Basic payment metadata for the mock checkout flow.
   * For a real backend you would persist richer transaction details.
   */
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentId?: string;
}

export interface OrderRepository {
  list(): Promise<Order[]>;
  findById(id: string): Promise<Order | undefined>;
  createFromCart(input: {
    items: CartItem[];
    totals: CartTotals;
    address: OrderAddress;
    notes?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    paymentId?: string;
  }): Promise<Order>;
  update(
    id: string,
    update: Partial<
      Pick<Order, "status" | "paymentMethod" | "paymentStatus" | "paymentId">
    >
  ): Promise<Order | undefined>;
}


