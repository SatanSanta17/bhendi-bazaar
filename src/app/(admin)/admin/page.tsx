/**
 * Admin Dashboard Page
 * Main dashboard with statistics and metrics
 */

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatsCard } from "@/components/admin/stats-card";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Clock,
  RefreshCw,
} from "lucide-react";
import { adminDashboardService } from "@/services/admin/dashboardService";
import type { DashboardStats, RecentActivity } from "@/domain/admin";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsData, activitiesData] = await Promise.all([
        adminDashboardService.getDashboardStats(),
        adminDashboardService.getRecentActivities(10),
      ]);
      setStats(statsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      toast.info("Refreshing dashboard...");
      await loadDashboardData();
      toast.success("Dashboard refreshed successfully!");
    } catch (error) {
      console.error("Failed to refresh dashboard:", error);
      toast.error("Failed to refresh dashboard");
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

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome to Bhendi Bazaar Admin Panel
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Revenue Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Today"
            value={formatCurrency(stats.revenue.today)}
            icon={DollarSign}
          />
          <StatsCard
            title="This Week"
            value={formatCurrency(stats.revenue.week)}
            icon={TrendingUp}
          />
          <StatsCard
            title="This Month"
            value={formatCurrency(stats.revenue.month)}
            icon={DollarSign}
          />
          <StatsCard
            title="This Year"
            value={formatCurrency(stats.revenue.year)}
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Key Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Orders"
            value={stats.orders.total}
            icon={ShoppingCart}
            description={`${stats.orders.todayCount} today`}
          />
          <StatsCard
            title="Total Products"
            value={stats.products.total}
            icon={Package}
            description={`${stats.products.lowStock} low stock`}
          />
          <StatsCard
            title="Total Customers"
            value={stats.customers.total}
            icon={Users}
            description={`${stats.customers.active} active`}
          />
        </div>
      </div>

      {/* Order Status Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Order Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Processing</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {stats.orders.processing}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Packed</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {stats.orders.packed}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Shipped</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {stats.orders.shipped}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {stats.orders.delivered}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 flex items-start gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

