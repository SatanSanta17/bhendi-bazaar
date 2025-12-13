import Link from "next/link";

import type { Product } from "@/domain/product";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasOffer = Boolean(product.salePrice && product.salePrice < product.price);

  return (
    <Link href={`/product/${product.slug}`} className="group h-full">
      <Card className="flex h-full flex-col overflow-hidden border-border/60 bg-card/80 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-emerald-900/30 via-emerald-800/10 to-background">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,250,249,0.18),transparent_55%)]" />
          {/* Placeholder image area; real images can plug into next/image later */}
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover"
            loading="eager"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {hasOffer && (
            <div className="absolute left-3 top-3">
              <Badge className="bg-emerald-800/90 text-[0.65rem] uppercase tracking-[0.2em]">
                Offer
              </Badge>
            </div>
          )}
        </div>
        <CardHeader className="space-y-1 px-4 pb-0 pt-3">
          <p className="line-clamp-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/70">
            {product.categorySlug.replace("-", " ")}
          </p>
          <h3 className="line-clamp-2 font-heading text-base font-semibold tracking-tight">
            {product.name}
          </h3>
        </CardHeader>
        <CardContent className="mt-2 flex flex-1 flex-col px-4 pb-4 pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(product.salePrice ?? product.price)}
            </span>
            {hasOffer && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}


