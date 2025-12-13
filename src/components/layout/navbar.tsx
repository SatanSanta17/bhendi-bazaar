import Link from "next/link";

import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/category/abayas", label: "Abayas" },
  { href: "/category/attars", label: "Attars" },
  { href: "/category/jewellery", label: "Jewellery" },
  { href: "/orders", label: "Orders" },
];

export function Navbar() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span
            className={cn(
              "text-lg font-semibold tracking-[0.2em] uppercase sm:text-xl",
              "text-primary"
            )}
          >
            Bhendi Bazaar
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="rounded-full border border-border/80 px-4 py-1.5 text-xs font-medium tracking-wide uppercase text-foreground transition hover:bg-primary hover:text-primary-foreground"
          >
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}


