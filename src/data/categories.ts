import type { Category } from "@/domain/category";

export const categories: Category[] = [
  {
    slug: "abayas",
    name: "Abayas & Jilbabs",
    description:
      "Flowing silhouettes in deep emeralds, maroons, and midnight blacks.",
    heroImage: "/images/categories/abayas-hero.jpg",
    accentColorClass: "from-emerald-900/80 via-emerald-800/60 to-black/80",
    order: 1,
  },
  {
    slug: "attars",
    name: "Attars & Scents",
    description: "Oil-based fragrances inspired by the lanes of Bhendi Bazaar.",
    heroImage: "/images/categories/attars-hero.jpg",
    accentColorClass: "from-amber-900/80 via-amber-800/60 to-black/80",
    order: 2,
  },
  {
    slug: "jewellery",
    name: "Jewellery",
    description:
      "Filigree, stones, and gold-toned details for elevated evenings.",
    heroImage: "/images/categories/jewellery-hero.jpg",
    accentColorClass: "from-yellow-900/80 via-yellow-800/60 to-black/80",
    order: 3,
  },
  {
    slug: "prayer-essentials",
    name: "Prayer Essentials",
    description: "Prayer mats, tasbihs, and accessories for sacred routines.",
    heroImage: "/images/categories/prayer-hero.jpg",
    accentColorClass: "from-sky-900/80 via-sky-800/60 to-black/80",
    order: 4,
  },
];
