/**
 * Enhanced Order Tracking with Shipping Integration
 * 
 * Shows order status and shipment tracking information
 */

"use client";

import { useState, useEffect } from "react";
import { OrderTrackingWidget } from "@/components/shipping/OrderTrackingWidget";
import { SectionHeader } from "../shared/SectionHeader";
import { Package, Truck } from "lucide-react";
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

interface OrderTrackingWithShippingProps {
  order: Order;
}

export function OrderTrackingWithShipping({ order }: OrderTrackingWithShippingProps) {
  const currentIndex = statusOrder.indexOf(order.status);
  const hasShippingInfo = order.shipping.trackingNumber;

  return (
    <div className="space-y-4">
      {/* Order Status Timeline */}
      <section className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-4 text-sm">
        <SectionHeader overline="Order" title={`Order ${order.code}`} />
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

        {/* Shipping Info Summary */}
        {order.shipping.shippingCost !== undefined && order.shipping.shippingCost > 0 && (
          <div className="mt-3 pt-3 border-t border-border/70 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Truck className="h-3 w-3" />
              <span>Shipping: ₹{order.shipping.shippingCost.toFixed(2)}</span>
            </div>
            {order.shipping.courierName && (
              <div className="flex items-center gap-2">
                <Package className="h-3 w-3" />
                <span>via {order.shipping.courierName}</span>
              </div>
            )}
          </div>
        )}

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

      {/* Detailed Tracking Widget (if shipped) */}
      {hasShippingInfo && (
        <OrderTrackingWidget
          trackingNumber={order.shipping.trackingNumber!}
          courierName={order.shipping.courierName}
          trackingUrl={order.shipping.trackingUrl}
          autoRefresh={order.status === "shipped"}
        />
      )}

      {/* Pre-shipment message */}
      {!hasShippingInfo && order.status === "processing" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>Your order is being prepared</strong>
          </p>
          <p className="text-xs text-blue-700 mt-1">
            We'll send you tracking details once your order is shipped.
          </p>
        </div>
      )}

      {!hasShippingInfo && order.status === "packed" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            <strong>Ready to ship</strong>
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Your order is packed and will be handed over to the courier soon.
          </p>
        </div>
      )}
    </div>
  );
}

