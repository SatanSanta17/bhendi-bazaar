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
  shippingFromPincode: string;
  seller: {
    id: string;
    name: string;
    code: string;
    defaultPincode: string;
    defaultCity: string;
    defaultState: string;
    defaultAddress: string;
  };
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
