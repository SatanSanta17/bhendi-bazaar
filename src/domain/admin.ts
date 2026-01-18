/**
 * Client-side Admin Domain Types
 * Simplified types for admin frontend
 */

// Re-export server types for client use
export type {
  DashboardStats,
  RecentActivity,
  RevenueChart,
} from "../../server/domain/admin/dashboard";

export type {
  AdminUser,
  UserListFilters,
  UserListResult,
} from "../../server/domain/admin/user";

export type {
  AdminOrder,
  OrderListFilters,
  OrderListResult,
} from "../../server/domain/admin/order";

export type {
  AdminProduct,
  ProductFilters,
  ProductListResult,
  CreateProductInput,
  UpdateProductInput,
} from "../../server/domain/admin/product";

export type {
  AdminCategory,
  CategoryListFilters,
  CategoryListResult,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../../server/domain/admin/category";

export type {
  AdminReview,
  ReviewListFilters,
  ReviewListResult,
} from "../../server/domain/admin/review";

export type {
  AbandonedCart,
  AbandonedCartFilters,
  AbandonedCartResult,
} from "../../server/domain/admin/cart";


