// hooks/admin/useProductForm.ts

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminProductService } from "@/services/admin/productService";
import type {
  AdminProduct,
  CreateProductInput,
  UpdateProductInput,
} from "@/domain/admin";

interface UseProductFormOptions {
  product?: AdminProduct;
  isEdit: boolean;
  onClearDraft?: () => void;
}

export function useProductForm({ product, isEdit, onClearDraft }: UseProductFormOptions) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const submitProduct = async (data: CreateProductInput) => {
    // Additional validation
    if (!data.images || data.images.length === 0) {
      throw new Error("Please upload at least one image");
    }

    setError(null);
    setSuccessMessage(null);

    try {
      if (isEdit && product) {
        // Update existing product
        await adminProductService.updateProduct(
          product.id,
          data as UpdateProductInput
        );
        setSuccessMessage("Product updated successfully!");
      } else {
        // Create new product
        await adminProductService.createProduct(data);
        setSuccessMessage("Product created successfully!");
        // Clear the saved draft after successful creation
        onClearDraft?.();
      }

      // Navigate back to products list
      setTimeout(() => {
        router.push("/admin/products");
      }, 500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save product";
      setError(errorMessage);
      throw err; // Re-throw so form knows it failed
    }
  };

  return {
    submitProduct,
    error,
    successMessage,
    setError,
  };
}