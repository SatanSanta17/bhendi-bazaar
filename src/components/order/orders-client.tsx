"use client";

import { useEffect, useMemo, useState } from "react";

import type { Order } from "@/domain/order";
import { orderService } from "@/services/orderService";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";

export function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (order) =>
        order.code.toLowerCase().includes(q) ||
        order.address.fullName.toLowerCase().includes(q)
    );
  }, [orders, query]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
            Orders
          </p>
          <p className="text-xs text-muted-foreground">
            Your order history with Bhendi Bazaar.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search by code or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {query.trim()
            ? "No orders match your search."
            : "No orders yet. Once you place an order, it will show up here."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-card/80 p-4 text-xs sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <p className="font-semibold">
                  {order.code} ·{" "}
                  {new Date(order.placedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <p className="text-muted-foreground">
                  {order.address.fullName} · {order.items.length} items
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {formatCurrency(order.totals.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


