/**
 * Admin New Product Page
 * Create a new product
 */

import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <ProductForm />
    </div>
  );
}

