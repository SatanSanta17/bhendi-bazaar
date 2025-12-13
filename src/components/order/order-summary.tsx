import type { Order } from "@/domain/order";
import { formatCurrency } from "@/lib/format";

interface OrderSummaryProps {
  order: Order;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <section className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
            Bill summary
          </p>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Order {order.code}
          </h2>
        </div>
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
              {formatCurrency(
                (item.salePrice ?? item.price) * item.quantity,
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-1 border-t border-dashed border-border/70 pt-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(order.totals.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Savings</span>
          <span className="text-emerald-700">
            −{formatCurrency(order.totals.discount)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm font-semibold">
          <span>Total</span>
          <span>{formatCurrency(order.totals.total)}</span>
        </div>
      </div>
    </section>
  );
}


