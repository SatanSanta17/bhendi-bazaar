// src/components/checkout/checkoutContainer/types.ts

export interface CheckoutItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  price: number;
  salePrice?: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface DeliveryAddress {
  fullName: string;
  mobile: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  notes?: string;
}
