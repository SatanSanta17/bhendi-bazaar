// hooks/product/useStockCheck.ts

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface StockCheckItem {
  productId: string;
  quantity: number;
}

interface StockCheckResult {
  available: boolean;
  issues: Array<{ productId: string; message: string }>;
}

export function useStockCheck() {
  const [checking, setChecking] = useState(false);

  const checkStock = useCallback(
    async (items: StockCheckItem[]): Promise<StockCheckResult> => {
      if (items.length === 0) {
        return { available: true, issues: [] };
      }

      try {
        setChecking(true);

        const response = await fetch("/api/products/check-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });

        if (!response.ok) {
          throw new Error("Stock check failed");
        }

        const data = await response.json();

        if (!data.available) {
          const issues = data.items
            .filter((item: any) => !item.available)
            .map((item: any) => ({
              productId: item.productId,
              message: `Only ${item.stock} available for ${item.name} (you requested ${item.requested})`,
            }));

          return { available: false, issues };
        }

        return { available: true, issues: [] };
      } catch (error) {
        console.error("Stock check failed:", error);
        toast.error("Failed to verify stock availability");
        return {
          available: false,
          issues: [
            { productId: "", message: "Failed to verify stock availability" },
          ],
        };
      } finally {
        setChecking(false);
      }
    },
    []
  );

  return { checkStock, checking };
}