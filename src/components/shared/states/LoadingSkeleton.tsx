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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex gap-4">
        <div className="flex-1 h-10 bg-gray-200 animate-pulse rounded-lg" />
        <div className="w-40 h-10 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

export function PaginationSkeleton() {
  return (
    <div className="flex justify-between items-center">
      <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-10 h-10 bg-gray-200 animate-pulse rounded"
          />
        ))}
      </div>
    </div>
  );
}