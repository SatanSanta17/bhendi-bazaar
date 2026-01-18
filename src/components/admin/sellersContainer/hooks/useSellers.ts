// src/components/admin/sellersContainer/hooks/useSellers.ts

import { useState, useEffect, useCallback } from "react";
import { sellerService } from "@/services/admin/sellerService";
import type { SellerWithStats, CreateSellerInput } from "@/domain/seller";
import { toast } from "sonner";

export function useSellers() {
  const [sellers, setSellers] = useState<SellerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sellerService.getSellers(true); // with stats
      setSellers(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to load sellers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSellers();
  }, [loadSellers]);

  const createSeller = async (data: CreateSellerInput) => {
    try {
      await sellerService.createSeller(data);
      toast.success("Seller created successfully");
      await loadSellers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create seller");
      throw err;
    }
  };

  const updateSeller = async (id: string, data: Partial<CreateSellerInput>) => {
    try {
      await sellerService.updateSeller(id, data);
      toast.success("Seller updated successfully");
      await loadSellers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update seller");
      throw err;
    }
  };

  const deleteSeller = async (id: string) => {
    try {
      await sellerService.deleteSeller(id);
      toast.success("Seller deleted successfully");
      await loadSellers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete seller");
      throw err;
    }
  };

  // ⭐ Changed: Use updateSeller with isActive instead of separate toggle
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await sellerService.updateSeller(id, { isActive: !currentStatus });
      toast.success(`Seller ${!currentStatus ? "activated" : "deactivated"}`);
      await loadSellers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update seller status");
      throw err;
    }
  };

  return {
    sellers,
    loading,
    error,
    createSeller,
    updateSeller,
    deleteSeller,
    toggleStatus,
    refetch: loadSellers,
  };
}