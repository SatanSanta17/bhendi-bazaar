// NEW VERSION - category-sections.tsx

"use client";

import Link from "next/link";
import { categoryService } from "@/services/categoryService";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { LoadingSpinner } from "@/components/shared/states/LoadingSpinner";
import { useAsyncData } from "@/hooks/core/useAsyncData";

export function CategorySections() {
  const { data: categories, loading } = useAsyncData(() =>
    categoryService.getCategories()
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!categories?.length) return null;

  return (
    <section className="space-y-4">
      <SectionHeader overline="Categories" title="Browse by lane" />
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((category) => (
          <Link key={category.slug} href={`/category/${category.slug}`}>
            <Card className="relative overflow-hidden border-border/70 bg-card/80 p-5 transition hover:-translate-y-1 hover:border-emerald-500/70 hover:shadow-md">
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${category.accentColorClass}`}
              />
              <div className="relative space-y-1 text-emerald-50">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-emerald-100/70">
                  Category
                </p>
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  {category.name}
                </h3>
                <p className="text-xs text-emerald-50/85">
                  {category.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
