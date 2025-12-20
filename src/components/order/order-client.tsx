"use client";

import { useEffect, useState } from "react";

import type { Order } from "@/domain/order";
import { orderRepository } from "@/server/repositories/orderRepository";
import { OrderSummary } from "@/components/order/order-summary";
import { OrderTracking } from "@/components/order/order-tracking";

interface OrderClientProps {
  orderId: string;
}

export function OrderClient({ orderId }: OrderClientProps) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    let mounted = true;
    orderRepository.findById(orderId).then((found) => {
      if (mounted) setOrder(found ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (!order) {
    return (
      <p className="text-sm text-muted-foreground">
        We could not locate this order in the browser storage yet. Try placing a
        fresh order in this session.
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
          This is a mock order for the guest flow. Details are kept in your
          browser for this device.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <OrderSummary order={order} />
        <OrderTracking order={order} />
      </div>
    </div>
  );
}


