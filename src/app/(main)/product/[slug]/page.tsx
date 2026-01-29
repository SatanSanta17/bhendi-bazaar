import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetails } from "@/components/product/product-details";
import { Reviews } from "@/components/product/reviews";
import { SimilarProducts } from "@/components/product/similar-products";
import { LoadingSkeleton } from "@/components/shared/states/LoadingSkeleton";
import { productsDAL } from "@/data-access-layer/products.dal";
import { Suspense } from "react";
import { ProductPageSkeleton } from "@/components/shared/states/LoadingSkeleton";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await productsDAL.getProductBySlug(slug);
  const similar = await productsDAL.getSimilarProducts(slug, 4);
  return (
    <div className="space-y-8">
      <Suspense fallback={<ProductPageSkeleton />}>
        <div className="grid gap-8 lg:grid-cols-2">
          <ProductGallery {...product} />
          <ProductDetails {...product} />
        </div>
      </Suspense>
      <Suspense fallback={<LoadingSkeleton />}>
        <Reviews product={product} />
      </Suspense>
      <Suspense fallback={<LoadingSkeleton />}>
        <SimilarProducts products={similar} />
      </Suspense>
    </div>
  );
}
