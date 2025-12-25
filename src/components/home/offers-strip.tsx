"use client";
import { productService } from "@/services/productService";
import { useAsyncData } from "@/hooks/core/useAsyncData";
import { LoadingSkeleton } from "../shared/states/LoadingSkeleton";
import { ErrorState } from "../shared/states/ErrorState";
import { EmptyState } from "../shared/states/EmptyState";
import { Package } from "lucide-react";
import { PriceDisplay } from "../shared/PriceDisplay";

export function OffersStrip() {
  const {
    data: offers,
    loading,
    error,
    refetch,
  } = useAsyncData(() => productService.getOfferProducts());

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} retry={refetch} />;
  }

  if (offers?.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No offers found"
        description="Try again later"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-dashed border-amber-500/50 bg-gradient-to-r from-amber-50 via-amber-25 to-emerald-50 px-4 py-3 text-xs text-amber-900">
      <div className="flex flex-wrap items-center gap-4">
        <span className="rounded-full bg-amber-600 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-amber-50 shadow-sm">
          Ongoing Offers
        </span>
        <div className="flex flex-1 flex-wrap gap-4">
          {offers?.slice(0, 4).map((offer) => (
            <div
              key={offer.id}
              className="flex items-center gap-2 border-l border-amber-300/70 pl-3 text-[0.7rem]"
            >
              <span className="font-medium uppercase tracking-[0.18em]">
                {offer.name}
              </span>
              {offer.salePrice && (
                <PriceDisplay price={offer.price} salePrice={offer.salePrice} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
