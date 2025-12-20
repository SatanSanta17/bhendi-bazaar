import type { Order } from "@/domain/order";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RecentOrdersSectionProps {
  orders: Order[];
}

export function RecentOrdersSection({ orders }: RecentOrdersSectionProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
              Recent orders
            </p>
            <p className="text-xs text-muted-foreground">
              Your last few orders in this browser.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
          >
            <a href="/orders">View all</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t placed any orders in this browser yet.
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-card/80 p-3 text-xs sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <p className="font-semibold">
                    {order.code} ·{" "}
                    {new Date(order.placedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="text-muted-foreground">
                    {order.address.fullName} · {order.items.length} items
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">
                    {formatCurrency(order.totals.total)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

