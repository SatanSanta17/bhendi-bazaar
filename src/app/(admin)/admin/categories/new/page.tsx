/**
 * Admin New Category Page
 * Create a new category
 */

import { CategoryForm } from "@/components/admin/category-form";

export default function NewCategoryPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <CategoryForm />
    </div>
  );
}

