import { CartLineItems } from "@/components/cart/cart-line-items";
import { CartSummary } from "@/components/cart/cart-summary";
import { CartHydrator } from "@/components/cart/cart-hydrator";

export default function CartPage() {
  return (
    <div className="space-y-6">
      <CartHydrator />

      <header className="space-y-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Cart
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Your selection from the bazaar
        </h1>
      </header>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
        <CartLineItems />
        <CartSummary />
      </div>
    </div>
  );
}


