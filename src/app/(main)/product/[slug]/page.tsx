"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetails } from "@/components/product/product-details";
import { Reviews } from "@/components/product/reviews";
import { SimilarProducts } from "@/components/product/similar-products";
import { productService } from "@/services/productService";
import type { Product } from "@/domain/product";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const [slug, setSlug] = useState<string>("");
  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract slug from params
  useEffect(() => {
    params.then(({ slug }) => setSlug(slug));
  }, [params]);

  // Fetch product and similar products
  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    // Fetch both product and similar products in parallel
    Promise.all([
      productService.getProductBySlug(slug),
      productService.getSimilarProducts(slug, 4),
    ])
      .then(([productData, similarData]) => {
        setProduct(productData);
        setSimilar(similarData);
      })
      .catch((err) => {
        console.error("Failed to load product:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-lg">Loading product...</div>
          <div className="text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-lg text-red-600">Error loading product</div>
          <div className="text-sm text-muted-foreground">{error}</div>
        </div>
      </div>
    );
  }

  // Product not found
  if (!product) {
    notFound();
  }

  // Success - render product
  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <ProductGallery product={product} />
        <ProductDetails product={product} />
      </div>
      <Reviews product={product} />
      {similar.length > 0 && <SimilarProducts products={similar} />}
    </div>
  );
}
