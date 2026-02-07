import { OrderClient } from "@/components/order/order-client";
import { ErrorState } from "@/components/shared/states/ErrorState";
import { LoadingSkeleton } from "@/components/shared/states/LoadingSkeleton";
import { ordersDAL } from "@/data-access-layer/orders.dal";
import { Suspense } from "react";

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params;
  const order = await ordersDAL.getOrderById(orderId);
  if (!order) {
    return <ErrorState message="Order not found" />;
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <OrderClient order={order} />
    </Suspense>
  );

}
