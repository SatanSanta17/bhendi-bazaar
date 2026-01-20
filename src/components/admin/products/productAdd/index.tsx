// components/admin/products/productAdd/index.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { adminCategoryService } from "@/services/admin/categoryService";
import { useFormPersist } from "@/hooks/forms/useFormPersist";
import type { AdminCategory } from "@/domain/admin";
import type { Seller } from "@/domain/seller";
import { ProductForm } from "@/components/shared/forms/product";
import { sellerService } from "@/services/admin/sellerService";
import type { ProductDetails, ProductFormInput } from "../types";
import { useProducts } from "../useProducts";

export function ProductAddContainer({ product }: { product?: ProductDetails | undefined }) {
    const router = useRouter();
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    
    const { createProduct, isLoading, error, successMessage } = useProducts();

    // Load categories and sellers
    useEffect(() => {
        loadCategories();
        loadSellers();
    }, []);

    const loadCategories = async () => {
        try {
            const result = await adminCategoryService.getCategories({ limit: 100 });
            setCategories(result.categories);
        } catch (error) {
            console.error("Failed to load categories:", error);
        }
    };

    const loadSellers = async () => {
        try {
            const result = await sellerService.getSellers();
            setSellers(result.filter((s: Seller) => s.isActive));
        } catch (error) {
            console.error("Failed to load sellers:", error);
        }
    };

    const handleCancel = () => {
        router.push("/admin/products");
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/products"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-gray-900">
                            Create New Product
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Add a new product to your catalog
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

            <ProductForm
                categories={categories}
                sellers={sellers}
                onSubmit={createProduct}
                onCancel={handleCancel}
                isSubmitting={isLoading}
                readOnly={false}
            />

        </div>
    );
}