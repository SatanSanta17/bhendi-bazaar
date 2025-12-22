// src/hooks/useCartSync.ts

import { useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { cartService } from "@/services/cartService";

export function useCartSync() {
  const { data: session, status } = useSession();
  const items = useCartStore((state) => state.items);
  const setItems = useCartStore((state) => state.setItems);
  const setSyncing = useCartStore((state) => state.setSyncing);
  const setSyncError = useCartStore((state) => state.setSyncError);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedItemsRef = useRef<string>("");
  const hasSyncedOnLoginRef = useRef(false);

  const syncOnLogin = useCallback(async () => {
    if (!session?.user?.id || hasSyncedOnLoginRef.current) return;

    try {
      setSyncing(true);
      setSyncError(null);

      const mergedItems = await cartService.syncCart(items);

      setItems(mergedItems);
      lastSyncedItemsRef.current = JSON.stringify(mergedItems);
      hasSyncedOnLoginRef.current = true;
    } catch (error) {
      console.error("[useCartSync] Login sync failed:", error);
      setSyncError("Failed to sync cart");
    } finally {
      setSyncing(false);
    }
  }, [session?.user?.id, items, setItems, setSyncing, setSyncError]);

  const syncToServer = useCallback(
    async (cartItems: typeof items) => {
      if (!session?.user?.id) return;

      try {
        await cartService.updateCart(cartItems);
        lastSyncedItemsRef.current = JSON.stringify(cartItems);
        setSyncError(null);
      } catch (error) {
        console.error("[useCartSync] Background sync failed:", error);
        setSyncError("Failed to sync cart");
      }
    },
    [session?.user?.id, setSyncError]
  );

  useEffect(() => {
    if (status === "authenticated" && !hasSyncedOnLoginRef.current) {
      syncOnLogin();
    }
    if (status === "unauthenticated") {
      hasSyncedOnLoginRef.current = false;
    }
  }, [status, syncOnLogin]);

  useEffect(() => {
    if (status !== "authenticated" || !hasSyncedOnLoginRef.current) {
      return;
    }

    const currentItemsStr = JSON.stringify(items);

    if (currentItemsStr === lastSyncedItemsRef.current) {
      return;
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncToServer(items);
    }, 1000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [items, status, syncToServer]);

  return {
    isSyncing: useCartStore((state) => state.isSyncing),
    syncError: useCartStore((state) => state.lastSyncError),
  };
}