// src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { useCartSync } from "@/hooks/cart/useCartSync";
import { ProfileProvider } from "@/context/ProfileContext";
import { Session } from "next-auth";
function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync(); // ← Initialize cart sync globally
  return <>{children}</>;
}

export function Providers({ children, session }: { children: React.ReactNode, session: Session | null }) {
  return (
    <SessionProvider session={session}>
      <CartSyncProvider>
        <Toaster position="top-right" richColors />
        <ProfileProvider>{children}</ProfileProvider>
      </CartSyncProvider>
    </SessionProvider>
  );
}
