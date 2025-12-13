import type { CartItem, CartTotals } from "./cart";

export type OrderStatus = "processing" | "packed" | "shipped" | "delivered";

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
}

export interface OrderRepository {
  list(): Promise<Order[]>;
  findById(id: string): Promise<Order | undefined>;
  createFromCart(input: {
    items: CartItem[];
    totals: CartTotals;
    address: OrderAddress;
    notes?: string;
  }): Promise<Order>;
}


