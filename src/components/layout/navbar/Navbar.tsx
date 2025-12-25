// SIMPLIFIED: components/layout/navbar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { NavbarSearch } from "./NavbarSearch";
import { CategoriesDropdown } from "./CategoriesDropdown";
import { ProfileMenu } from "./ProfileMenu";

export function Navbar() {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasCartItems = cartCount > 0;
  const { status, user } = useAuth();

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur z-10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-[0.2em] uppercase sm:text-xl text-primary">
            Bhendi Bazaar
          </span>
        </Link>

        {/* Middle: categories dropdown + search */}
        <div className="hidden flex-1 items-center gap-4 md:flex">
          <CategoriesDropdown />
          <NavbarSearch />
        </div>

        {/* Right side: auth + cart */}
        <div className="flex items-center gap-3">
          {status === "authenticated" && user ? (
            <ProfileMenu user={user} />
          ) : (
            <Button
              asChild={status !== "loading"}
              disabled={status === "loading"}
              variant="outline"
              className="hidden rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] sm:inline-flex"
            >
              {status === "loading" ? (
                <span>Checking…</span>
              ) : (
                <Link href="/signin">Login</Link>
              )}
            </Button>
          )}

          {/* Orders link for guests */}
          {status !== "authenticated" && (
            <Link
              href="/orders"
              className={cn(
                "hidden text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors sm:inline-block",
                pathname === "/orders" && "text-primary"
              )}
            >
              Orders
            </Link>
          )}

          {/* Cart button */}
          <Button
            asChild={true}
            variant={hasCartItems ? "default" : "outline"}
            disabled={!hasCartItems}
            className={cn(
              "relative flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]",
              !hasCartItems &&
                "cursor-not-allowed border-border/80 bg-muted text-muted-foreground"
            )}
          >
            <Link
              href="/cart"
              onClick={(e) => {
                if (!hasCartItems) e.preventDefault();
              }}
            >
              <ShoppingBag className="mr-1 h-4 w-4" />
              Cart
              {cartCount > 0 && (
                <span className="ml-2 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-semibold leading-none text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}