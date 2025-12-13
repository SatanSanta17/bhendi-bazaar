export interface Category {
  slug: string;
  name: string;
  description: string;
  heroImage: string;
  accentColorClass: string;
  order: number;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | undefined>;
}


