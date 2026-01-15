// src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { useCartSync } from "@/hooks/cart/useCartSync";
import { ProfileProvider } from "@/context/ProfileContext";

function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync(); // ← Initialize cart sync globally
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartSyncProvider>
        <Toaster position="top-right" richColors />
        <ProfileProvider>{children}</ProfileProvider>
      </CartSyncProvider>
    </SessionProvider>
  );
}
