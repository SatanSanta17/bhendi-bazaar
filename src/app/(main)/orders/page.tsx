// src/app/(main)/orders/page.tsx
"use client";

import { OrdersClient } from "@/components/order/orders-client";
import { OrderLookup } from "@/components/order/order-lookup";
import { useAuth } from "@/lib/auth";

export default function OrdersPage() {
  const { status } = useAuth();

  return status === "authenticated" ? <OrdersClient /> : <OrderLookup />;
}
