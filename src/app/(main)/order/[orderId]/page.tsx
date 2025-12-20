import { OrderClient } from "@/components/order/order-client";

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params;
  return <OrderClient orderId={orderId} />;
}
