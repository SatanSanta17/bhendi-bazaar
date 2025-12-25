// components/shared/states/LoadingSkeleton.tsx

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
  variant?: "text" | "card" | "image" | "button";
}

export function LoadingSkeleton({
  count = 1,
  className,
  variant = "text",
}: LoadingSkeletonProps) {
  const variantClasses = {
    text: "h-4 w-full rounded",
    card: "h-48 w-full rounded-lg",
    image: "aspect-square w-full rounded-lg",
    button: "h-9 w-24 rounded-md",
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-muted",
            variantClasses[variant],
            className
          )}
        />
      ))}
    </>
  );
}

// Specialized variants
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton variant="image" />
      <LoadingSkeleton variant="text" className="w-3/4" />
      <LoadingSkeleton variant="text" className="w-1/2" />
      <LoadingSkeleton variant="button" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <LoadingSkeleton className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-4 w-3/4" />
            <LoadingSkeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}