/**
 * Seed data for Categories
 * Note: heroImage URLs will need to be updated after uploading images to Vercel Blob
 */

import type { SeedCategory } from "./types";

export const seedCategories: SeedCategory[] = [
  {
    id: "cat-abayas",
    slug: "abayas",
    name: "Abayas & Jilbabs",
    description:
      "Flowing silhouettes in deep emeralds, maroons, and midnight blacks. Elegant modest wear crafted from premium fabrics for everyday grace and special occasions.",
    heroImage: "https://placehold.co/1200x600/10b981/ffffff?text=Abayas+%26+Jilbabs", // Placeholder
    accentColorClass: "from-emerald-900/80 via-emerald-800/60 to-black/80",
    order: 1,
  },
  {
    id: "cat-attars",
    slug: "attars",
    name: "Attars & Scents",
    description:
      "Oil-based fragrances inspired by the lanes of Bhendi Bazaar. Traditional attar perfumes blended with oud, musk, rose, and sandalwood for a lasting impression.",
    heroImage: "https://placehold.co/1200x600/f59e0b/ffffff?text=Attars+%26+Scents", // Placeholder
    accentColorClass: "from-amber-900/80 via-amber-800/60 to-black/80",
    order: 2,
  },
  {
    id: "cat-jewellery",
    slug: "jewellery",
    name: "Jewellery",
    description:
      "Filigree, stones, and gold-toned details for elevated evenings. Handcrafted traditional and contemporary jewelry pieces that celebrate timeless elegance.",
    heroImage: "https://placehold.co/1200x600/eab308/ffffff?text=Jewellery", // Placeholder
    accentColorClass: "from-yellow-900/80 via-yellow-800/60 to-black/80",
    order: 3,
  },
  {
    id: "cat-prayer",
    slug: "prayer-essentials",
    name: "Prayer Essentials",
    description:
      "Prayer mats, tasbihs, and accessories for sacred routines. Quality prayer essentials to enhance your spiritual practice and daily devotion.",
    heroImage: "https://placehold.co/1200x600/0ea5e9/ffffff?text=Prayer+Essentials", // Placeholder
    accentColorClass: "from-sky-900/80 via-sky-800/60 to-black/80",
    order: 4,
  },
];

