/**
 * Admin Layout
 * Layout wrapper for admin pages
 */

import { AdminSidebar } from "@/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8 min-w-0">{children}</main>
    </div>
  );
}


