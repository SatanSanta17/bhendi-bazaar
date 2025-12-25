// components/shared/badges/StatusBadge.tsx

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "text-[0.65rem] font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      status: {
        default: "bg-secondary text-secondary-foreground",
        offer: "bg-emerald-100 text-emerald-900",
        featured: "bg-purple-100 text-purple-800",
        hero: "bg-blue-100 text-blue-800",
        lowStock: "bg-orange-100 text-orange-800",
        outOfStock: "bg-red-100 text-red-800",
        inStock: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        paid: "bg-green-100 text-green-800",
        failed: "bg-red-100 text-red-800",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({
  status,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <Badge className={cn(statusBadgeVariants({ status }), className)}>
      {children}
    </Badge>
  );
}

// Specific badge components for common use cases
export function OfferBadge() {
  return <StatusBadge status="offer">Offer</StatusBadge>;
}

export function DefaultBadge() {
  return <StatusBadge status="default">Default</StatusBadge>;
}

export function StockBadge({ stock, threshold = 10 }: { stock: number; threshold?: number }) {
  if (stock === 0) {
    return <StatusBadge status="outOfStock">Out of Stock</StatusBadge>;
  }
  if (stock <= threshold) {
    return <StatusBadge status="lowStock">Low Stock</StatusBadge>;
  }
  return <StatusBadge status="inStock">In Stock</StatusBadge>;
}