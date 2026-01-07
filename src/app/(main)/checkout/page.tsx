// src/app/(main)/checkout/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutSummaryWithShipping } from "@/components/checkout/CheckoutSummaryWithShipping";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { LoadingSpinner } from "@/components/shared/states/LoadingSpinner";
import { productService } from "@/services/productService";
import type { Product } from "@/domain/product";
import { ErrorState } from "@/components/shared/states/ErrorState";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const buyNowProductSlug = searchParams.get("buyNow");

  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!!buyNowProductSlug);
  const [error, setError] = useState<string | null>(null);

  // Fetch product if buyNow param exists
  useEffect(() => {
    if (!buyNowProductSlug) return;

    // Sanitize and validate slug
    const sanitizedSlug = buyNowProductSlug.trim().toLowerCase();

    // Basic validation: slug should be alphanumeric with hyphens only
    if (!/^[a-z0-9-]+$/.test(sanitizedSlug)) {
      setError("Invalid product identifier. Showing your cart instead.");
      setLoading(false);
      return;
    }

    // Slug length validation
    if (sanitizedSlug.length < 2 || sanitizedSlug.length > 100) {
      setError("Invalid product identifier. Showing your cart instead.");
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const product = await productService.getProductBySlug(sanitizedSlug);

        // Validate product exists and is available
        if (!product) {
          setError("Product not found. Showing your cart instead.");
          setBuyNowProduct(null);
          return;
        }

        // Check if product is out of stock
        if (product.stock === 0) {
          setError("This product is out of stock. Showing your cart instead.");
          setBuyNowProduct(null);
          return;
        }

        setBuyNowProduct(product);
      } catch (err) {
        console.error("Failed to fetch buy now product:", err);
        setError("Product not found. Showing your cart instead.");
        // Fall back to showing regular cart
        setBuyNowProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [buyNowProductSlug]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        overline="Checkout"
        title="Finalise your Bhendi Bazaar order"
      />

      {error && (
        <ErrorState
          message={error}
          retry={() => {
            window.location.reload();
          }}
        />
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <CheckoutForm buyNowProduct={buyNowProduct} />
        <CheckoutSummaryWithShipping buyNowProduct={buyNowProduct} />
      </div>
    </div>
  );
}
