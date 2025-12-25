/**
 * Product Form Component
 * Shared form for creating and editing products
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
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import { ImageUpload } from "@/components/admin/image-upload";
import { adminProductService } from "@/services/admin/productService";
import { adminCategoryService } from "@/services/admin/categoryService";
import type {
  AdminProduct,
  CreateProductInput,
  UpdateProductInput,
  AdminCategory,
} from "@/domain/admin";

interface ProductFormProps {
  product?: AdminProduct;
  isEdit?: boolean;
}

export function ProductForm({ product, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateProductInput>>({
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
  });

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

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

  // Set thumbnail from first image
  useEffect(() => {
    if (formData.images && formData.images.length > 0) {
      setFormData((prev) => ({
        ...prev,
        thumbnail: formData.images![0],
      }));
    }
  }, [formData.images]);

  const loadCategories = async () => {
    try {
      const result = await adminCategoryService.getCategories({ limit: 100 });
      setCategories(result.categories);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.description || !formData.categoryId) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.price! <= 0) {
      alert("Price must be greater than 0");
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    setIsLoading(true);

    try {
      if (isEdit && product) {
        // Update existing product
        await adminProductService.updateProduct(product.id, formData as UpdateProductInput);
        alert("Product updated successfully!");
      } else {
        // Create new product
        await adminProductService.createProduct(formData as CreateProductInput);
        alert("Product created successfully!");
      }
      router.push("/admin/products");
    } catch (error) {
      console.error("Failed to save product:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save product"
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
              {isEdit ? "Update product details" : "Add a new product to your catalog"}
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? "Saving..." : "Save Product"}
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
              Product Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Velvet Embroidered Kurta"
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
              placeholder="e.g., velvet-embroidered-kurta"
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
              placeholder="Detailed product description..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="categoryId" required>
              Category
            </Label>
            <Select
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="sku">SKU (Optional)</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
              placeholder="e.g., VEK-001"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price" required>
              Regular Price (₹)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) })
              }
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="salePrice">Sale Price (₹)</Label>
            <Input
              id="salePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.salePrice || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  salePrice: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
        <ImageUpload
          label="Product Images"
          value={formData.images || []}
          onChange={(urls) => setFormData({ ...formData, images: urls })}
          maxImages={10}
          required
        />
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stock" required>
              Stock Quantity
            </Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: parseInt(e.target.value) })
              }
              placeholder="0"
              required
            />
          </div>

          <div>
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              min="0"
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lowStockThreshold: parseInt(e.target.value),
                })
              }
              placeholder="10"
            />
          </div>
        </div>
      </div>

      {/* Product Attributes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Product Attributes
        </h2>
        <div className="space-y-4">
          <MultiSelect
            label="Sizes"
            value={formData.sizes || []}
            onChange={(sizes) => setFormData({ ...formData, sizes })}
            placeholder="Type size and press Enter (e.g., S, M, L, XL)"
          />

          <MultiSelect
            label="Colors"
            value={formData.colors || []}
            onChange={(colors) => setFormData({ ...formData, colors })}
            placeholder="Type color and press Enter (e.g., Red, Blue, Black)"
          />

          <MultiSelect
            label="Tags"
            value={formData.tags || []}
            onChange={(tags) => setFormData({ ...formData, tags })}
            placeholder="Type tag and press Enter (e.g., trending, sale)"
          />
        </div>
      </div>

      {/* Product Flags */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Product Flags
        </h2>
        <div className="space-y-3">
          <Checkbox
            label="Featured Product"
            description="Display this product in featured sections"
            checked={formData.isFeatured}
            onChange={(e) =>
              setFormData({ ...formData, isFeatured: e.target.checked })
            }
          />
          <Checkbox
            label="Hero Product"
            description="Display this product in hero sections on homepage"
            checked={formData.isHero}
            onChange={(e) =>
              setFormData({ ...formData, isHero: e.target.checked })
            }
          />
          <Checkbox
            label="On Offer"
            description="Mark this product as being on special offer"
            checked={formData.isOnOffer}
            onChange={(e) =>
              setFormData({ ...formData, isOnOffer: e.target.checked })
            }
          />
        </div>
      </div>

      {/* Submit Button (Bottom) */}
      <div className="flex justify-end gap-4">
        <Link
          href="/admin/products"
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
          {isLoading ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

