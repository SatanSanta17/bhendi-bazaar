import type { Order } from "@/domain/order";

const statusOrder = ["processing", "packed", "shipped", "delivered"] as const;

function statusLabel(status: Order["status"]) {
  switch (status) {
    case "processing":
      return "Processing in the bazaar";
    case "packed":
      return "Packed at the atelier";
    case "shipped":
      return "On its way";
    case "delivered":
      return "Delivered";
    default:
      return status;
  }
}

interface OrderTrackingProps {
  order: Order;
}

export function OrderTracking({ order }: OrderTrackingProps) {
  const currentIndex = statusOrder.indexOf(order.status);

  return (
    <section className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
      <header>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Order tracking
        </p>
      </header>
      <ol className="space-y-2 text-xs">
        {statusOrder.map((status, index) => {
          const reached = index <= currentIndex;
          return (
            <li key={status} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[0.6rem] ${
                  reached
                    ? "border-emerald-500 bg-emerald-500 text-emerald-50"
                    : "border-border/70 bg-background text-muted-foreground"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={
                  reached ? "text-foreground" : "text-muted-foreground"
                }
              >
                {statusLabel(status)}
              </span>
            </li>
          );
        })}
      </ol>
      {order.estimatedDelivery && (
        <p className="pt-1 text-[0.65rem] text-muted-foreground">
          Estimated delivery{" "}
          {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
          .
        </p>
      )}
    </section>
  );
}


