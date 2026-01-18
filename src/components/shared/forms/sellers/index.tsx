import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  createSellerSchema,
  type CreateSellerInput,
} from "@/lib/validation/schemas/seller.schema";
import type { Seller } from "@/domain/seller";
import { SellerBasicFields } from "./SellerBasicFields";
import { SellerLocationFields } from "./SellerLocationFields";
import { SellerBusinessFields } from "./SellerBusinessFields";

interface SellerFormProps {
  seller?: Seller;
  onSubmit: (data: CreateSellerInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  readOnly?: boolean;
}

export function SellerForm({
  seller,
  onSubmit,
  onCancel,
  isSubmitting,
  readOnly = false,
}: SellerFormProps) {
  const isEdit = !!seller;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSellerInput>({
    resolver: zodResolver(createSellerSchema),
    defaultValues: {
      code: seller?.code || "",
      name: seller?.name || "",
      email: seller?.email || "",
      phone: seller?.phone || "",
      contactPerson: seller?.contactPerson || "",
      defaultPincode: seller?.defaultPincode || "",
      defaultCity: seller?.defaultCity || "",
      defaultState: seller?.defaultState || "",
      defaultAddress: seller?.defaultAddress || "",
      businessName: seller?.businessName || "",
      gstNumber: seller?.gstNumber || "",
      panNumber: seller?.panNumber || "",
      isActive: seller?.isActive ?? true,
      description: seller?.description || "",
    },
  });

  const isActive = watch("isActive");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <SellerBasicFields
        register={register}
        errors={errors}
        isEdit={isEdit}
        readOnly={readOnly}
      />

      {/* Shipping Location */}
      <SellerLocationFields
        register={register}
        errors={errors}
        readOnly={readOnly}
      />

      {/* Business Details */}
      <SellerBusinessFields
        register={register}
        errors={errors}
        readOnly={readOnly}
      />

      {/* Status */}
      {!readOnly && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive sellers cannot list new products
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEdit
              ? "Update Seller"
              : "Create Seller"}
          </Button>
        )}
      </div>
    </form>
  );
}
