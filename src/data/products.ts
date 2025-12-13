import type { Product } from "@/domain/product";

export const products: Product[] = [
  {
    id: "p-emerald-madina-abaya",
    slug: "emerald-madina-abaya",
    name: "Emerald Madina Abaya",
    description:
      "A full-length emerald abaya with subtle geometric jaali embroidery inspired by Bhendi Bazaar balconies.",
    price: 4200,
    salePrice: 3690,
    currency: "INR",
    categorySlug: "abayas",
    tags: ["abaya", "evening", "embroidered", "emerald"],
    isFeatured: true,
    isHero: true,
    isOnOffer: true,
    rating: 4.8,
    reviewsCount: 128,
    images: [
      "/images/products/old-quarter-black-jilbab-thumb.jpg",
      "/images/products/old-quarter-black-jilbab-thumb.jpg",
    ],
    thumbnail: "/images/products/old-quarter-black-jilbab-thumb.jpg",
    options: {
      sizes: ["S", "M", "L", "XL"],
      colors: ["Emerald", "Midnight Black"],
    },
  },
  {
    id: "p-old-quarter-black-jilbab",
    slug: "old-quarter-black-jilbab",
    name: "Old Quarter Black Jilbab",
    description:
      "Minimalist black jilbab with a fluid drape, cut for everyday comfort in the old city.",
    price: 3200,
    currency: "INR",
    categorySlug: "abayas",
    tags: ["jilbab", "everyday", "black"],
    isFeatured: true,
    rating: 4.6,
    reviewsCount: 64,
    images: ["/images/products/old-quarter-black-jilbab-1.jpg"],
    thumbnail: "/images/products/old-quarter-black-jilbab-thumb.jpg",
    options: {
      sizes: ["S", "M", "L"],
      colors: ["Black"],
    },
  },
  {
    id: "p-oud-lanes-attar",
    slug: "oud-lanes-attar",
    name: "Oud Lanes Attar",
    description:
      "Concentrated oud attar with notes of spice and wood, reminiscent of evening strolls through the bazaar.",
    price: 1500,
    salePrice: 1290,
    currency: "INR",
    categorySlug: "attars",
    tags: ["attar", "oud", "unisex"],
    isFeatured: true,
    isOnOffer: true,
    rating: 4.9,
    reviewsCount: 210,
    images: ["/images/products/oud-lanes-attar-1.jpg"],
    thumbnail: "/images/products/oud-lanes-attar-thumb.jpg",
  },
  {
    id: "p-noor-filigree-bangle",
    slug: "noor-filigree-bangle",
    name: "Noor Filigree Bangle",
    description:
      "Gold-toned filigree bangle with crescent motifs, perfect for Eid and family gatherings.",
    price: 2600,
    currency: "INR",
    categorySlug: "jewellery",
    tags: ["jewellery", "bangle", "festive"],
    rating: 4.7,
    reviewsCount: 43,
    images: ["/images/products/noor-filigree-bangle-1.jpg"],
    thumbnail: "/images/products/noor-filigree-bangle-thumb.jpg",
  },
];


