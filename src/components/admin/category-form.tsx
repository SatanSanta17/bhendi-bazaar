/**
 * Category Form Component
 * Shared form for creating and editing categories
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/image-upload";
import { adminCategoryService } from "@/services/admin/categoryService";
import type {
  AdminCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/domain/admin";

interface CategoryFormProps {
  category?: AdminCategory;
  isEdit?: boolean;
}

const ACCENT_COLORS = [
  { value: "bg-emerald-50", label: "Emerald", preview: "bg-emerald-50" },
  { value: "bg-blue-50", label: "Blue", preview: "bg-blue-50" },
  { value: "bg-purple-50", label: "Purple", preview: "bg-purple-50" },
  { value: "bg-pink-50", label: "Pink", preview: "bg-pink-50" },
  { value: "bg-orange-50", label: "Orange", preview: "bg-orange-50" },
  { value: "bg-yellow-50", label: "Yellow", preview: "bg-yellow-50" },
  { value: "bg-red-50", label: "Red", preview: "bg-red-50" },
  { value: "bg-gray-50", label: "Gray", preview: "bg-gray-50" },
];

export function CategoryForm({ category, isEdit = false }: CategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<
    Partial<CreateCategoryInput | UpdateCategoryInput>
  >({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    heroImage: category?.heroImage || "",
    accentColorClass: category?.accentColorClass || "bg-emerald-50",
    order: category?.order || 0,
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEdit && formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.slug || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    if (!formData.heroImage) {
      alert("Please upload a hero image");
      return;
    }

    setIsLoading(true);

    try {
      if (isEdit && category) {
        // Update existing category
        await adminCategoryService.updateCategory(
          category.id,
          formData as UpdateCategoryInput
        );
        alert("Category updated successfully!");
      } else {
        // Create new category
        await adminCategoryService.createCategory(
          formData as CreateCategoryInput
        );
        alert("Category created successfully!");
      }
      router.push("/admin/categories");
    } catch (error) {
      console.error("Failed to save category:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save category"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/categories"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              {isEdit ? "Edit Category" : "Create New Category"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit
                ? "Update category details"
                : "Add a new category to organize products"}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? "Saving..." : "Save Category"}
        </button>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" required>
              Category Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Kurtas"
              required
            />
          </div>

          <div>
            <Label htmlFor="slug" required>
              Slug (URL)
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="e.g., kurtas"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description" required>
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed category description..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              min="0"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: parseInt(e.target.value) })
              }
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first
            </p>
          </div>

          <div>
            <Label htmlFor="accentColorClass" required>
              Accent Color
            </Label>
            <Select
              id="accentColorClass"
              value={formData.accentColorClass}
              onChange={(e) =>
                setFormData({ ...formData, accentColorClass: e.target.value })
              }
              required
            >
              {ACCENT_COLORS.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </Select>
            <div className="mt-2 flex items-center gap-2">
              <div
                className={`w-12 h-12 rounded-lg border-2 border-gray-200 ${formData.accentColorClass}`}
              ></div>
              <span className="text-sm text-gray-600">Preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Hero Image
        </h2>
        <ImageUpload
          label="Category Hero Image"
          value={formData.heroImage ? [formData.heroImage] : []}
          onChange={(urls) =>
            setFormData({ ...formData, heroImage: urls[0] || "" })
          }
          maxImages={1}
          required
          uploadType="categories"
        />
        <p className="text-sm text-gray-500 mt-2">
          This image will be displayed on the category page header. Recommended
          size: 1920x600px
        </p>
      </div>

      {/* Submit Button (Bottom) */}
      <div className="flex justify-end gap-4">
        <Link
          href="/admin/categories"
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? "Saving..." : "Save Category"}
        </button>
      </div>
    </form>
  );
}

