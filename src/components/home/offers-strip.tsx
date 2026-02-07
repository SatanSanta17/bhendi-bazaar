import { PriceDisplay } from "../shared/PriceDisplay";
import { Product } from "@/domain/product";

export async function OffersStrip({ offers }: { offers: Product[] }) {

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
