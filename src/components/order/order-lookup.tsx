// src/components/order/order-lookup.tsx
"use client";

import { useState } from "react";
import { orderService } from "@/services/orderService";
import type { Order } from "@/domain/order";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "./order-summary";
import { OrderTracking } from "./order-tracking";

export function OrderLookup() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const orders = await orderService.list(); // localStorage for now
      const found = orders.find(
        (o) => o.code.toLowerCase() === trimmed.toLowerCase(),
      );
      if (!found) {
        setError("We couldn’t find an order with that ID in this browser.");
      } else {
        setOrder(found);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 text-sm">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border/70 bg-card/80 p-5"
      >
        <header className="space-y-1 text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
            Track order
          </p>
          <p className="text-xs text-muted-foreground">
            Enter your Bhendi Bazaar order ID (for now, tracked in this
            browser’s history).
          </p>
        </header>
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            Order ID
          </label>
          <Input
            placeholder="e.g. BB-1001"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
        <Button
          type="submit"
          disabled={!code.trim() || loading}
          className="w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
        >
          {loading ? "Searching…" : "Find order"}
        </Button>
        {error && (
          <p className="text-[0.7rem] text-destructive">
            {error}
          </p>
        )}
      </form>

      {order && (
        <div className="space-y-4">
          <OrderSummary order={order} />
          <OrderTracking order={order} />
        </div>
      )}
    </div>
  );
}