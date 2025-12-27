// NEW VERSION - admin/products/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { DataTable, Column } from "@/components/admin/data-table";
import { adminProductService } from "@/services/admin/productService";
import { useAsyncData } from "@/hooks/core/useAsyncData";
import { useMutation } from "@/hooks/core/useMutation";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { StockBadge } from "@/components/shared/badges/StatusBadge";
import type { AdminProduct, ProductListFilters } from "@/domain/admin";
import { ProductFlag } from "@/types/product";

export default function AdminProductsPage() {
  const [filters, setFilters] = useState<ProductListFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Use your new hooks!
  const {
    data,
    loading: isLoading,
    error,
    refetch,
  } = useAsyncData(() => adminProductService.getProducts(filters), {
    refetchDependencies: [filters],
  });

  const { mutate: deleteProduct, isLoading: isDeleting } = useMutation(
    adminProductService.deleteProduct,
    {
      successMessage: "Product deleted successfully!",
      onSuccess: () => refetch(),
    }
  );

  const products = data?.products || [];
  const totalPages = data?.totalPages || 1;

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    await deleteProduct(productId);
  };

  const columns: Column<AdminProduct>[] = [
    {
      key: "name",
      label: "Product",
      render: (product) => (
        <div className="flex items-center gap-3">
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-12 h-12 object-cover rounded"
          />
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-500">{product.categoryName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "sku",
      label: "SKU",
      render: (product) => (
        <span className="font-mono text-sm">{product.sku || "—"}</span>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (product) => (
        <PriceDisplay
          price={product.price}
          salePrice={product.salePrice}
          size="sm"
          showBadge={false}
        />
      ),
    },
    {
      key: "stock",
      label: "Stock",
      sortable: true,
      render: (product) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{product.stock}</span>
          <StockBadge
            stock={product.stock}
            threshold={product.lowStockThreshold}
          />
        </div>
      ),
    },
    {
      key: "badges",
      label: "Badges",
      render: (product) => (
        <div className="flex flex-wrap gap-1">
          {product.flags.includes(ProductFlag.FEATURED) && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
              Featured
            </span>
          )}
          {product.flags.includes(ProductFlag.ON_OFFER) && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
              Offer
            </span>
          )}
          {product.flags.includes(ProductFlag.HERO) && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Hero
            </span>
          )}
          {product.flags.includes(ProductFlag.NEW_ARRIVAL) && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              New
            </span>
          )}
          {product.flags.includes(ProductFlag.CLEARANCE_SALE) && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
              Clearance
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (product) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit product"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleDelete(product.id, product.name)}
            disabled={isDeleting}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Products
          </h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, SKU..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>

          <select
            value={filters.lowStock ? "low" : filters.outOfStock ? "out" : ""}
            onChange={(e) => {
              const value = e.target.value;
              setFilters({
                ...filters,
                lowStock: value === "low",
                outOfStock: value === "out",
                page: 1,
              });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <DataTable
        data={products}
        columns={columns}
        totalPages={totalPages}
        currentPage={filters.page || 1}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onSort={(key, order) =>
          setFilters({ ...filters, sortBy: key as any, sortOrder: order })
        }
        isLoading={isLoading}
      />
    </div>
  );
}
