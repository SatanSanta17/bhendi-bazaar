import Link from "next/link";

import { categoryService } from "@/services/categoryService";
import { Card } from "@/components/ui/card";

export async function CategorySections() {
  const categories = await categoryService.list();

  if (!categories.length) return null;

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
            Categories
          </p>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Browse by lane
          </h2>
        </div>
      </header>
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


