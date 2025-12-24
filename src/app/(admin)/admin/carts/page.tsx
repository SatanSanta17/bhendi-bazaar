/**
 * Admin Abandoned Carts Page
 * View and track abandoned shopping carts
 */

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable, Column } from "@/components/admin/data-table";
import { ShoppingCart, Mail, Eye, RefreshCw } from "lucide-react";
import { adminCartService } from "@/services/admin/cartService";
import type { AbandonedCart, AbandonedCartFilters } from "@/domain/admin";

export default function AdminAbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [filters, setFilters] = useState<AbandonedCartFilters>({
    page: 1,
    limit: 20,
    minDays: 1,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);

  useEffect(() => {
    loadCarts();
  }, [filters]);

  const loadCarts = async () => {
    try {
      setIsLoading(true);
      const result = await adminCartService.getAbandonedCarts(filters);
      setCarts(result.carts);
      setTotalPages(result.totalPages);
      setTotalValue(result.totalValue);
    } catch (error) {
      console.error("Failed to load abandoned carts:", error);
      toast.error("Failed to load abandoned carts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      toast.info("Refreshing carts...");
      await loadCarts();
      toast.success("Carts refreshed successfully!");
    } catch (error) {
      console.error("Failed to refresh carts:", error);
      toast.error("Failed to refresh carts");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSendReminder = (cart: AbandonedCart) => {
    // TODO: Implement email reminder functionality
    alert(
      `Email reminder feature coming soon!\n\nWould send reminder to: ${cart.userEmail}`
    );
  };

  const columns: Column<AbandonedCart>[] = [
    {
      key: "userName",
      label: "Customer",
      render: (cart) => (
        <div>
          <p className="font-medium">{cart.userName || "Guest"}</p>
          <p className="text-sm text-gray-500">{cart.userEmail}</p>
        </div>
      ),
    },
    {
      key: "itemsCount",
      label: "Items",
      render: (cart) => (
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-gray-400" />
          <span className="font-semibold">{cart.itemsCount}</span>
        </div>
      ),
    },
    {
      key: "totalValue",
      label: "Cart Value",
      sortable: true,
      render: (cart) => (
        <span className="font-semibold text-emerald-600">
          {formatCurrency(cart.totalValue)}
        </span>
      ),
    },
    {
      key: "daysSinceUpdate",
      label: "Abandoned",
      render: (cart) => (
        <div>
          <p className="font-medium">
            {cart.daysSinceUpdate} {cart.daysSinceUpdate === 1 ? "day" : "days"}{" "}
            ago
          </p>
          <p className="text-xs text-gray-500">
            {new Date(cart.updatedAt).toLocaleDateString()}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (cart) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedCart(cart)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View cart details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSendReminder(cart)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Send reminder email"
          >
            <Mail className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Abandoned Carts
          </h1>
          <p className="text-gray-600 mt-1">
            Track and recover abandoned shopping carts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
            <p className="text-sm text-emerald-600 font-medium">Total Value</p>
            <p className="text-2xl font-bold text-emerald-700">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Days Abandoned
            </label>
            <select
              value={filters.minDays}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minDays: parseInt(e.target.value),
                  page: 1,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="1">1+ days</option>
              <option value="2">2+ days</option>
              <option value="3">3+ days</option>
              <option value="7">7+ days</option>
              <option value="14">14+ days</option>
              <option value="30">30+ days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Cart Value
            </label>
            <select
              value={filters.minValue || 0}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minValue: parseInt(e.target.value) || undefined,
                  page: 1,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="0">All Values</option>
              <option value="500">₹500+</option>
              <option value="1000">₹1,000+</option>
              <option value="2000">₹2,000+</option>
              <option value="5000">₹5,000+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Carts Table */}
      <DataTable
        data={carts}
        columns={columns}
        totalPages={totalPages}
        currentPage={filters.page || 1}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onSort={(key, order) =>
          setFilters({ ...filters, sortBy: key as any, sortOrder: order })
        }
        isLoading={isLoading}
      />

      {/* Cart Details Modal */}
      {selectedCart && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedCart(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Cart Details</h2>
              <button
                onClick={() => setSelectedCart(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer Info */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
                <p className="text-sm">
                  <span className="text-gray-600">Name:</span>{" "}
                  {selectedCart.userName || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Email:</span>{" "}
                  {selectedCart.userEmail || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Abandoned:</span>{" "}
                  {selectedCart.daysSinceUpdate} days ago
                </p>
              </div>

              {/* Cart Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Cart Items ({selectedCart.itemsCount})
                </h3>
                <div className="space-y-2">
                  {(selectedCart.items as any[]).map((item: any, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total Value:</span>
                  <span className="font-bold text-2xl text-emerald-600">
                    {formatCurrency(selectedCart.totalValue)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleSendReminder(selectedCart)}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Reminder Email
                </button>
                <button
                  onClick={() => setSelectedCart(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

