// NEW: components/layout/navbar/CategoriesDropdown.tsx

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useAsyncData } from "@/hooks/core/useAsyncData";
import { categoryService } from "@/services/categoryService";
import { LoadingSpinner } from "@/components/shared/states/LoadingSpinner";

export function CategoriesDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: categories, loading } = useAsyncData(
    () => categoryService.getCategories()
  );

  useClickOutside(dropdownRef as React.RefObject<HTMLElement>, () =>
    setOpen(false)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
      >
        Categories
        <span className="text-[0.6rem] leading-none">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-52 rounded-xl border border-border/70 bg-popover/95 p-1 text-xs shadow-lg">
          {loading ? (
            <div className="flex justify-center p-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            categories?.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {category.name}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}