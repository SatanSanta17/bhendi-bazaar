/**
 * Admin Users Page
 * Manage users with filters and blocking
 */

"use client";

import { useEffect, useState } from "react";
import { DataTable, Column } from "@/components/admin/data-table";
import { Search } from "lucide-react";
import { adminUserService } from "@/services/admin/userService";
import type { AdminUser, UserListFilters } from "@/domain/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filters, setFilters] = useState<UserListFilters>({
    page: 1,
    limit: 20,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const result = await adminUserService.getUsers(filters);
      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      await adminUserService.toggleBlockUser(userId, !isBlocked);
      loadUsers(); // Reload users
    } catch (error) {
      console.error("Failed to toggle block:", error);
      alert("Failed to update user status");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      label: "User",
      render: (user) => (
        <div>
          <p className="font-medium">{user.name || "N/A"}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          {user.mobile && (
            <p className="text-sm text-gray-500">{user.mobile}</p>
          )}
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (user) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.role === "ADMIN"
              ? "bg-purple-100 text-purple-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: "ordersCount",
      label: "Orders",
      render: (user) => user.ordersCount || 0,
    },
    {
      key: "totalSpent",
      label: "Total Spent",
      render: (user) => formatCurrency(user.totalSpent || 0),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
      key: "isBlocked",
      label: "Status",
      render: (user) => (
        <button
          onClick={() => handleToggleBlock(user.id, user.isBlocked)}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.isBlocked
              ? "bg-red-100 text-red-800 hover:bg-red-200"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          {user.isBlocked ? "Blocked" : "Active"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Users
          </h1>
          <p className="text-gray-600 mt-1">Manage platform users</p>
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
                placeholder="Search by name, email, mobile..."
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
            value={filters.role || ""}
            onChange={(e) =>
              setFilters({ ...filters, role: e.target.value || undefined, page: 1 })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={
              filters.isBlocked === undefined
                ? ""
                : filters.isBlocked
                ? "blocked"
                : "active"
            }
            onChange={(e) =>
              setFilters({
                ...filters,
                isBlocked:
                  e.target.value === ""
                    ? undefined
                    : e.target.value === "blocked",
                page: 1,
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        data={users}
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


