// components/admin/productsContainer/hooks/useProducts.ts

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProductsService } from "./productsService";

interface UseProductsOptions {
  onSuccess?: () => void;
}

export function useProducts(options?: UseProductsOptions) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const productsService = new ProductsService();
  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await productsService.deleteProduct(id);
      toast.success("Product deleted successfully");
      
      // ⚡ Trigger server refresh
      router.refresh();
      options?.onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    deleteProduct,
    isLoading,
  };
}