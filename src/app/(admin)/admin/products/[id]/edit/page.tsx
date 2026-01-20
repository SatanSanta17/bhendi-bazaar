/**
 * Admin Edit Product Page
 * Edit an existing product
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// import { ProductForm } from "@/components/admin/product-form";
// import { adminProductService } from "@/services/admin/productService";
import type { ProductDetails } from "@/components/admin/products/types";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    // try {
    //   setIsLoading(true);
    //   const data = await adminProductService.getProductById(productId);
    //   setProduct(data);
    // } catch (err) {
    //   console.error("Failed to load product:", err);
    //   setError(err instanceof Error ? err.message : "Failed to load product");
    // } finally {
    //   setIsLoading(false);
    // }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600">{error || "The product could not be found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* <ProductForm product={product} isEdit /> */}
    </div>
  );
}

