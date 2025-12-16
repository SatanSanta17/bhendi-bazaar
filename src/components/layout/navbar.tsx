"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/lib/auth";
import { categories } from "@/data/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "next-auth/react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasCartItems = cartCount > 0;

  const { status, user } = useAuth();

  const [search, setSearch] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;

    // For now, route to the first category with the query param.
    const firstCategory = categories[0]?.slug ?? "abayas";
    router.push(`/category/${firstCategory}?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur z-10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* Brand */}
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

        {/* Middle: categories dropdown + search */}
        <div className="hidden flex-1 items-center gap-4 md:flex">
          <CategoriesDropdown />
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search the bazaar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
            />
          </form>
        </div>

        {/* Right side: auth + cart */}
        <div className="flex items-center gap-3">
          {status === "authenticated" && user ? (
            <ProfileMenu user={{ name: user.name, email: user.email }} />
          ) : (
            <Button
              asChild={status !== "loading"}
              disabled={status === "loading"}
              variant="outline"
              className="hidden rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] sm:inline-flex"
            >
              {status === "loading" ? (
                <span>Checking…</span> // simple loader text; replace with spinner if you like
              ) : (
                <Link href="/signin">Login</Link>
              )}
            </Button>
          )}

          {/* Orders link only for guests; moves into profile when logged in */}
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
            asChild={hasCartItems}
            variant={hasCartItems ? "default" : "outline"}
            className={cn(
              "relative flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]",
              !hasCartItems &&
                "cursor-default border-border/80 bg-muted text-muted-foreground"
            )}
          >
            {hasCartItems ? (
              <Link href="/cart">
                <ShoppingBag className="mr-1 h-4 w-4" />
                Cart
                {cartCount > 0 && (
                  <span className="ml-2 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-semibold leading-none text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            ) : (
              <span className="inline-flex items-center">
                <ShoppingBag className="mr-1 h-4 w-4" />
                Cart
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Categories dropdown in the header.
 * Uses static categories data for now.
 */
function CategoriesDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
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
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProfileMenuProps {
  user: { name: string; email?: string | null };
}

/**
 * Simple profile dropdown for authenticated users.
 * In Phase 1, logout can just be a placeholder action.
 */
function ProfileMenu({ user }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter(); // add this

  async function handleLogout() {
    console.log("Logout clicked");
    // Clear session without navigating to the NextAuth signout page
    await signOut({ redirect: false });
    console.log("Session cleared");
    // Close the menu and refresh UI
    setOpen(false);
    router.push("/"); // optional: send them home
    router.refresh(); // ensures any session-dependent UI re-renders
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-xs font-semibold uppercase tracking-[0.15em]"
      >
        {user.name?.charAt(0)?.toUpperCase() ?? "B"}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border/70 bg-popover/95 p-2 text-xs shadow-lg">
          <div className="mb-2 border-b border-border/70 pb-2">
            <p className="font-semibold">{user.name}</p>
            {user.email && (
              <p className="text-[0.7rem] text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
          <Link
            href="/orders"
            className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Orders
          </Link>
          <button
            type="button"
            className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
