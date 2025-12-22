"use client";

import { useEffect, useState } from "react";

import type { Order } from "@/domain/order";
import { orderService } from "@/services/orderService";
import { OrderSummary } from "@/components/order/order-summary";
import { OrderTracking } from "@/components/order/order-tracking";

interface OrderClientProps {
  orderId: string;
}

export function OrderClient({ orderId }: OrderClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getOrderById(orderId);
        if (mounted) {
          setOrder(data);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch order"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchOrder();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading order...</p>;
  }

  if (error || !order) {
    return (
      <p className="text-sm text-muted-foreground">
        {error || "We could not locate this order."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Order
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Thank you for shopping at Bhendi Bazaar
        </h1>
        <p className="text-xs text-muted-foreground">
          Your order has been placed successfully.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <OrderSummary order={order} />
        <OrderTracking order={order} />
      </div>
    </div>
  );
}


