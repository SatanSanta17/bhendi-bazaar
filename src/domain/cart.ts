import type { ProductId } from "./product";

export interface CartItem {
  id: string;
  productId: ProductId;
  name: string;
  thumbnail: string;
  price: number;
  salePrice?: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  total: number;
}

export interface CartState {
  items: CartItem[];
}

export interface CartRepository {
  load(): Promise<CartState>;
  save(state: CartState): Promise<void>;
}


