// src/domain/seller.ts

export interface Seller {
  id: string;
  code: string;
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;

  defaultPincode: string;
  defaultCity: string;
  defaultState: string;
  defaultAddress?: string;

  businessName?: string;
  gstNumber?: string;
  panNumber?: string;

  isActive: boolean;
  isVerified: boolean;

  description?: string;
  logoUrl?: string;

  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSellerInput {
  code: string;
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;

  defaultPincode: string;
  defaultCity: string;
  defaultState: string;
  defaultAddress?: string;

  businessName?: string;
  gstNumber?: string;
  panNumber?: string;

  isActive: boolean;
  description?: string;
}

export interface UpdateSellerInput extends Partial<CreateSellerInput> {
  id: string;
}

export interface SellerWithStats extends Seller {
  productCount: number;
  activeProductCount?: number;
  totalStock: number;
  totalRevenue?: number;
}
