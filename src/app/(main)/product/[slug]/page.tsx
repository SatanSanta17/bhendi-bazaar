import { notFound } from "next/navigation";

import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetails } from "@/components/product/product-details";
import { Reviews } from "@/components/product/reviews";
import { SimilarProducts } from "@/components/product/similar-products";
import { productService } from "@/services/productService";

interface ProductPageProps {
  params: { slug: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await productService.findBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const similar = await productService.findSimilar(params.slug, 4);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <ProductGallery product={product} />
        <ProductDetails product={product} />
      </div>
      <Reviews product={product} />
      <SimilarProducts products={similar} />
    </div>
  );
}


