"use client";

import Link from "next/link";

import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

export function CartSummary() {
  const totals = useCartStore((state) => state.totals());
  const hasItems = useCartStore((state) => state.items.length > 0);

  return (
    <aside className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
      <header>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Summary
        </p>
      </header>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Savings</span>
          <span className="text-emerald-700">
            −{formatCurrency(totals.discount)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-dashed border-border/70 pt-2 text-sm font-semibold">
          <span>Total</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>
      <Button
        asChild
        disabled={!hasItems}
        className="mt-2 w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
      >
        <Link href="/checkout">Proceed to checkout</Link>
      </Button>
    </aside>
  );
}


