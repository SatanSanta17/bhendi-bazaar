/**
 * Admin Orders Page
 * List and manage orders with filters
 */

"use client";

import { useAsyncData } from "@/hooks/core/useAsyncData";
import { useMutation } from "@/hooks/core/useMutation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable, Column } from "@/components/admin/data-table";
import { Search, Filter, RefreshCw } from "lucide-react";
import { adminOrderService } from "@/services/admin/orderService";
import type { AdminOrder, OrderListFilters } from "@/domain/admin";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/shared/SectionHeader";

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState<OrderListFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Use new hooks for data fetching
  const {
    data,
    loading: isLoading,
    error,
    refetch,
  } = useAsyncData(() => adminOrderService.getOrders(filters), {
    refetchDependencies: [filters],
  });

  // Use mutation for status updates
  const { mutate: updateStatus, isLoading: isUpdatingStatus } = useMutation(
    ({ orderId, status }: { orderId: string; status: string }) =>
      adminOrderService.updateOrderStatus(orderId, { status }),
    {
      successMessage: "Order status updated!",
      onSuccess: () => refetch(),
    }
  );

  // Extract data with fallbacks
  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateStatus({ orderId, status: newStatus });
  };

  const handleRefresh = () => {
    toast.info("Refreshing orders...");
    refetch().then(() => toast.success("Orders refreshed!"));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns: Column<AdminOrder>[] = [
    {
      key: "code",
      label: "Order Code",
      sortable: true,
      render: (order) => (
        <span className="font-mono font-semibold">{order.code}</span>
      ),
    },
    {
      key: "userName",
      label: "Customer",
      render: (order) => (
        <div>
          <p className="font-medium">{order.userName || "Guest"}</p>
          <p className="text-sm text-gray-500">{order.userEmail}</p>
        </div>
      ),
    },
    {
      key: "totals",
      label: "Total",
      render: (order) => (
        <span className="font-semibold">
          {formatCurrency((order.totals as any)?.total || 0)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (order) => (
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(order.id, e.target.value)}
          disabled={isUpdatingStatus}
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            order.status === "processing" && "bg-orange-100 text-orange-800",
            order.status === "packed" && "bg-blue-100 text-blue-800",
            order.status === "shipped" && "bg-purple-100 text-purple-800",
            order.status === "delivered" && "bg-green-100 text-green-800"
          )}
        >
          <option value="processing">Processing</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
      ),
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (order) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            order.paymentStatus === "paid"
              ? "bg-green-100 text-green-800"
              : order.paymentStatus === "failed"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {order.paymentStatus || "pending"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (order) => new Date(order.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <SectionHeader overline="Orders" title="Orders" />
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
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
                placeholder="Search by order code, customer..."
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
            value={filters.status || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value || undefined,
                page: 1,
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>

          <select
            value={filters.paymentStatus || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                paymentStatus: e.target.value || undefined,
                page: 1,
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        data={orders}
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


