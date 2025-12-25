"use client";

import { useAsyncData } from "@/hooks/core/useAsyncData";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetails } from "@/components/product/product-details";
import { Reviews } from "@/components/product/reviews";
import { SimilarProducts } from "@/components/product/similar-products";
import { productService } from "@/services/productService";
import { LoadingSkeleton } from "@/components/shared/states/LoadingSkeleton";
import { ErrorState } from "@/components/shared/states/ErrorState";
import { useEffect, useState } from "react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const [slug, setSlug] = useState<string>("");
  useEffect(() => {
    params.then(({ slug }) => setSlug(slug));
  }, [params]);

  const {
    data: product,
    loading: productLoading,
    error: productError,
    refetch: productRefetch,
  } = useAsyncData(() => productService.getProductBySlug(slug), {
    enabled: !!slug,
  });

  const {
    data: similar,
    loading: similarLoading,
    error: similarError,
    refetch: similarRefetch,
  } = useAsyncData(() => productService.getSimilarProducts(slug, 4), {
    enabled: !!slug,
  });

  // Success - render product
  return (
    <div className="space-y-8">
      {productLoading ? (
        <LoadingSkeleton />
      ) : productError ? (
        <ErrorState message={productError} retry={productRefetch} />
      ) : (
        product && (
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <ProductGallery product={product} />
            <ProductDetails product={product} />
          </div>
        )
      )}
      {product && <Reviews product={product} />}
      {similarLoading ? (
        <LoadingSkeleton />
      ) : similarError ? (
        <ErrorState message={similarError} retry={similarRefetch} />
      ) : (
        similar && similar.length > 0 && <SimilarProducts products={similar} />
      )}
    </div>
  );
}
