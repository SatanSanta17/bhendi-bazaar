// src/components/admin/sellersContainer/index.tsx

"use client";

import { useState, useMemo } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { SellersTable } from "./components/SellersTable";
import { AddSellerModal } from "./components/AddSellerModal";
import { useSellers } from "./hooks/useSellers";
import type { SellerWithStats, CreateSellerInput } from "@/domain/seller";

const ITEMS_PER_PAGE = 10;

export function SellersContainer() {
  const {
    sellers: allSellers,
    loading,
    error,
    createSeller,
    updateSeller,
    deleteSeller,
    refetch,
  } = useSellers();

  const [showModal, setShowModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState<SellerWithStats | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  ); // ⭐ NEW

  // Client-side filters
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Filter and search sellers
  const filteredSellers = useMemo(() => {
    let filtered = [...allSellers];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (seller) =>
          seller.name.toLowerCase().includes(term) ||
          seller.code.toLowerCase().includes(term) ||
          seller.email.toLowerCase().includes(term) ||
          seller.defaultCity.toLowerCase().includes(term) ||
          seller.businessName?.toLowerCase().includes(term) ||
          seller.gstNumber?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((s) => s.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((s) => !s.isActive);
    }

    return filtered;
  }, [allSellers, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSellers.length / ITEMS_PER_PAGE);
  const paginatedSellers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredSellers.slice(startIndex, endIndex);
  }, [filteredSellers, currentPage]);

  // Reset to page 1 when search/filter changes
  const handleSearch = () => {
    setCurrentPage(1);
  };

  // ⭐ NEW: Handle view
  const handleView = (seller: SellerWithStats) => {
    setEditingSeller(seller);
    setModalMode("view");
    setShowModal(true);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as any);
    setCurrentPage(1);
  };

  const handleCreate = async (data: CreateSellerInput) => {
    setModalMode("create");
    setIsSubmitting(true);
    try {
      await createSeller(data);
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (seller: SellerWithStats) => {
    setEditingSeller(seller);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleUpdate = async (data: CreateSellerInput) => {
    if (!editingSeller) return;

    setIsSubmitting(true);
    try {
      await updateSeller(editingSeller.id, data);
      setShowModal(false);
      setEditingSeller(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSeller(null);
    setModalMode("create");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    await deleteSeller(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Sellers Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage sellers and vendors on your platform (
            {filteredSellers.length}{" "}
            {filteredSellers.length === 1 ? "seller" : "sellers"})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => {
              setModalMode("create");
              setEditingSeller(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Seller
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, code, email, city..."
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredSellers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">
            {searchTerm || statusFilter !== "all"
              ? "No sellers found matching your filters"
              : "No sellers yet. Add your first seller to get started."}
          </p>
        </div>
      )}

      {/* Table */}
      {filteredSellers.length > 0 && (
        <SellersTable
          sellers={paginatedSellers as SellerWithStats[]}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSellers.length}
          itemsPerPage={ITEMS_PER_PAGE}
          isLoading={loading}
          onPageChange={setCurrentPage}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modal */}
      <AddSellerModal
        open={showModal}
        onClose={handleCloseModal}
        onSubmit={editingSeller ? handleUpdate : handleCreate}
        seller={editingSeller || undefined}
        isSubmitting={isSubmitting}
        mode={modalMode}
      />
    </div>
  );
}
