export type ProductId = string;
export type CategorySlug = string;

export interface Product {
  id: ProductId;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  currency: "INR";
  categorySlug: CategorySlug;
  tags: string[];
  isFeatured?: boolean;
  isHero?: boolean;
  isOnOffer?: boolean;
  rating: number;
  reviewsCount: number;
  images: string[];
  thumbnail: string;
  options?: {
    sizes?: string[];
    colors?: string[];
  };
}

export interface ProductFilter {
  categorySlug?: CategorySlug;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  offerOnly?: boolean;
  featuredOnly?: boolean;
}

export interface ProductRepository {
  list(filter?: ProductFilter): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | undefined>;
  findSimilar(slug: string, limit?: number): Promise<Product[]>;
  heroProducts(): Promise<Product[]>;
  offerProducts(): Promise<Product[]>;
}


