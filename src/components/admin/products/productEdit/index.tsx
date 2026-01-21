// components/admin/products/productAdd/index.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { adminCategoryService } from "@/services/admin/categoryService";
import type { AdminCategory } from "@/domain/admin";
import type { Seller } from "@/domain/seller";
import { ProductForm } from "@/components/shared/forms/product";
import { sellerService } from "@/services/admin/sellerService";
import { useProducts } from "../useProducts";
import type { ProductDetails } from "../types";

export function ProductEditContainer({ product }: { product: ProductDetails }) {
    const router = useRouter();
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const { updateProduct, isLoading, error, successMessage } = useProducts();

    // Load categories and sellers
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [categoriesResult, sellersResult] = await Promise.all([
                adminCategoryService.getCategories({ limit: 100 }),
                sellerService.getSellers()
            ]);
            
            setCategories(categoriesResult.categories);
            setSellers(sellersResult.filter((s: Seller) => s.isActive));
            setIsDataLoaded(true);
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    };

    const handleCancel = () => {
        router.push("/admin/products");
    };

    // Don't render form until data is loaded
    if (!isDataLoaded) {
        return <div className="p-8 text-center">Loading...</div>;
    }


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
                            Edit Product: {product.name}
                        </h1>
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
                product={product}
                categories={categories}
                sellers={sellers}
                onSubmit={updateProduct}
                onCancel={handleCancel}
                isSubmitting={isLoading}
                readOnly={false}
            />

        </div>
    );
}