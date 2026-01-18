// src/components/shared/forms/seller/SellerBasicFields.tsx

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { CreateSellerInput } from "@/domain/seller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/shared/forms/FormField";
import { Store } from "lucide-react";

interface SellerBasicFieldsProps {
  register: UseFormRegister<CreateSellerInput>;
  errors: FieldErrors<CreateSellerInput>;
  isEdit?: boolean;
  readOnly?: boolean;
}

export function SellerBasicFields({
  register,
  errors,
  isEdit = false,
  readOnly = false,
}: SellerBasicFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Seller Code"
            required
            error={errors.code?.message}
            disabled={isEdit || readOnly}
            placeholder="SEL-001"
            className="uppercase"
            {...register("code")}
          />

          <FormInput
            label="Seller Name"
            required
            error={errors.name?.message}
            disabled={readOnly}
            placeholder="ABC Traders"
            {...register("name")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Email"
            required
            type="email"
            error={errors.email?.message}
            disabled={readOnly}
            placeholder="seller@example.com"
            {...register("email")}
          />

          <FormInput
            label="Phone"
            error={errors.phone?.message}
            disabled={readOnly}
            placeholder="+91 98765 43210"
            {...register("phone")}
          />
        </div>

        <FormInput
          label="Contact Person"
          error={errors.contactPerson?.message}
          disabled={readOnly}
          placeholder="John Doe"
          {...register("contactPerson")}
        />
      </CardContent>
    </Card>
  );
}