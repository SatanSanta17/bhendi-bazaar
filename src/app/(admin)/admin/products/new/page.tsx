/**
 * Admin New Product Page
 * Create a new product
 */

import { ProductAddContainer } from "@/components/admin/products/productAdd";

export default function NewProductPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <ProductAddContainer />
    </div>
  );
}

