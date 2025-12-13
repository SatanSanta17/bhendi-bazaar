import { OrderClient } from "@/components/order/order-client";

interface OrderPageProps {
  params: { orderId: string };
}

export default function OrderPage({ params }: OrderPageProps) {
  return <OrderClient orderId={params.orderId} />;
}


