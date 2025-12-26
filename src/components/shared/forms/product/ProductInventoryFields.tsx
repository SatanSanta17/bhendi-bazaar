// components/shared/forms/product/ProductInventoryFields.tsx

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormInput } from "../FormField";
import type { CreateProductInput } from "@/domain/admin";

interface ProductInventoryFieldsProps {
  register: UseFormRegister<CreateProductInput>;
  errors: FieldErrors<CreateProductInput>;
}

export function ProductInventoryFields({
  register,
  errors,
}: ProductInventoryFieldsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Stock Quantity"
          required
          type="number"
          min="0"
          placeholder="0"
          {...register("stock", {
            required: "Stock quantity is required",
            valueAsNumber: true,
            min: { value: 0, message: "Stock cannot be negative" },
          })}
          error={errors.stock?.message}
        />

        <FormInput
          label="Low Stock Threshold"
          type="number"
          min="0"
          placeholder="10"
          {...register("lowStockThreshold", { valueAsNumber: true })}
          hint="Alert when stock falls below this number"
        />
      </div>
    </div>
  );
}