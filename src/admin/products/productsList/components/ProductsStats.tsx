// src/components/admin/products/productsContainer/components/ProductsStats.tsx

import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, XCircle, Star, DollarSign } from "lucide-react";
import type { ProductStats } from "../../types";

interface ProductsStatsProps {
  stats: ProductStats;
}

export function ProductsStats({ stats }: ProductsStatsProps) {
  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Low Stock",
      value: stats.lowStockProducts.toLocaleString(),
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Out of Stock",
      value: stats.outOfStockProducts.toLocaleString(),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Featured",
      value: stats.featuredProducts.toLocaleString(),
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Inventory Value",
      value: `₹${stats.totalInventoryValue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}