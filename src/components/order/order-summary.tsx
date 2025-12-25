import type { Order } from "@/domain/order";
import { formatCurrency } from "@/lib/format";
import { SectionHeader } from "../shared/SectionHeader";
import { PriceDisplay } from "../shared/PriceDisplay";

interface OrderSummaryProps {
  order: Order;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const paymentLabel =
    order.paymentMethod && order.paymentStatus
      ? `${order.paymentMethod === "razorpay" ? "Razorpay" : "Stripe"} · ${
          order.paymentStatus === "paid"
            ? "Paid"
            : order.paymentStatus === "failed"
            ? "Failed"
            : "Pending"
        }`
      : null;

  return (
    <section className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
      <header className="flex items-baseline justify-between gap-2">
        <SectionHeader overline="Bill summary" title={`Order ${order.code}`} />
        {paymentLabel && (
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-emerald-700">
            {paymentLabel}
          </p>
        )}
      </header>
      <div className="space-y-1 text-xs">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-baseline justify-between gap-2"
          >
            <span className="line-clamp-1 text-muted-foreground">
              {item.name} × {item.quantity}
            </span>
            <span>
              <PriceDisplay
                price={item.price}
                salePrice={item.salePrice}
                size="sm"
              />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-1 border-t border-dashed border-border/70 pt-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <PriceDisplay price={order.totals.subtotal} size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Savings</span>
          <PriceDisplay price={order.totals.discount} size="sm" />
        </div>
        <div className="mt-1 flex items-center justify-between text-sm font-semibold">
          <span>Total</span>
          <PriceDisplay price={order.totals.total} size="sm" />
        </div>
      </div>
    </section>
  );
}


