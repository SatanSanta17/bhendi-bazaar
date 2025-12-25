"use client";

import { useAsyncData } from "@/hooks/core/useAsyncData";
import { orderService } from "@/services/orderService";
import { OrderSummary } from "@/components/order/order-summary";
import { OrderTracking } from "@/components/order/order-tracking";
import { LoadingSpinner } from "../shared/states/LoadingSpinner";
import { ErrorState } from "../shared/states/ErrorState";
import { SectionHeader } from "../shared/SectionHeader";

interface OrderClientProps {
  orderId: string;
}

export function OrderClient({ orderId }: OrderClientProps) {
  const {
    data: order,
    loading: isLoading,
    error,
    refetch,
  } = useAsyncData(() => orderService.getOrderById(orderId), {
    refetchDependencies: [orderId],
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !order) {
    return (
      <ErrorState
        message={error || "We could not locate this order."}
        retry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <SectionHeader
          overline="Order"
          title="Thank you for shopping at Bhendi Bazaar"
          description="Your order has been placed successfully."
        />
      </header>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <OrderSummary order={order} />
        <OrderTracking order={order} />
      </div>
    </div>
  );
}


