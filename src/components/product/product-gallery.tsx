"use client";

import { useState } from "react";

import type { Product } from "@/domain/product";
import Image from "next/image";
interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = product.images.length ? product.images : [product.thumbnail];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-emerald-950 via-emerald-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,250,249,0.12),transparent_55%)]" />
        <div className="relative flex h-full items-center justify-center px-6 text-center text-xs font-medium uppercase tracking-[0.24em] text-emerald-50/80">
          {/* Placeholder visual in lieu of real product photography */}
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover"
            loading="eager"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-14 flex-1 rounded-lg border text-[0.65rem] uppercase tracking-[0.2em] ${
                activeIndex === index
                  ? "border-emerald-500/80 bg-emerald-950/70 text-emerald-50"
                  : "border-border/70 bg-card/80 text-muted-foreground"
              }`}
            >
              View {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


