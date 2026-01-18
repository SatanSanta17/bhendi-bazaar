// src/components/admin/sellersContainer/components/SellersTable.tsx

"use client";

import { DataTable, Column } from "@/components/admin/data-table";
import { Edit, Trash2, CheckCircle, XCircle, MapPin, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SellerWithStats } from "@/domain/seller";

interface SellersTableProps {
  sellers: SellerWithStats[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onView: (seller: SellerWithStats) => void;
  onEdit: (seller: SellerWithStats) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export function SellersTable({
  sellers,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  isLoading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}: SellersTableProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const columns: Column<SellerWithStats>[] = [
    {
      key: "code",
      label: "Code",
      render: (seller) => (
        <span className="font-mono text-sm font-medium">{seller.code}</span>
      ),
    },
    {
      key: "name",
      label: "Seller",
      render: (seller) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
            {seller.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{seller.name}</p>
            <p className="text-sm text-gray-500">{seller.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (seller) => (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">
              {seller.defaultCity}, {seller.defaultState}
            </p>
            <p className="text-gray-500">Pincode: {seller.defaultPincode}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (seller) => (
        <div className="text-sm space-y-1">
          {seller.phone && (
            <p className="font-medium text-gray-900">{seller.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: "stats",
      label: "Products",
      render: (seller) => (
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {seller.productCount || 0}
            </p>
            <p className="text-xs text-gray-500">Products</p>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-2xl font-bold text-emerald-600">
              {seller.totalStock || 0}
            </p>
            <p className="text-xs text-gray-500">Stock</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (seller) => (
        <Badge
          variant={seller.isActive ? "default" : "secondary"}
          className={seller.isActive ? "bg-green-500" : ""}
        >
          {seller.isActive ? (
            <>
              <CheckCircle className="mr-1 h-3 w-3" />
              Active
            </>
          ) : (
            <>
              <XCircle className="mr-1 h-3 w-3" />
              Inactive
            </>
          )}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (seller) => (
        <div className="flex items-center gap-2">
          {/* ⭐ NEW: View button */}
      <button
        onClick={() => onView(seller)}
        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        title="View seller details"
      >
        <Eye className="w-4 h-4" />
      </button>
      
          <button
            onClick={() => onEdit(seller)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit seller"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* <div className="flex items-center gap-2">
            <Switch
              checked={seller.isActive}
              onCheckedChange={() => onToggleStatus(seller.id, seller.isActive)}
              className="data-[state=checked]:bg-green-500"
            />
            <span
              className={`text-xs font-medium ${
                seller.isActive ? "text-green-600" : "text-gray-400"
              }`}
            >
              {seller.isActive ? "Active" : "Inactive"}
            </span>
          </div> */}

          <button
            onClick={() => onDelete(seller.id, seller.name)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete seller"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Showing X-Y of Z results */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <p>
          Showing {startItem} to {endItem} of {totalItems} sellers
        </p>
      </div>
      <div className="overflow-x-auto">
        <DataTable
          data={sellers}
          columns={columns}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
