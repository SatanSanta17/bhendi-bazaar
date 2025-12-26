"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/admin/image-upload";
import { adminCategoryService } from "@/services/admin/categoryService";
import { useFormPersist } from "@/hooks/forms/useFormPersist";
import { useProductForm } from "@/hooks/admin/useProductForm";
import { FormActions } from "@/components/shared/button-groups/FormActions";
import {
  ProductBasicFields,
  ProductPricingFields,
  ProductInventoryFields,
  ProductAttributeFields,
  ProductFlagsFields,
} from "@/components/shared/forms/product";
import type {
  AdminProduct,
  CreateProductInput,
  AdminCategory,
} from "@/domain/admin";
import { FormController } from "../shared/forms/FormField";

interface ProductFormProps {
  product?: AdminProduct;
  isEdit?: boolean;
}

export function ProductForm({ product, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const form = useForm<CreateProductInput>({
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      price: product?.price || 0,
      salePrice: product?.salePrice || undefined,
      currency: product?.currency || "INR",
      categoryId: product?.categoryId || "",
      tags: product?.tags || [],
      isFeatured: product?.isFeatured || false,
      isHero: product?.isHero || false,
      isOnOffer: product?.isOnOffer || false,
      images: product?.images || [],
      thumbnail: product?.thumbnail || "",
      sizes: product?.sizes || [],
      colors: product?.colors || [],
      stock: product?.stock || 0,
      sku: product?.sku || "",
      lowStockThreshold: product?.lowStockThreshold || 10,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const { clearSaved } = useFormPersist("admin-product-draft", form, {
    enabled: !isEdit,
  });
  const { submitProduct, error, successMessage } = useProductForm({
    product,
    isEdit,
    onClearDraft: clearSaved,
  });

  const nameValue = watch("name");
  const imagesValue = watch("images");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isEdit && nameValue && !slugManuallyEdited) {
      const slug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", slug);
    }
  }, [nameValue, isEdit, slugManuallyEdited, setValue]);

  useEffect(() => {
    if (imagesValue && imagesValue.length > 0) {
      setValue("thumbnail", imagesValue[0]);
    }
  }, [imagesValue, setValue]);

  const loadCategories = async () => {
    try {
      const result = await adminCategoryService.getCategories({ limit: 100 });
      setCategories(result.categories);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleCancel = () => {
    router.push("/admin/products");
  };

  return (
    <form onSubmit={handleSubmit(submitProduct)} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              {isEdit ? "Edit Product" : "Create New Product"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? "Update product details"
                : "Add a new product to your catalog"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Form Sections - Clean and composable! */}
      <ProductBasicFields
        register={register}
        errors={errors}
        setValue={setValue}
        categories={categories}
        onSlugManualEdit={() => setSlugManuallyEdited(true)}
      />

      <ProductPricingFields register={register} errors={errors} />

      {/* Images */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
        <FormController
          name="images"
          control={control}
          label="Product Images"
          rules={{ required: "At least one image is required" }}
          render={({ field }) => (
            <ImageUpload
              label="Product Images"
              value={field.value as string[]}
              onChange={field.onChange}
              maxImages={10}
              required
            />
          )}
        />
        {errors.images && (
          <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
        )}
      </div>

      <ProductInventoryFields register={register} errors={errors} />
      <ProductAttributeFields control={control} />
      <ProductFlagsFields control={control} />

      {/* Actions */}
      <FormActions
        onCancel={handleCancel}
        submitLabel="Save Product"
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
