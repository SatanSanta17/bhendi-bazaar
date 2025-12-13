import { CategorySections } from "@/components/home/category-sections";
import { HeroProductsGrid } from "@/components/home/hero-products-grid";
import { HomeHero } from "@/components/home/home-hero";
import { OffersStrip } from "@/components/home/offers-strip";

export default async function HomePage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <HomeHero />
      <HeroProductsGrid />
      <OffersStrip />
      <CategorySections />
    </div>
  );
}


