// components/shared/forms/category/CategoryBasicFields.tsx

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormInput, FormTextarea } from "../FormField";
import type { CreateCategoryInput } from "@/domain/admin";

interface CategoryBasicFieldsProps {
  register: UseFormRegister<CreateCategoryInput>;
  errors: FieldErrors<CreateCategoryInput>;
  onSlugManualEdit?: () => void;
}

export function CategoryBasicFields({
  register,
  errors,
  onSlugManualEdit,
}: CategoryBasicFieldsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Basic Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Category Name"
          required
          placeholder="e.g., Kurtas"
          {...register("name", { required: "Category name is required" })}
          error={errors.name?.message}
        />

        <FormInput
          label="Slug (URL)"
          required
          placeholder="e.g., kurtas"
          {...register("slug", { required: "Slug is required" })}
          error={errors.slug?.message}
          onChange={(e) => {
            register("slug").onChange(e);
            onSlugManualEdit?.();
          }}
        />

        <div className="md:col-span-2">
          <FormTextarea
            label="Description"
            required
            placeholder="Detailed category description..."
            rows={4}
            {...register("description", {
              required: "Description is required",
            })}
            error={errors.description?.message}
          />
        </div>

        <FormInput
          label="Display Order"
          type="number"
          min="0"
          placeholder="0"
          {...register("order", { valueAsNumber: true })}
          hint="Lower numbers appear first"
        />
      </div>
    </div>
  );
}

