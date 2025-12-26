// components/shared/forms/product/ProductFlagsFields.tsx

import { Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import type { CreateProductInput } from "@/domain/admin";
import { FormController } from "../FormField";

interface ProductFlagsFieldsProps {
  control: Control<CreateProductInput>;
}

export function ProductFlagsFields({ control }: ProductFlagsFieldsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Product Flags
      </h2>
      <div className="space-y-3">
        <FormController
          name="isFeatured"
          control={control}
          label="Featured Product"
          render={({ field }) => (
            <Checkbox
              label="Featured Product"
              description="Display this product in featured sections"
              checked={field.value as boolean}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <FormController
          name="isHero"
          control={control}
          label="Hero Product"
          render={({ field }) => (
            <Checkbox
              label="Hero Product"
              description="Display this product in hero sections on homepage"
              checked={field.value as boolean}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <FormController
          name="isOnOffer"
          control={control}
          label="On Offer"
          render={({ field }) => (
            <Checkbox
              label="On Offer"
              description="Mark this product as being on special offer"
              checked={field.value as boolean}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
      </div>
    </div>
  );
}