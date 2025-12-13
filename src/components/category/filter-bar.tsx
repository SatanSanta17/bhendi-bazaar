"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Input } from "@/components/ui/input";

export function CategoryFilterBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const applyFilters = useCallback(
    (next: { q?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.q != null) {
        if (next.q) params.set("q", next.q);
        else params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Filters
        </p>
        <p className="text-xs text-muted-foreground">
          Start with a name or note – deeper filters will arrive in later
          phases.
        </p>
      </div>
      <div className="w-full max-w-xs">
        <Input
          placeholder="Search within this lane"
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            setSearch(value);
            applyFilters({ q: value || null });
          }}
          className="h-9 text-sm"
        />
      </div>
    </div>
  );
}


