import { OrderSummary } from "@/components/order/order-summary";
import { SectionHeader } from "../shared/SectionHeader";
import { ShareButton } from "../shared/ShareButton";
import { Order } from "@/domain/order";

interface OrderClientProps {
  order: Order;
}

export function OrderClient({ order }: OrderClientProps) {

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <SectionHeader
              overline="Order"
              title="Thank you for shopping at Bhendi Bazaar"
              description="Your order has been placed successfully."
            />
          </div>
          <ShareButton
            url={`${
              typeof window !== "undefined" ? window.location.origin : ""
              }/order/${order.id}`}
            title={`Order ${order.code} - Bhendi Bazaar`}
            text={`Check out my order from Bhendi Bazaar: ${order.code}`}
            variant="outline"
            size="sm"
            className="shrink-0"
          />
        </div>
      </header>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <OrderSummary order={order} showShare={true} />
      </div>
    </div>
  );
}


