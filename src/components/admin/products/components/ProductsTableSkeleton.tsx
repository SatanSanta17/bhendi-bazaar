import { FiltersSkeleton, PaginationSkeleton, TableSkeleton } from "@/components/shared/states/LoadingSkeleton";

// ⭐ Loading skeleton
export function ProductsTableSkeleton() {
    return (
      <div className="space-y-4">
        {/* Filters skeleton */}
        <FiltersSkeleton />
  
        {/* Table skeleton */}
        <TableSkeleton rows={10} />
  
        {/* Pagination skeleton */}
        <PaginationSkeleton />
      </div>
    );
  }