/**
 * Admin Edit Product Page
 * Edit an existing product
 */
import { productsDAL } from "@/components/admin/products/products.dal";
import { ProductEditContainer } from "@/components/admin/products/productEdit";
import { LoadingSkeleton } from "@/components/shared/states/LoadingSkeleton";
import { Suspense } from "react";
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await productsDAL.getProductById(id);

  return (
    <div className="max-w-5xl mx-auto">
      <Suspense fallback={<LoadingSkeleton />}>
        <ProductEditContainer product={product} />
      </Suspense>
    </div>
  );
}

